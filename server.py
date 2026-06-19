from fastapi import FastAPI, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import uvicorn
import asyncio
import json
import os
import base64
from mind_analyzer import MindAnalyzer
from analytics_logger import MissionLogger
from guided_questions import GuidedQuestionSystem
from achievements import AchievementSystem
from personality import PersonalitySystem
from memory import MemorySystem
from level_system import LevelSystem, ValidationResult
from db import init_db, add_xp, save_mission_attempt, save_level_progress, get_level_progress, get_child_xp, get_parent_stats
from esp32_bridge import robot_bridge
import lumi_ai
from lumi_ai import bfs_plan_path, parse_robot_command, narrate_solution
from daily_challenge import get_today_challenge, check_challenge_completion
from story_system import get_story_for_level, get_all_chapters
from skill_engine import compute_skill_scores

app = FastAPI()

# Initialize DB on startup
init_db()

# Initialize components
analyzer = MindAnalyzer()
logger = MissionLogger("lumi_mission_logs.json")
question_system = GuidedQuestionSystem()
achievement_system = AchievementSystem()
personality_system = PersonalitySystem(default_mode="coach")
memory_system = MemorySystem(max_history=100)
level_system = LevelSystem()
last_mistake_tag = None  # Track for questions

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Block definitions (inline - no external import needed)
BLOCKS = {
    'forward': {'color': 'green', 'description': 'Move one step forward', 'icon': 'ArrowUp'},
    'turn_right': {'color': 'blue', 'description': 'Rotate 90° clockwise', 'icon': 'CornerDownRight'},
    'turn_left': {'color': 'yellow', 'description': 'Rotate 90° counter-clockwise', 'icon': 'CornerDownLeft'},
    'loop': {'color': 'red', 'description': 'Repeat previous block 2x', 'icon': 'Repeat'},
}

# Demo scenarios
DEMO_SCENARIOS = [
    {"name": "Success Path", "commands": ["forward", "turn_left", "forward", "forward", "turn_right", "forward", "forward", "forward", "turn_right", "forward"], "description": "Avoids obstacles and reaches the goal!"},
    {"name": "Crash Demo", "commands": ["forward", "forward", "forward"], "description": "Uh oh, crashes into the rock!"},
    {"name": "Loop Power", "commands": ["forward", "turn_left", "forward", "loop", "turn_right", "forward", "loop"], "description": "Uses loop blocks to repeat moves!"},
    {"name": "Edge Fall", "commands": ["turn_left", "forward", "forward", "forward", "forward", "forward"], "description": "Goes off the edge!"},
    {"name": "Spin Master", "commands": ["turn_right", "turn_left", "turn_right", "turn_right", "turn_right", "forward"], "description": "Too much spinning!"},
]
demo_index = 0

# Direction vectors: 0=North, 1=East, 2=South, 3=West
DIR_VECTORS = {0: (0, -1), 1: (1, 0), 2: (0, 1), 3: (-1, 0)}

class RobotState:
    def __init__(self):
        self.commands = DEMO_SCENARIOS[0]["commands"].copy()
        self.status = "idle"
        self.feedback = "Demo loaded! Press Run Program to start."
        self.suggestion = ""
        self.grid_size = {"width": 8, "height": 8}
        self.start_pos = {"x": 1, "y": 4}
        self.robot_pos = {"x": 1, "y": 4}
        self.goal = {"x": 6, "y": 4}
        self.obstacles = [{"x": 3, "y": 4}, {"x": 4, "y": 4}]
        self.path = []
        self.vitals = {"joy": 85, "focus": 40}
        self.sentiment = "curiosity"
        self.current_level_id = 1
        self.robot_direction = 1  # 0=North, 1=East, 2=South, 3=West
        self.xp = get_child_xp()
        self.level_name = ""
        self.stars_total = 0
        self.achievement = None  # set when badge earned, cleared after broadcast

    def to_dict(self):
        data = {
            "commands": self.commands,
            "status": self.status,
            "feedback": self.feedback,
            "suggestion": self.suggestion,
            "grid_size": self.grid_size,
            "start_pos": self.start_pos,
            "robot_pos": self.robot_pos,
            "goal": self.goal,
            "obstacles": self.obstacles,
            "path": self.path,
            "vitals": self.vitals,
            "sentiment": self.sentiment,
            "current_level_id": self.current_level_id,
            "available_blocks": BLOCKS,
            "robot_direction": self.robot_direction,
            "xp": self.xp,
            "level_name": self.level_name,
            "stars_total": self.stars_total,
            "achievement": self.achievement,
        }
        # Always include question key — None tells the client to clear the overlay
        data["question"] = question_system.get_current_question_data()
        # Include live robot status so dashboard can show connection badge
        data["robot_status"] = {
            "connected": len(robot_bridge.list_robots()) > 0,
            "robots": robot_bridge.list_robots(),
            "telemetry": {
                rid: robot_bridge.get_telemetry(rid)
                for rid in robot_bridge.list_robots()
            },
        }
        return data

