"""Computes skill scores from gameplay data."""
from db import get_db

SKILLS = ["logic", "creativity", "persistence", "spatial", "speed", "teamwork"]

def compute_skill_scores(child_id: str = "default") -> dict:
    """Derive skill scores 0-100 from stored gameplay data."""
    with get_db() as conn:
        attempts = conn.execute("""
            SELECT result, hints_used, stars, duration_sec, commands
            FROM mission_attempts WHERE child_id=? ORDER BY created_at DESC LIMIT 50
        """, (child_id,)).fetchall()

        interactions = conn.execute("""
            SELECT is_correct, response_time_sec, confidence
            FROM interactions WHERE child_id=? ORDER BY created_at DESC LIMIT 100
        """, (child_id,)).fetchall()

    if not attempts:
        # Return demo scores for new users
        return {
            "logic": 45, "creativity": 50, "persistence": 40,
            "spatial": 48, "speed": 42, "teamwork": 35,
        }

    total = len(attempts)
    successes = sum(1 for a in attempts if a["result"] == "success")
    no_hint = sum(1 for a in attempts if a["hints_used"] == 0 and a["result"] == "success")
    three_star = sum(1 for a in attempts if (a["stars"] or 0) == 3)
    fast = sum(1 for a in attempts if (a["duration_sec"] or 999) < 45 and a["result"] == "success")

    correct_answers = sum(1 for i in interactions if i["is_correct"])
    fast_answers = sum(1 for i in interactions if (i["response_time_sec"] or 5) < 2.5 and i["is_correct"])

    def pct(n, d, cap=100): return min(cap, round(n / max(d, 1) * 100))

    return {
        "logic":       pct(correct_answers, len(interactions) or 1),
        "creativity":  pct(three_star, total),
        "persistence": pct(successes, total),
        "spatial":     pct(no_hint, successes or 1),
        "speed":       pct(fast_answers, len(interactions) or 1),
        "teamwork":    35,  # placeholder until multiplayer is built
    }
