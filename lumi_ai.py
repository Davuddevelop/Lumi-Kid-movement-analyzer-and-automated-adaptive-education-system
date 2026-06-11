"""
Lumi AI — Claude-powered voice, robot control, and report generation.
"""
import asyncio
import json
import logging
import os
import random
from collections import deque
import anthropic

_log = logging.getLogger(__name__)

# Without a key every call would hang until timeout before falling back —
# detect once at import so fallbacks fire instantly instead.
AI_ENABLED = bool(os.environ.get("ANTHROPIC_API_KEY"))
if not AI_ENABLED:
    _log.warning(
        "ANTHROPIC_API_KEY is not set — Lumi AI runs in fallback mode "
        "(rule-based responses only). Set the key to enable Claude."
    )

client = anthropic.Anthropic(timeout=15.0, max_retries=1) if AI_ENABLED else None


async def _call_claude(**kwargs):
    """Run the sync Anthropic client in a thread pool — keeps the event loop free."""
    if client is None:
        raise RuntimeError("AI disabled: ANTHROPIC_API_KEY not set")
    return await asyncio.to_thread(client.messages.create, **kwargs)

LUMI_SYSTEM = """You are Lumi, a warm, enthusiastic robot companion for children aged 5-8.

Rules:
- Max 15 words per response
- Use simple, concrete words only (no abstract concepts)
- Always encouraging, never critical
- Celebrate effort not just results
- When child fails: "Let's try together!" not "You made a mistake"
- Never use words: algorithm, optimize, efficient, strategy, methodology
- DO use: try again, great job, wow, let's go, you did it, amazing

Respond ONLY with the spoken text. No quotes, no asterisks, just the words."""

LUMI_CHAT_SYSTEM = """You are Lumi, a friendly robot best friend for children aged 5-8.

Personality:
- Warm, enthusiastic, playful — like a best robot friend
- Use simple words a 5-year-old understands
- Keep answers SHORT (2-3 sentences max)
- Use emojis naturally (1-2 per message)
- Always positive, always encouraging

You can help with:
- How to play the coding game (move the robot with blocks: forward, turn left, turn right)
- What each block does
- Fun facts about robots and technology
- Counting, colors, shapes — simple educational topics
- Cheering the child on when they're stuck or frustrated

When a child is stuck on the game, give HINTS not answers:
- Ask "which block do you think comes first?" rather than telling them
- Say "you're so close!" and guide gently

Game context (use this to personalize responses):
{game_context}

Never use: algorithm, optimize, debug, compile, execute, methodology, strategy
Never be negative, critical, or scary
Never discuss anything not appropriate for young children

Respond in 1-3 short sentences. Use emojis. Be FUN and ENERGETIC! 🤖"""


# ─── Grid helpers ────────────────────────────────────────────────────────────

# direction vectors: 0=North, 1=East, 2=South, 3=West
_DX = {0: 0,  1: 1, 2: 0,  3: -1}
_DY = {0: -1, 1: 0, 2: 1,  3:  0}


def bfs_plan_path(grid_state: dict) -> list[str] | None:
    """
    BFS shortest path (forward / turn_left / turn_right) from current robot
    position+direction to the goal, avoiding obstacles and grid edges.
    Returns a list of command strings, or None if no path exists.
    """
    W = grid_state["grid_size"]["width"]
    H = grid_state["grid_size"]["height"]
    obs = {(o["x"], o["y"]) for o in grid_state.get("obstacles", [])}
    goal = (grid_state["goal"]["x"], grid_state["goal"]["y"])
    sx = grid_state["robot_pos"]["x"]
    sy = grid_state["robot_pos"]["y"]
    sd = grid_state.get("robot_direction", 1)

    start = (sx, sy, sd)
    queue = deque([(start, [])])
    visited = {start}

    while queue:
        (x, y, d), path = queue.popleft()
        if (x, y) == goal:
            return path

        # turn left
        nd = (d - 1) % 4
        s = (x, y, nd)
        if s not in visited:
            visited.add(s)
            queue.append((s, path + ["turn_left"]))

        # turn right
        nd = (d + 1) % 4
        s = (x, y, nd)
        if s not in visited:
            visited.add(s)
            queue.append((s, path + ["turn_right"]))

        # forward
        nx, ny = x + _DX[d], y + _DY[d]
        if 0 <= nx < W and 0 <= ny < H and (nx, ny) not in obs:
            s = (nx, ny, d)
            if s not in visited:
                visited.add(s)
                queue.append((s, path + ["forward"]))

    return None


def _extract_json(text: str) -> dict:
    """Pull the first complete JSON object out of a Claude response.
    Handles nested braces and surrounding prose, unlike a naive regex."""
    decoder = json.JSONDecoder()
    idx = text.find("{")
    while idx != -1:
        try:
            obj, _ = decoder.raw_decode(text, idx)
            if isinstance(obj, dict):
                return obj
        except json.JSONDecodeError:
            pass
        idx = text.find("{", idx + 1)
    raise ValueError("No JSON found in response")