state = RobotState()
clients = []

# Start first mission session
logger.start_mission(DEMO_SCENARIOS[0]["name"])

async def broadcast_state():
    data = state.to_dict()
    dead = []
    for client in clients:
        try:
            await client.send_json(data)
        except:
            dead.append(client)
    for d in dead:
        if d in clients:
            clients.remove(d)

async def ai_refresh_feedback(trigger: str, has_question: bool = False):
    """
    Fire-and-forget: upgrade the instant rule-based feedback with a fresh
    Claude-generated line once it arrives. When a guided question is active,
    only the suggestion line is replaced so the question stays answerable.
    """
    status_at_call = state.status
    try:
        text = await lumi_ai.get_lumi_response(
            trigger,
            sentiment=state.sentiment,
            status=state.status,
            level_id=state.current_level_id,
        )
        # Skip if the game moved on while Claude was thinking
        if not text or state.status != status_at_call:
            return
        if has_question:
            state.suggestion = text
        else:
            state.feedback = text
        await broadcast_state()
    except Exception:
        pass


async def execute_commands():
    """Execute commands step by step."""
    global last_mistake_tag
    x, y = state.start_pos["x"], state.start_pos["y"]
    direction = 1  # East
    state.path = [{"x": x, "y": y}]
    state.robot_pos = {"x": x, "y": y}

    obstacles_set = {(o["x"], o["y"]) for o in state.obstacles}
    grid_w = state.grid_size["width"]
    grid_h = state.grid_size["height"]

    # Unroll loops
    unrolled = []
    for cmd in state.commands:
        if cmd == 'loop' and unrolled:
            unrolled.extend([unrolled[-1]] * 2)
        else:
            unrolled.append(cmd)

    collision = False

    for cmd in unrolled:
        state.feedback = f"Executing: {cmd}"
        await broadcast_state()

        if cmd == 'turn_right':
            direction = (direction + 1) % 4
            state.robot_direction = direction
        elif cmd == 'turn_left':
            direction = (direction - 1) % 4
            state.robot_direction = direction
        elif cmd == 'forward':
            dx, dy = DIR_VECTORS[direction]
            nx, ny = x + dx, y + dy

            # Bounds check
            if nx < 0 or nx >= grid_w or ny < 0 or ny >= grid_h:
                last_mistake_tag = "fell_off_edge"
                state.status = "error"
                logger.log_attempt(state.commands, "fail", duration_seconds=len(unrolled)*0.5, mistake_tag="fell_off_edge")
                try:
                    save_mission_attempt(state.current_level_id, 'fail', state.commands, 0, 0, len(unrolled)*0.5)
                except Exception:
                    pass
                # Ask a guided question
                q = question_system.get_question_for_state("error", "fell_off_edge")
                state.feedback = q.text if q else "Oops! You went off the edge!"
                state.suggestion = q.hint if q else "Try turning before going forward."
                await broadcast_state()
                asyncio.create_task(ai_refresh_feedback(
                    "Robot fell off the grid edge", has_question=q is not None))
                return

            # Obstacle check
            if (nx, ny) in obstacles_set:
                last_mistake_tag = "crashed_into_obstacle"
                state.status = "error"
                logger.log_attempt(state.commands, "fail", duration_seconds=len(unrolled)*0.5, mistake_tag="crashed_into_obstacle")
                try:
                    save_mission_attempt(state.current_level_id, 'fail', state.commands, 0, 0, len(unrolled)*0.5)
                except Exception:
                    pass
                # Ask a guided question
                q = question_system.get_question_for_state("error", "crashed_into_obstacle")
                state.feedback = q.text if q else "Crash! You hit a rock!"
                state.suggestion = q.hint if q else "Try turning earlier to avoid obstacles."
                await broadcast_state()
                asyncio.create_task(ai_refresh_feedback(
                    "Robot crashed into a rock obstacle", has_question=q is not None))
                return

            x, y = nx, ny
            state.robot_pos = {"x": x, "y": y}
            state.path.append({"x": x, "y": y})

        await broadcast_state()
        await asyncio.sleep(0.5)

    # Check goal
    result = "fail"
    duration_sec = len(unrolled) * 0.5

    if x == state.goal["x"] and y == state.goal["y"]:
        state.status = "success"
        result = "success"
        last_mistake_tag = None

        # Record level completion in LevelSystem
        completion_result = ValidationResult(
            success=True,
            reached_goal=True,
            error=None,
            path=[(p["x"], p["y"]) for p in state.path],
            commands_used=len(unrolled),
            efficiency_score=100.0,
            stars=3,
            feedback="Perfect!"
        )
        level_system.record_completion(state.current_level_id, completion_result)

        # Award XP and persist to DB
        try:
            new_xp = add_xp(100)
            state.xp = new_xp
            state.stars_total = sum(level_system.progress.stars_earned.values())
            save_mission_attempt(state.current_level_id, 'success', state.commands, 0, 3, duration_sec)
            save_level_progress(state.current_level_id, 3, True, 1, state.commands)
        except Exception:
            pass

        # Record mission completion for achievements
        mission_badges = achievement_system.record_mission_complete()
        # Use personality-based success message
        success_msg = personality_system.get_response("success")
        # Ask success question
        q = question_system.get_question_for_state("success")
        state.feedback = q.text if q else success_msg
        state.suggestion = q.hint if q else "Try the next demo!"

        # Pop first pending badge and expose it on state for the broadcast
        pending = achievement_system.pop_pending_badge()
        if pending:
            state.achievement = pending
            state.suggestion = f"{pending['icon']} NEW BADGE: {pending['name']}!"
        else:
            # Personalized AI celebration (badge text must not be overwritten)
            asyncio.create_task(ai_refresh_feedback(
                f"Child solved level {state.current_level_id} and reached the star!",
                has_question=q is not None))

        # Trigger robot celebration asynchronously (fire-and-forget)
        asyncio.create_task(robot_bridge.celebrate("lumi-bot-1"))

    else:
        state.status = "error"
        result = "partial"
        last_mistake_tag = "missed_goal"
        # Ask miss goal question
        q = question_system.get_question_for_state("partial", "missed_goal")
        state.feedback = q.text if q else "You didn't crash, but missed the goal!"
        state.suggestion = q.hint if q else "Adjust your path to reach the flag."
        asyncio.create_task(ai_refresh_feedback(
            "Robot finished its moves safely but stopped short of the goal",
            has_question=q is not None))
        try:
            save_mission_attempt(state.current_level_id, 'fail', state.commands, 0, 0, duration_sec)
        except Exception:
            pass

    # Log to analytics
    logger.log_attempt(state.commands, result, duration_seconds=duration_sec)

    await broadcast_state()
    # Clear achievement after it has been broadcast once
    state.achievement = None

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    clients.append(websocket)
    try:
        await websocket.send_json(state.to_dict())
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        if websocket in clients:
            clients.remove(websocket)

