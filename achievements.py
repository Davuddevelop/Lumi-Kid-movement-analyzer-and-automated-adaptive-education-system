"""
Lumi Achievement System
Awards badges based on:
- Correct answers
- Speed (response time)
- Efficiency (attempts, explanations)
"""
from typing import Dict, List, Optional
from dataclasses import dataclass, field
from datetime import datetime
from db import save_badge

@dataclass
class Badge:
    id: str
    name: str
    message: str
    icon: str  # Emoji icon
    category: str  # "accuracy", "speed", "efficiency", "milestone"

# Badge definitions
BADGES = {
    # Accuracy badges
    "first_correct": Badge(
        "first_correct", "First Win",
        "You got your first answer right!", "⭐", "accuracy"
    ),
    "streak_3": Badge(
        "streak_3", "Hot Streak",
        "3 correct answers in a row!", "🔥", "accuracy"
    ),
    "streak_5": Badge(
        "streak_5", "Unstoppable",
        "5 correct answers in a row! Amazing!", "💫", "accuracy"
    ),
    "perfect_10": Badge(
        "perfect_10", "Perfect Ten",
        "10 correct answers! You're a star!", "🌟", "accuracy"
    ),

    # Speed badges
    "quick_thinker": Badge(
        "quick_thinker", "Quick Thinker",
        "Answered in under 2 seconds!", "⚡", "speed"
    ),
    "speed_demon": Badge(
        "speed_demon", "Speed Demon",
        "3 fast answers in a row!", "🚀", "speed"
    ),
    "lightning": Badge(
        "lightning", "Lightning Brain",
        "5 super fast answers! Incredible!", "⚡⚡", "speed"
    ),

    # Efficiency badges
    "good_explainer": Badge(
        "good_explainer", "Great Explainer",
        "You gave a detailed answer!", "📚", "efficiency"
    ),
    "no_hints": Badge(
        "no_hints", "Independent",
        "Solved 3 puzzles without hints!", "💪", "efficiency"
    ),
    "first_try": Badge(
        "first_try", "First Try Hero",
        "Got it right on the first attempt!", "🎯", "efficiency"
    ),
    "comeback": Badge(
        "comeback", "Comeback Kid",
        "Got it right after asking for help!", "🌈", "efficiency"
    ),

    # Milestone badges
    "explorer": Badge(
        "explorer", "Explorer",
        "Completed your first mission!", "🗺️", "milestone"
    ),
    "adventurer": Badge(
        "adventurer", "Adventurer",
        "Completed 5 missions!", "🏔️", "milestone"
    ),
    "master_coder": Badge(
        "master_coder", "Master Coder",
        "Completed 10 missions!", "👑", "milestone"
    ),
    "persistence": Badge(
        "persistence", "Never Give Up",
        "Kept trying after 5 failures!", "💎", "milestone"
    ),
}


@dataclass
class PlayerStats:
    """Tracks player performance for achievement calculation."""
    total_correct: int = 0
    total_wrong: int = 0
    current_streak: int = 0
    best_streak: int = 0
    fast_answers: int = 0  # < 2 seconds
    fast_streak: int = 0
    good_explanations: int = 0
    hints_used: int = 0
    no_hint_streak: int = 0
    missions_completed: int = 0
    total_attempts: int = 0
    first_try_wins: int = 0
    comebacks: int = 0  # Correct after using hint
    earned_badges: List[str] = field(default_factory=list)