# ─── Public AI functions ─────────────────────────────────────────────────────

async def get_lumi_response(trigger: str, sentiment: str = "neutral",
                            status: str = "idle", level_id: int = 1) -> str:
    """Short child-friendly Lumi quip. Falls back to rule-based if API is down."""
    try:
        context = (
            f"Game status: {status}. Child feeling: {sentiment}. "
            f"Level: {level_id}. Situation: {trigger}"
        )
        msg = await _call_claude(
            model="claude-haiku-4-5-20251001",
            max_tokens=60,
            system=LUMI_SYSTEM,
            messages=[{"role": "user", "content": context}],
        )
        return msg.content[0].text.strip()
    except Exception:
        return _fallback_response(trigger, status)


async def parse_robot_command(text: str, grid_state: dict) -> dict:
    """
    Convert a natural-language robot instruction into a command list.
    Returns {"commands": [...], "reply": "child-friendly explanation"}.
    Falls back to empty list + error message if Claude is unavailable.
    """
    system = (
        "You are a robot command parser for a children's toy robot on a grid.\n"
        "Available commands: forward, turn_left, turn_right\n"
        "Parse the user's request into the shortest correct sequence.\n"
        "Return ONLY valid JSON — no markdown, no extra text:\n"
        '{"commands": ["forward", ...], "reply": "one fun sentence for a 6-year-old"}\n\n'
        "Examples:\n"
        '  "go forward" → {"commands":["forward"],"reply":"Moving one step forward!"}\n'
        '  "spin around" → {"commands":["turn_right","turn_right","turn_right","turn_right"],'
        '"reply":"Spinning all the way around! 🌀"}\n'
        '  "go forward twice then turn right" → {"commands":["forward","forward","turn_right"],'
        '"reply":"Two steps forward then turning right!"}\n'
        '  "help me reach the star" → let the grid state guide you'
    )
    prompt = (
        f"Grid {grid_state['grid_size']['width']}×{grid_state['grid_size']['height']}, "
        f"robot at ({grid_state['robot_pos']['x']},{grid_state['robot_pos']['y']}) "
        f"facing {'N E S W'.split()[grid_state.get('robot_direction',1)]}, "
        f"goal at ({grid_state['goal']['x']},{grid_state['goal']['y']}).\n"
        f"User says: \"{text}\""
    )
    try:
        msg = await _call_claude(
            model="claude-haiku-4-5-20251001",
            max_tokens=200,
            system=system,
            messages=[{"role": "user", "content": prompt}],
        )
        return _extract_json(msg.content[0].text)
    except Exception as e:
        return {"commands": [], "reply": f"I didn't understand that — try again! 🤔 ({e})"}


async def narrate_solution(commands: list[str], grid_state: dict) -> str:
    """
    Generate a short, fun, child-friendly story about what the robot is about to do.
    Used to announce the auto-solve sequence.
    """
    try:
        summary = ", ".join(commands) if commands else "nothing"
        prompt = (
            f"A toy robot is about to do: {summary}\n"
            f"It starts at ({grid_state['robot_pos']['x']},{grid_state['robot_pos']['y']}) "
            f"and the goal is at ({grid_state['goal']['x']},{grid_state['goal']['y']}).\n"
            "Write ONE sentence (max 20 words) for a 6-year-old that makes this sound exciting."
        )
        msg = await _call_claude(
            model="claude-haiku-4-5-20251001",
            max_tokens=60,
            system=LUMI_SYSTEM,
            messages=[{"role": "user", "content": prompt}],
        )
        return msg.content[0].text.strip()
    except Exception:
        n = len(commands)
        return f"I found the way! {n} move{'s' if n != 1 else ''} to the star! ⭐"


_HINT_TEMPLATES = {
    "forward":    ["Try moving forward! The path ahead is clear! 👣",
                   "One step forward gets you closer! 🟢"],
    "turn_left":  ["Hmm, which way is the star? Try turning left! ↺",
                   "The star isn't in front of you — turn left and look! 🟡"],
    "turn_right": ["Try turning right — something shiny is that way! ↻",
                   "Turn right and see what you find! 🔵"],
}