class StateUpdate(BaseModel):
    commands: Optional[List[str]] = None
    status: Optional[str] = None
    feedback: Optional[str] = None

@app.post("/api/update")
async def update_state(update: StateUpdate):
    if update.commands is not None:
        state.commands = update.commands
    if update.status:
        state.status = update.status
    if update.feedback is not None:
        state.feedback = update.feedback
    await broadcast_state()
    return {"message": "Updated"}

@app.post("/api/execute")
async def execute_program():
    if state.status == "executing":
        return {"message": "Already executing"}
    if not state.commands:
        return {"message": "No commands"}

    state.status = "executing"
    state.feedback = "Robot starting..."
    state.path = []
    state.robot_pos = state.start_pos.copy()
    await broadcast_state()

    asyncio.create_task(execute_commands())
    return {"message": "Started"}

@app.post("/api/demo")
async def load_demo():
    global demo_index
    demo = DEMO_SCENARIOS[demo_index % len(DEMO_SCENARIOS)]
    demo_index += 1

    state.commands = demo["commands"].copy()
    state.status = "idle"
    state.feedback = f"{demo['name']}: {demo['description']}"
    state.suggestion = ""
    state.robot_pos = state.start_pos.copy()
    state.path = []
    
    # Start analytics session
    logger.start_mission(demo["name"])
    
    await broadcast_state()
    return {"message": f"Loaded: {demo['name']}"}

# ── Computer Vision Endpoint ──────────────────────────────────────────────────

class VisionRequest(BaseModel):
    image: str  # base64-encoded JPEG/PNG (data URI or raw base64)

@app.post("/api/vision/analyze")
async def vision_analyze(req: VisionRequest):
    """
    Accepts a base64-encoded camera frame, runs OpenCV HSV color detection
    to find LEGO blocks, and returns the detected command sequence.
    """
    try:
        import cv2
        import numpy as np
        from color_detector import detect_and_sort_blocks

        # Strip data URI prefix if present
        img_b64 = req.image
        if ',' in img_b64:
            img_b64 = img_b64.split(',', 1)[1]

        img_bytes = base64.b64decode(img_b64)
        nparr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if frame is None:
            return {"commands": [], "blocks": [], "error": "Could not decode image"}

        commands, blocks = detect_and_sort_blocks(frame, min_area=400)

        # Serialize blocks without the raw contour (not JSON-serializable)
        safe_blocks = [
            {"color": b["color"], "x": b["x"], "bbox": list(b["bbox"])}
            for b in blocks
        ]
        return {"commands": commands, "blocks": safe_blocks}

    except ImportError as e:
        return {"commands": [], "blocks": [], "error": f"OpenCV not available: {e}"}
    except Exception as e:
        return {"commands": [], "blocks": [], "error": str(e)}


