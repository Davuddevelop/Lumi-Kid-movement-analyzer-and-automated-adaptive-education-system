"""
Lumi AI — Claude-powered voice and report generation for the Lumi educational platform.
Provides child-friendly responses and parent-facing progress reports.
"""
import json
import random
import anthropic

client = anthropic.Anthropic()

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


async def get_lumi_response(trigger: str, sentiment: str = "neutral", status: str = "idle",
                            level_id: int = 1) -> str:
    """Get a contextual Lumi response. Falls back to rule-based if API unavailable."""
    try:
        context = (
            f"Game status: {status}. Child feeling: {sentiment}. "
            f"Level: {level_id}. Situation: {trigger}"
        )
        msg = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=60,
            system=LUMI_SYSTEM,
            messages=[{"role": "user", "content": context}]
        )
        return msg.content[0].text.strip()
    except Exception:
        return _fallback_response(trigger, status)


def _fallback_response(trigger: str, status: str) -> str:
    responses = {
        "success": [
            "You did it! Amazing! ⭐",
            "Yes yes yes! You rock! \U0001f389",
            "WOW! You're a robot wizard! ✨",
        ],
        "error": [
            "Oops! Let's try again! \U0001f4aa",
            "So close! One more try! \U0001f916",
            "Don't give up! You got this! ⭐",
        ],
        "executing": [
            "Here we go! \U0001f680",
            "Robot is moving! \U0001f916",
            "Watch what happens! \U0001f440",
        ],
        "idle": [
            "Ready when you are! \U0001f31f",
            "Place your blocks! \U0001f9f1",
            "Let's build something cool! ✨",
        ],
    }
    options = responses.get(status, responses["idle"])
    return random.choice(options)


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

        msg = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=400,
            messages=[{"role": "user", "content": prompt}]
        )
        return msg.content[0].text.strip()
    except Exception:
        return (
            f"Your child completed {stats.get('total_missions', 0)} missions this week "
            f"with {stats.get('success_rate', 0)}% success. Keep up the great work!"
        )