async def generate_smart_hint(grid_state: dict, mistake_tag: str | None = None) -> dict:
    """
    Grid-aware hint: BFS computes the real optimal path, then Claude phrases
    a gentle nudge about the FIRST move only (never the full answer).
    Returns {"hint": str, "next_move": str|None, "moves_remaining": int|None}.
    """
    path = bfs_plan_path(grid_state)
    if not path:
        return {
            "hint": "Hmm, this one is tricky! Try the reset button and start fresh! 🔄",
            "next_move": None, "moves_remaining": None,
        }

    next_move = path[0]
    n = len(path)

    try:
        mistake = f" The child just made this mistake: {mistake_tag}." if mistake_tag else ""
        prompt = (
            f"A child's robot needs to reach a star. The correct next move is: {next_move}. "
            f"The full solution takes {n} more moves.{mistake}\n"
            "Give ONE gentle hint (max 15 words) that nudges toward that next move "
            "WITHOUT saying the exact command. Make the child think and feel smart."
        )
        msg = await _call_claude(
            model="claude-haiku-4-5-20251001",
            max_tokens=60,
            system=LUMI_SYSTEM,
            messages=[{"role": "user", "content": prompt}],
        )
        hint = msg.content[0].text.strip()
    except Exception:
        hint = random.choice(_HINT_TEMPLATES.get(next_move, _HINT_TEMPLATES["forward"]))

    return {"hint": hint, "next_move": next_move, "moves_remaining": n}


async def chat_with_lumi(messages: list[dict], game_context: dict | None = None) -> dict:
    """
    Multi-turn chat with Lumi for the child chatbot.
    messages = [{"role": "user"|"assistant", "content": "..."}]
    Returns {"reply": str, "emotion": str}
    """
    ctx_str = ""
    if game_context:
        ctx_str = (
            f"Level {game_context.get('level_id', 1)} — {game_context.get('level_name', '')}. "
            f"Game status: {game_context.get('status', 'idle')}. "
            f"Child mood: {game_context.get('sentiment', 'neutral')}. "
            f"Stars earned: {game_context.get('stars', 0)}."
        )
        history = game_context.get("history")
        if history:
            ctx_str += f" Child history: {history}"

    system = LUMI_CHAT_SYSTEM.replace("{game_context}", ctx_str or "No game data yet.")

    # Map emotion from last assistant message keywords
    def _emotion(text: str) -> str:
        t = text.lower()
        if any(w in t for w in ["wow", "amazing", "you did it", "yes", "🎉", "⭐", "great"]):
            return "excited"
        if any(w in t for w in ["hmm", "think", "let's try", "what if", "🤔"]):
            return "thinking"
        if any(w in t for w in ["oh no", "oops", "try again", "don't give up"]):
            return "sad"
        return "happy"

    try:
        # Keep last 10 turns; Anthropic API requires messages start with 'user'
        recent = messages[-10:]
        while recent and recent[0]["role"] != "user":
            recent = recent[1:]
        if not recent:
            return {"reply": "Ask me anything! I'm here to help! 🤖", "emotion": "happy"}

        msg = await _call_claude(
            model="claude-haiku-4-5-20251001",
            max_tokens=120,
            system=system,
            messages=recent,
        )
        reply = msg.content[0].text.strip()
        return {"reply": reply, "emotion": _emotion(reply)}
    except Exception:
        fallbacks = [
            "Oops, I had a tiny glitch! Ask me again! 🤖",
            "My circuits are buzzing! Try again! ⚡",
            "I blinked! What did you say? 😄",
        ]
        return {"reply": random.choice(fallbacks), "emotion": "happy"}


async def generate_parent_report(stats: dict) -> str:
    """Generate a parent-friendly weekly summary."""
    try:
        prompt = (
            f"Child stats this week: {json.dumps(stats, indent=2)}\n\n"
            "Write a warm 3-paragraph parent report. Include:\n"
            "1. What went well (specific to the stats)\n"
            "2. What skills are growing\n"
            "3. Two specific suggestions for next week\n\n"
            "Keep it friendly, avoid jargon, max 200 words."
        )
        msg = await _call_claude(
            model="claude-sonnet-4-6",
            max_tokens=400,
            messages=[{"role": "user", "content": prompt}],
        )
        return msg.content[0].text.strip()
    except Exception:
        return (
            f"Your child completed {stats.get('total_missions', 0)} missions this week "
            f"with {stats.get('success_rate', 0)}% success. Keep up the great work!"
        )


# ─── Rule-based fallback ──────────────────────────────────────────────────────

def _fallback_response(trigger: str, status: str) -> str:
    responses = {
        "success":   ["You did it! Amazing! ⭐", "Yes yes yes! You rock! 🎉", "WOW! You're a robot wizard! ✨"],
        "error":     ["Oops! Let's try again! 💪", "So close! One more try! 🤖", "Don't give up! You got this! ⭐"],
        "executing": ["Here we go! 🚀", "Robot is moving! 🤖", "Watch what happens! 👀"],
        "idle":      ["Ready when you are! 🌟", "Place your blocks! 🧱", "Let's build something cool! ✨"],
    }
    return random.choice(responses.get(status, responses["idle"]))