class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    game_context: Optional[Dict] = None

@app.post("/api/chat")
async def chat(req: ChatRequest):
    """Multi-turn Lumi chatbot endpoint for the child chat UI."""
    messages = [{"role": m.role, "content": m.content} for m in req.messages]
    ctx = dict(req.game_context) if req.game_context else {}
    # Let Lumi know how the child has been doing lately
    try:
        pattern = memory_system.analyze_pattern()
        ctx["history"] = (
            f"Recent learning pattern: {pattern.get('pattern', 'new_user')}, "
            f"trend: {pattern.get('trend', 'neutral')}."
        )
    except Exception:
        pass
    result = await lumi_ai.chat_with_lumi(messages, ctx or None)
    return result


class VoiceInput(BaseModel):
    text: str

@app.post("/api/voice/interact")
async def voice_interact(voice: VoiceInput):
    """Process voice input - try guided question first, fallback to free-form."""

    # Check if there's an active guided question
    if question_system.current_question:
        result = question_system.process_answer(spoken_text=voice.text)

        if result["success"]:
            # Matched an answer
            is_correct = result.get("answer", {}).get("is_correct", False)
            response_time = result.get("response_time_sec", 5)
            response_confidence = result.get("response_confidence", "unknown")
            explanation_quality = result.get("explanation_quality", "n/a")

            # Record to memory
            memory_system.record(
                interaction_type="answer",
                is_correct=is_correct,
                response_time_sec=response_time,
                confidence=response_confidence,
                explanation_quality=explanation_quality,
                context=last_mistake_tag or "general"
            )

            # Get memory-based adaptive feedback
            comparison = memory_system.get_comparison_feedback()
            memory_prefix = memory_system.get_adaptive_prefix()

            # Combine feedback with memory insight
            feedback = result["feedback"]
            if comparison:
                feedback = f"{feedback} {comparison}"
            if memory_prefix and is_correct:
                feedback = f"{memory_prefix}{feedback}"

            state.feedback = feedback
            state.suggestion = ""
            logger.log_interaction(voice.text, {"type": "guided_answer", "result": result})

            # Record achievement
            badges = achievement_system.record_answer(
                is_correct=is_correct,
                response_time_sec=response_time,
                explanation_quality=explanation_quality
            )

            await broadcast_state()
            return {
                "speech": feedback,
                "answer": result["answer"],
                "confidence": result["confidence"],
                "response_time_sec": response_time,
                "response_confidence": response_confidence,
                "explanation_quality": explanation_quality,
                "explanation_details": result.get("explanation_details", {}),
                "badges": [{"id": b.id, "name": b.name, "message": b.message, "icon": b.icon} for b in badges],
                "memory": memory_system.analyze_pattern()
            }
        else:
            # Didn't match - show buttons as fallback
            state.feedback = result["feedback"]
            await broadcast_state()
            return {
                "speech": result["feedback"],
                "show_buttons": True,
                "question": question_system.get_current_question_data(),
                "explanation_quality": result.get("explanation_quality", "n/a"),
                "explanation_details": result.get("explanation_details", {})
            }

    # No active question — free-form chat. Mind analyzer supplies sentiment;
    # Claude supplies the reply (rule-based response if AI is unavailable).
    analysis = analyzer.analyze(voice.text)

    # Sync state with analysis
    state.sentiment = analysis.get("sentiment", "neutral")
    # Dynamically adjust vitals based on sentiment
    if state.sentiment == "joy":
        state.vitals["joy"] = min(100, state.vitals["joy"] + 10)
    elif state.sentiment == "frustration":
        state.vitals["joy"] = max(0, state.vitals["joy"] - 15)
        state.vitals["focus"] = max(0, state.vitals["focus"] - 5)
    elif state.sentiment == "curiosity":
        state.vitals["focus"] = min(100, state.vitals["focus"] + 15)

    if lumi_ai.AI_ENABLED:
        chat_result = await lumi_ai.chat_with_lumi(
            [{"role": "user", "content": voice.text}],
            {
                "level_id": state.current_level_id,
                "level_name": getattr(state, "level_name", ""),
                "status": state.status,
                "sentiment": state.sentiment,
                "stars": state.stars_total,
            },
        )
        response = chat_result["reply"]
    else:
        response = analyzer.get_lumi_response(analysis, state.to_dict())

    logger.log_interaction(voice.text, analysis)
    state.feedback = response
    await broadcast_state()

    return {
        "speech": response,
        "analysis": analysis,
        "vitals": state.vitals,
        "sentiment": state.sentiment
    }