class AchievementSystem:
    """Manages achievements and badge awards."""

    def __init__(self):
        self.stats = PlayerStats()
        self.pending_badges: List[Badge] = []  # Badges to show
        self.last_used_hint: bool = False
        self.current_attempt_count: int = 0

    def record_answer(self,
                      is_correct: bool,
                      response_time_sec: float,
                      explanation_quality: str = "n/a",
                      used_hint: bool = False) -> List[Badge]:
        """
        Record an answer and check for new achievements.
        Returns list of newly earned badges.
        """
        new_badges = []
        self.stats.total_attempts += 1
        self.current_attempt_count += 1

        if is_correct:
            self.stats.total_correct += 1
            self.stats.current_streak += 1
            self.stats.best_streak = max(self.stats.best_streak, self.stats.current_streak)

            # Check accuracy badges
            if self.stats.total_correct == 1:
                new_badges.append(self._award("first_correct"))
            if self.stats.current_streak == 3:
                new_badges.append(self._award("streak_3"))
            if self.stats.current_streak == 5:
                new_badges.append(self._award("streak_5"))
            if self.stats.total_correct == 10:
                new_badges.append(self._award("perfect_10"))

            # Check speed badges
            if response_time_sec < 2.0:
                self.stats.fast_answers += 1
                self.stats.fast_streak += 1

                if self.stats.fast_answers == 1:
                    new_badges.append(self._award("quick_thinker"))
                if self.stats.fast_streak == 3:
                    new_badges.append(self._award("speed_demon"))
                if self.stats.fast_streak == 5:
                    new_badges.append(self._award("lightning"))
            else:
                self.stats.fast_streak = 0

            # Check efficiency badges
            if explanation_quality == "good_explanation":
                self.stats.good_explanations += 1
                if self.stats.good_explanations == 1:
                    new_badges.append(self._award("good_explainer"))

            if not used_hint:
                self.stats.no_hint_streak += 1
                if self.stats.no_hint_streak == 3:
                    new_badges.append(self._award("no_hints"))
            else:
                self.stats.no_hint_streak = 0

            # First try win
            if self.current_attempt_count == 1:
                self.stats.first_try_wins += 1
                if self.stats.first_try_wins == 1:
                    new_badges.append(self._award("first_try"))

            # Comeback after hint
            if self.last_used_hint:
                self.stats.comebacks += 1
                if self.stats.comebacks == 1:
                    new_badges.append(self._award("comeback"))

            self.last_used_hint = False

        else:
            self.stats.total_wrong += 1
            self.stats.current_streak = 0
            self.stats.fast_streak = 0

            # Persistence badge
            if self.stats.total_wrong == 5 and "persistence" not in self.stats.earned_badges:
                new_badges.append(self._award("persistence"))

        # Filter out None values (already earned)
        return [b for b in new_badges if b is not None]

    def record_hint_used(self):
        """Record that a hint was used."""
        self.stats.hints_used += 1
        self.stats.no_hint_streak = 0
        self.last_used_hint = True

    def record_mission_complete(self) -> List[Badge]:
        """Record mission completion and check for milestone badges."""
        new_badges = []
        self.stats.missions_completed += 1
        self.current_attempt_count = 0  # Reset for next mission

        if self.stats.missions_completed == 1:
            new_badges.append(self._award("explorer"))
        if self.stats.missions_completed == 5:
            new_badges.append(self._award("adventurer"))
        if self.stats.missions_completed == 10:
            new_badges.append(self._award("master_coder"))

        return [b for b in new_badges if b is not None]

    def _award(self, badge_id: str) -> Optional[Badge]:
        """Award a badge if not already earned."""
        if badge_id in self.stats.earned_badges:
            return None

        self.stats.earned_badges.append(badge_id)
        badge = BADGES.get(badge_id)
        if badge:
            self.pending_badges.append(badge)
            try:
                save_badge(badge_id)
            except Exception:
                pass  # Never crash the game because of a DB write failure
        return badge

    def get_pending_badges(self) -> List[Dict]:
        """Get pending badge notifications as full dicts (does NOT clear the list)."""
        return [
            {
                "id": b.id,
                "name": b.name,
                "message": b.message,
                "icon": b.icon,
                "category": b.category
            }
            for b in self.pending_badges
        ]

    def pop_pending_badge(self) -> Optional[Dict]:
        """Return and remove the first pending badge, or None if none pending."""
        if not self.pending_badges:
            return None
        badge = self.pending_badges.pop(0)
        return {
            "id": badge.id,
            "name": badge.name,
            "message": badge.message,
            "icon": badge.icon,
            "category": badge.category
        }

    def get_all_badges(self) -> Dict:
        """Get all badges and which ones are earned."""
        return {
            badge_id: {
                "name": badge.name,
                "message": badge.message,
                "icon": badge.icon,
                "category": badge.category,
                "earned": badge_id in self.stats.earned_badges
            }
            for badge_id, badge in BADGES.items()
        }

    def get_stats(self) -> Dict:
        """Get current player stats."""
        accuracy = (self.stats.total_correct / max(1, self.stats.total_correct + self.stats.total_wrong)) * 100

        return {
            "total_correct": self.stats.total_correct,
            "total_wrong": self.stats.total_wrong,
            "accuracy_percent": round(accuracy, 1),
            "best_streak": self.stats.best_streak,
            "current_streak": self.stats.current_streak,
            "fast_answers": self.stats.fast_answers,
            "missions_completed": self.stats.missions_completed,
            "badges_earned": len(self.stats.earned_badges),
            "total_badges": len(BADGES)
        }

    def reset(self):
        """Reset all stats and badges."""
        self.stats = PlayerStats()
        self.pending_badges = []
        self.last_used_hint = False
        self.current_attempt_count = 0


# ============================================
# TEST
# ============================================
if __name__ == "__main__":
    system = AchievementSystem()

    print("=" * 50)
    print("  ACHIEVEMENT SYSTEM TEST")
    print("=" * 50)

    # Test first correct answer
    print("\n--- First correct answer (fast) ---")
    badges = system.record_answer(is_correct=True, response_time_sec=1.5)
    for b in badges:
        print(f"  [{b.category}] {b.name}: {b.message}")

    # Test streak
    print("\n--- Building streak (2 more correct) ---")
    badges = system.record_answer(is_correct=True, response_time_sec=1.8)
    badges = system.record_answer(is_correct=True, response_time_sec=1.2)
    for b in badges:
        print(f"  [{b.category}] {b.name}: {b.message}")

    # Test good explanation
    print("\n--- Good explanation ---")
    badges = system.record_answer(
        is_correct=True,
        response_time_sec=3.0,
        explanation_quality="good_explanation"
    )
    for b in badges:
        print(f"  [{b.category}] {b.name}: {b.message}")

    # Test mission complete
    print("\n--- Complete first mission ---")
    badges = system.record_mission_complete()
    for b in badges:
        print(f"  [{b.category}] {b.name}: {b.message}")

    # Test comeback after hint
    print("\n--- Using hint then getting it right ---")
    system.record_hint_used()
    badges = system.record_answer(is_correct=True, response_time_sec=2.5)
    for b in badges:
        print(f"  [{b.category}] {b.name}: {b.message}")

    # Print stats
    print("\n--- Current Stats ---")
    stats = system.get_stats()
    for key, value in stats.items():
        print(f"  {key}: {value}")

    # Print all earned badges
    print("\n--- Earned Badges ---")
    for badge_id in system.stats.earned_badges:
        badge = BADGES[badge_id]
        print(f"  [{badge.category}] {badge.name}")
