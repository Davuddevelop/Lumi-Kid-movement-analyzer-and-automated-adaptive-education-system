"""Daily challenge system — one new challenge per calendar day."""
import random
from datetime import date
from typing import Optional
from dataclasses import dataclass

CHALLENGES = [
    {"id": "no_hints",      "title": "No Hints Hero!",         "desc": "Complete a level without using any hints",    "xp": 50,  "emoji": "🧠"},
    {"id": "speed_run",     "title": "Speed Demon!",           "desc": "Finish any level in under 60 seconds",        "xp": 60,  "emoji": "⚡"},
    {"id": "four_blocks",   "title": "Minimalist Master!",     "desc": "Reach the goal using 4 blocks or fewer",      "xp": 75,  "emoji": "🎯"},
    {"id": "loop_it",       "title": "Loop Champion!",         "desc": "Complete a level using a loop block",         "xp": 55,  "emoji": "🔄"},
    {"id": "three_stars",   "title": "Star Collector!",        "desc": "Earn 3 stars on any level",                   "xp": 65,  "emoji": "⭐"},
    {"id": "first_try",     "title": "Perfect Shot!",          "desc": "Complete a level on the very first try",      "xp": 80,  "emoji": "🏆"},
    {"id": "five_missions", "title": "Mission Marathon!",      "desc": "Complete 3 missions in one session",          "xp": 70,  "emoji": "🚀"},
    {"id": "comeback",      "title": "Never Give Up!",         "desc": "Succeed after failing at least 3 times",      "xp": 90,  "emoji": "💪"},
]

@dataclass
class DailyChallenge:
    id: str
    title: str
    desc: str
    xp: int
    emoji: str
    date_str: str
    completed: bool = False

def get_today_challenge() -> dict:
    today = date.today()
    # Seed by date so everyone gets the same challenge each day
    rng = random.Random(today.toordinal())
    challenge = rng.choice(CHALLENGES)
    return {
        **challenge,
        "date": today.isoformat(),
        "completed": False,
    }

def check_challenge_completion(challenge_id: str, mission_result: dict) -> bool:
    """Check if a mission result satisfies the daily challenge."""
    result = mission_result.get("result", "")
    hints = mission_result.get("hints_used", 0)
    duration = mission_result.get("duration_sec", 999)
    commands = mission_result.get("commands", [])
    stars = mission_result.get("stars", 0)
    attempts = mission_result.get("attempts", 1)

    checkers = {
        "no_hints":      lambda: result == "success" and hints == 0,
        "speed_run":     lambda: result == "success" and duration < 60,
        "four_blocks":   lambda: result == "success" and len(commands) <= 4,
        "loop_it":       lambda: result == "success" and "loop" in commands,
        "three_stars":   lambda: result == "success" and stars == 3,
        "first_try":     lambda: result == "success" and attempts == 1,
        "five_missions": lambda: result == "success",
        "comeback":      lambda: result == "success" and attempts >= 4,
    }
    checker = checkers.get(challenge_id)
    return checker() if checker else False