class AnswerInput(BaseModel):
    button_id: str

@app.post("/api/answer")
async def answer_question(answer: AnswerInput):
    """Handle button press answer to guided question."""
    result = question_system.process_answer(button_id=answer.button_id)

    is_correct = result.get("answer", {}).get("is_correct", False)
    response_time = result.get("response_time_sec", 5)
    response_confidence = result.get("response_confidence", "unknown")

    # Record to memory
    memory_system.record(
        interaction_type="answer",
        is_correct=is_correct,
        response_time_sec=response_time,
        confidence=response_confidence,
        context=last_mistake_tag or "general"
    )

    # Get memory-based adaptive feedback
    comparison = memory_system.get_comparison_feedback()
    memory_prefix = memory_system.get_adaptive_prefix()

    # Combine feedback with memory insight
    feedback = result["feedback"]
    if comparison:
        feedback = f"{feedback} {comparison}"
    if memory_prefix and is_correct:
        feedback = f"{memory_prefix}{feedback}"

    state.feedback = feedback
    state.suggestion = ""

    logger.log_interaction(f"[BUTTON] {answer.button_id}", {"type": "button_answer", "result": result})

    # Record achievement
    badges = achievement_system.record_answer(
        is_correct=is_correct,
        response_time_sec=response_time
    )

    await broadcast_state()

    return {
        "speech": feedback,
        "answer": result.get("answer"),
        "is_correct": is_correct,
        "response_time_sec": response_time,
        "response_confidence": response_confidence,
        "badges": [{"id": b.id, "name": b.name, "message": b.message, "icon": b.icon} for b in badges],
        "memory": memory_system.analyze_pattern()
    }

@app.get("/api/question")
async def get_current_question():
    """Get current guided question and options."""
    q_data = question_system.get_current_question_data()
    if q_data:
        return {"question": q_data}
    return {"question": None}

class QuestionAnswerInput(BaseModel):
    answer_id: str

@app.post("/api/question/answer")
async def answer_question_new(answer: QuestionAnswerInput):
    """Alias for /api/answer using answer_id (used by child UI)."""
    result = question_system.process_answer(button_id=answer.answer_id)
    is_correct = result.get("answer", {}).get("is_correct", False)
    response_time = result.get("response_time_sec", 5)
    response_confidence = result.get("response_confidence", "unknown")
    memory_system.record(
        interaction_type="answer",
        is_correct=is_correct,
        response_time_sec=response_time,
        confidence=response_confidence,
        context=last_mistake_tag or "general"
    )
    feedback = result["feedback"]
    comparison = memory_system.get_comparison_feedback()
    memory_prefix = memory_system.get_adaptive_prefix()
    if comparison:
        feedback = f"{feedback} {comparison}"
    if memory_prefix and is_correct:
        feedback = f"{memory_prefix}{feedback}"
    state.feedback = feedback
    state.suggestion = ""
    badges = achievement_system.record_answer(
        is_correct=is_correct,
        response_time_sec=response_time
    )
    if badges:
        b = badges[0]
        state.achievement = {"id": b.id, "name": b.name, "icon": b.icon, "message": b.message}
    await broadcast_state()
    if state.achievement:
        state.achievement = None
    return {"speech": feedback, "is_correct": is_correct}

@app.post("/api/hint")
async def offer_hint():
    """Grid-aware AI hint: BFS finds the real shortest path from the robot's
    current position, Claude phrases a nudge about only the first move."""
    result = await lumi_ai.generate_smart_hint(state.to_dict(), last_mistake_tag)
    state.feedback = result["hint"]
    if result.get("moves_remaining"):
        state.suggestion = f"⭐ The star is {result['moves_remaining']} moves away — you can do it!"
    await broadcast_state()

    return {"message": "Hint offered", **result}

class HintResponse(BaseModel):
    wants_hint: bool

@app.post("/api/hint/respond")
async def respond_to_hint(response: HintResponse):
    """Process user's response to hint offer."""
    if not question_system.is_hint_mode():
        return {"error": "No hint was offered"}

    result = question_system.process_hint_response(response.wants_hint)
    response_time = result.get("response_time_sec", 0)
    response_confidence = result.get("response_confidence", "unknown")

    # Record hint interaction to memory
    memory_system.record(
        interaction_type="hint",
        is_correct=None,
        response_time_sec=response_time,
        confidence=response_confidence,
        context=last_mistake_tag or "general",
        used_hint=response.wants_hint
    )

    # Track hint usage for achievements
    if response.wants_hint:
        achievement_system.record_hint_used()
        # Use personality-adjusted hint response
        hint_msg = personality_system.get_response("hint_given", hint=result["feedback"])
        result["feedback"] = hint_msg
    else:
        # Use personality-based encouragement
        result["feedback"] = personality_system.get_response("encouragement")

    state.feedback = result["feedback"]
    state.suggestion = ""
    logger.log_interaction(f"[HINT] wants_hint={response.wants_hint}", {"type": "hint_response", "result": result})
    await broadcast_state()

    return {
        "speech": result["feedback"],
        "response_type": result["response_type"],
        "wants_hint": result["wants_hint"],
        "response_time_sec": response_time,
        "response_confidence": response_confidence,
        "memory": memory_system.analyze_pattern()
    }

@app.get("/api/achievements")
async def get_achievements():
    """Get player achievements and stats."""
    return {
        "stats": achievement_system.get_stats(),
        "badges": achievement_system.get_all_badges(),
        "pending": achievement_system.get_pending_badges()
    }

@app.get("/api/achievements/stats")
async def get_achievement_stats():
    """Get current player stats."""
    return achievement_system.get_stats()

@app.get("/api/memory")
async def get_memory():
    """Get interaction memory and pattern analysis."""
    return {
        "history": memory_system.get_history(),
        "analysis": memory_system.analyze_pattern(),
        "should_offer_hint": memory_system.should_offer_hint()
    }

@app.post("/api/memory/reset")
async def reset_memory():
    """Clear interaction memory."""
    memory_system.reset()
    return {"message": "Memory cleared"}

@app.get("/api/personality")
async def get_personality():
    """Get current personality mode and all options."""
    return {
        "current": personality_system.get_mode(),
        "personality": {
            "name": personality_system.get_personality().name,
            "emoji": personality_system.get_personality().emoji,
            "description": personality_system.get_personality().description
        },
        "modes": personality_system.get_all_modes()
    }

class PersonalityMode(BaseModel):
    mode: str

@app.post("/api/personality")
async def set_personality(data: PersonalityMode):
    """Set Lumi's personality mode."""
    if personality_system.set_mode(data.mode):
        p = personality_system.get_personality()
        greeting = personality_system.get_response("greeting")
        state.feedback = greeting
        await broadcast_state()
        return {
            "success": True,
            "mode": data.mode,
            "name": p.name,
            "emoji": p.emoji,
            "greeting": greeting
        }
    return {"success": False, "error": "Invalid mode"}

@app.post("/api/reset")
async def reset_state():
    return await load_demo()

# ============================================
# LEVEL SYSTEM ENDPOINTS
# ============================================

@app.get("/api/levels")
async def get_levels():
    """Get all levels with player progress, merged with DB persistence."""
    # Load DB progress to fill in any data that survived restarts
    try:
        db_progress = get_level_progress()
    except Exception:
        db_progress = {}

    # Sync DB progress into in-memory level system (so unlocks work correctly)
    for level_id, db_row in db_progress.items():
        if db_row.get('completed'):
            level_system.progress.completed_levels.add(level_id)
        db_stars = db_row.get('stars', 0)
        current_stars = level_system.progress.stars_earned.get(level_id, 0)
        if db_stars > current_stars:
            level_system.progress.stars_earned[level_id] = db_stars

    levels_data = []
    for level in level_system.get_all_levels():
        level_dict = level.to_dict()
        level_dict["unlocked"] = level_system.is_level_unlocked(level.level_id)
        level_dict["completed"] = level.level_id in level_system.progress.completed_levels
        level_dict["stars"] = level_system.progress.stars_earned.get(level.level_id, 0)
        level_dict["best_solution"] = level_system.progress.best_solutions.get(level.level_id)
        level_dict["attempts"] = level_system.progress.attempts.get(level.level_id, 0)
        # Overlay DB attempts if in-memory has none
        if level_dict["attempts"] == 0 and level.level_id in db_progress:
            level_dict["attempts"] = db_progress[level.level_id].get('attempts', 0)
        # Add chapter info
        if level.level_id <= 5:
            level_dict["chapter"] = 1
            level_dict["chapter_name"] = "Basics"
        elif level.level_id <= 10:
            level_dict["chapter"] = 2
            level_dict["chapter_name"] = "Obstacles"
        elif level.level_id <= 15:
            level_dict["chapter"] = 3
            level_dict["chapter_name"] = "Loops"
        else:
            level_dict["chapter"] = 4
            level_dict["chapter_name"] = "Mastery"
        levels_data.append(level_dict)

    return {
        "levels": levels_data,
        "progress": level_system.get_progress_summary()
    }

class LevelLoadRequest(BaseModel):
    level_id: int

@app.post("/api/levels/load")
async def load_level(request: LevelLoadRequest):
    """Load a specific level into the game state."""
    level = level_system.get_level(request.level_id)

    if not level:
        return {"success": False, "error": "Level not found"}

    if not level_system.is_level_unlocked(request.level_id):
        return {"success": False, "error": "Level is locked"}

    # Update game state with level configuration
    state.current_level_id = request.level_id
    state.grid_size = {"width": level.grid_size[0], "height": level.grid_size[1]}
    state.start_pos = {"x": level.start[0], "y": level.start[1]}
    state.robot_pos = {"x": level.start[0], "y": level.start[1]}
    state.goal = {"x": level.goal[0], "y": level.goal[1]}
    state.obstacles = [{"x": o[0], "y": o[1]} for o in level.obstacles]
    state.commands = []
    state.path = []
    state.status = "idle"
    state.robot_direction = 1  # reset to East on new level
    state.level_name = level.name
    state.feedback = f"Level {level.level_id}: {level.name}"
    state.suggestion = level.description

    # Start analytics session for this level
    logger.start_mission(f"Level_{level.level_id}_{level.name}")

    await broadcast_state()

    return {
        "success": True,
        "level": level.to_dict(),
        "allowed_commands": level.allowed_commands,
        "max_steps": level.max_steps,
        "time_limit": level.time_limit,
        "learning_goal": level.learning_goal
    }

@app.get("/api/levels/{level_id}")
async def get_level_detail(level_id: int):
    """Get detailed info for a specific level."""
    level = level_system.get_level(level_id)
    if not level:
        return {"error": "Level not found"}

    level_dict = level.to_dict()
    level_dict["unlocked"] = level_system.is_level_unlocked(level_id)
    level_dict["completed"] = level_id in level_system.progress.completed_levels
    level_dict["stars"] = level_system.progress.stars_earned.get(level_id, 0)
    level_dict["best_solution"] = level_system.progress.best_solutions.get(level_id)

    return level_dict

@app.get("/api/levels/{level_id}/hint")
async def get_level_hint(level_id: int, index: int = 0):
    """Get a hint for a specific level."""
    hint = level_system.get_hint(level_id, index)
    if not hint:
        return {"hint": None}

    return {
        "hint": hint,
        "index": index,
        "has_more": index < len(level_system.get_level(level_id).hints) - 1
    }

@app.post("/api/levels/progress/reset")
async def reset_level_progress():
    """Reset all level progress."""
    level_system.reset_progress()
    return {"success": True, "message": "Level progress reset"}


# ============================================
# ESP32 ROBOT WEBSOCKET
# ============================================

@app.websocket("/ws/robot")
async def robot_ws(ws: WebSocket):
    await ws.accept()
    robot_id = None
    try:
        init_msg = await ws.receive_json()
        robot_id = init_msg.get("robot_id", f"robot_{len(robot_bridge.list_robots())}")
        await robot_bridge.register(robot_id, ws)
        await ws.send_json({"type": "registered", "robot_id": robot_id})
        # Notify dashboard clients of new robot
        await broadcast_state()
        while True:
            data = await ws.receive_json()
            robot_bridge.handle_message(robot_id, data)
            # Push telemetry updates to dashboard in real-time
            if data.get("type") == "telemetry":
                await broadcast_state()
    except Exception:
        pass
    finally:
        if robot_id:
            await robot_bridge.unregister(robot_id)
            await broadcast_state()  # notify dashboard of disconnection


# ============================================
# PARENT DASHBOARD ENDPOINTS
# ============================================

@app.get("/api/parent/stats")
async def get_parent_dashboard():
    stats = get_parent_stats()
    stats["skills"] = compute_skill_scores()
    return stats


@app.get("/api/parent/report")
async def get_parent_report():
    """Generate an AI parent report using Claude."""
    stats = get_parent_stats()
    report = await lumi_ai.generate_parent_report(stats)
    return {"report": report, "stats": stats}


# ============================================
# ROBOT STATUS ENDPOINT
# ============================================

@app.get("/api/robots")
async def list_robots():
    """List connected ESP32 robots and their telemetry."""
    return {
        "robots": robot_bridge.list_robots(),
        "telemetry": {
            rid: robot_bridge.get_telemetry(rid)
            for rid in robot_bridge.list_robots()
        }
    }


@app.post("/api/robots/{robot_id}/command")
async def robot_direct_command(robot_id: str, body: dict):
    """Send a single direct-control command to a robot (for testing from UI)."""
    cmd = body.get("command", "")
    VALID = {"forward", "turn_left", "turn_right", "celebrate", "stop"}
    if cmd not in VALID:
        return {"error": f"unknown command '{cmd}'", "valid": list(VALID)}
    if cmd == "stop":
        await robot_bridge.emergency_stop(robot_id)
    elif cmd == "celebrate":
        await robot_bridge.celebrate(robot_id)
    else:
        # fire-and-forget single move (non-blocking for the API response)
        asyncio.create_task(robot_bridge.execute_sequence(robot_id, [cmd]))
    return {"ok": True, "robot_id": robot_id, "command": cmd}


@app.post("/api/robots/{robot_id}/stop")
async def robot_stop(robot_id: str):
    """Emergency stop a robot immediately."""
    await robot_bridge.emergency_stop(robot_id)
    return {"ok": True, "robot_id": robot_id}


# ============================================
# AI ROBOT CONTROL ENDPOINTS
# ============================================

@app.post("/api/ai/command")
async def ai_natural_command(body: dict):
    """
    Parse a natural-language instruction into robot commands using Claude,
    then execute them on the grid simulation and the physical robot.
    Body: {"text": "go forward 3 steps", "robot_id": "lumi-bot-1"}
    """
    text = body.get("text", "").strip()
    robot_id = body.get("robot_id", "lumi-bot-1")
    if not text:
        return {"error": "empty text"}

    grid = state.to_dict()
    result = await parse_robot_command(text, grid)
    commands = result.get("commands", [])
    reply = result.get("reply", "")

    if commands:
        # Run on grid simulation
        state.commands = commands
        state.status = "idle"
        state.robot_pos = state.start_pos.copy()
        asyncio.create_task(execute_commands())

        # Run on physical robot
        if robot_bridge.is_connected(robot_id):
            asyncio.create_task(robot_bridge.execute_sequence(robot_id, commands))

        state.feedback = reply
        await broadcast_state()

    return {"commands": commands, "reply": reply, "ok": bool(commands)}


@app.post("/api/ai/auto-solve")
async def ai_auto_solve(body: dict):
    """
    BFS-plan the optimal path from the robot's current position to the goal,
    generate a fun Claude narration, then execute on both grid and physical robot.
    Body: {"robot_id": "lumi-bot-1"}
    """
    robot_id = body.get("robot_id", "lumi-bot-1")
    grid = state.to_dict()

    commands = bfs_plan_path(grid)
    if commands is None:
        return {"ok": False, "error": "No path found — the goal may be blocked!"}

    narration = await narrate_solution(commands, grid)

    # Execute on grid
    state.commands = commands
    state.status = "idle"
    state.robot_pos = state.start_pos.copy()
    asyncio.create_task(execute_commands())

    # Execute on physical robot
    if robot_bridge.is_connected(robot_id):
        asyncio.create_task(robot_bridge.execute_sequence(robot_id, commands))

    state.feedback = narration
    await broadcast_state()

    return {
        "ok": True,
        "commands": commands,
        "steps": len(commands),
        "narration": narration,
    }


# ============================================
# DAILY CHALLENGE ENDPOINTS
# ============================================

@app.get("/api/daily-challenge")
async def daily_challenge():
    return get_today_challenge()

@app.post("/api/daily-challenge/check")
async def check_daily(data: dict):
    challenge = get_today_challenge()
    completed = check_challenge_completion(challenge["id"], data)
    if completed:
        xp_gained = add_xp(challenge["xp"])
        return {"completed": True, "xp_gained": xp_gained, "challenge": challenge}
    return {"completed": False, "challenge": challenge}

# ============================================
# STORY MODE ENDPOINTS
# ============================================

@app.get("/api/story/{level_id}")
async def get_story(level_id: int):
    return get_story_for_level(level_id)

@app.get("/api/chapters")
async def get_chapters():
    return {"chapters": get_all_chapters()}

# ============================================
# SKILL SCORES ENDPOINT
# ============================================

@app.get("/api/skills")
async def get_skills():
    return {"skills": compute_skill_scores()}

# ============================================
# THEME PREFERENCE ENDPOINT
# ============================================

_theme_pref = {"theme": "space"}

@app.get("/api/theme")
async def get_theme():
    return _theme_pref

@app.post("/api/theme")
async def set_theme(data: dict):
    _theme_pref["theme"] = data.get("theme", "space")
    return _theme_pref


if __name__ == "__main__":
    print("\n" + "="*50)
    print("  LUMI SERVER RUNNING")
    print("="*50)
    print("\nOpen dashboard: http://localhost:5173")
    print("API docs: http://127.0.0.1:8000/docs")
    print("\nPress Ctrl+C to stop.\n")
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)
