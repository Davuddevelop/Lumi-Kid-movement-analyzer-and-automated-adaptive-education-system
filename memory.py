"""
Lumi Interaction Memory System
Stores last 100 interactions to:
- Compare improvement over time
- Adjust feedback tone based on patterns
- Persist to SQLite via db.py
"""
from typing import Dict, List, Optional
from dataclasses import dataclass, field
from datetime import datetime
from collections import deque
from db import save_interaction, get_recent_interactions

@dataclass
class Interaction:
    """Single interaction record."""
    timestamp: str
    type: str  # "answer", "hint", "voice"
    is_correct: Optional[bool]
    response_time_sec: float
    confidence: str  # "confident", "medium", "unsure"
    explanation_quality: str  # "good_explanation", "weak_explanation", "n/a"
    context: str  # "crash", "edge", "success", etc.
    used_hint: bool = False


class MemorySystem:
    """Tracks recent interactions and detects patterns."""

    def __init__(self, max_history: int = 100, child_id: str = 'default'):
        self.history: deque = deque(maxlen=max_history)
        self.child_id = child_id
        self.session_start = datetime.now().isoformat()

        # Load last interactions from DB on startup
        try:
            past = get_recent_interactions(limit=max_history, child_id=child_id)
            for row in past:
                interaction = Interaction(
                    timestamp=row.get('created_at', ''),
                    type=row.get('type', 'answer'),
                    is_correct=bool(row['is_correct']) if row.get('is_correct') is not None else None,
                    response_time_sec=row.get('response_time_sec', 0) or 0,
                    confidence=row.get('confidence', 'unknown') or 'unknown',
                    explanation_quality=row.get('context', 'n/a') or 'n/a',
                    context=row.get('context', 'general') or 'general',
                    used_hint=bool(row.get('used_hint', 0))
                )
                self.history.append(interaction)
        except Exception:
            pass  # First run or DB not ready yet — start fresh

    def record(self,
               interaction_type: str,
               is_correct: Optional[bool] = None,
               response_time_sec: float = 0,
               confidence: str = "unknown",
               explanation_quality: str = "n/a",
               context: str = "general",
               used_hint: bool = False):
        """Record a new interaction (in-memory + persisted to DB)."""
        interaction = Interaction(
            timestamp=datetime.now().isoformat(),
            type=interaction_type,
            is_correct=is_correct,
            response_time_sec=response_time_sec,
            confidence=confidence,
            explanation_quality=explanation_quality,
            context=context,
            used_hint=used_hint
        )
        self.history.append(interaction)

        # Persist to DB
        try:
            save_interaction(
                type_=interaction_type,
                is_correct=is_correct,
                response_time_sec=response_time_sec,
                confidence=confidence,
                context=context,
                used_hint=used_hint,
                child_id=self.child_id
            )
        except Exception:
            pass  # Never crash the game because of a DB write failure

    def get_history(self) -> List[Dict]:
        """Get interaction history as list of dicts."""
        return [
            {
                "timestamp": i.timestamp,
                "type": i.type,
                "is_correct": i.is_correct,
                "response_time_sec": i.response_time_sec,
                "confidence": i.confidence,
                "explanation_quality": i.explanation_quality,
                "context": i.context,
                "used_hint": i.used_hint
            }
            for i in self.history
        ]

    def analyze_pattern(self) -> Dict:
        """
        Analyze recent interactions to detect patterns.
        Returns improvement indicators and suggested tone adjustments.
        """
        if len(self.history) == 0:
            return {
                "pattern": "new_user",
                "trend": "neutral",
                "tone_adjustment": "encouraging",
                "message": "Welcome! Let's get started."
            }

        # Calculate metrics
        correct_count = sum(1 for i in self.history if i.is_correct is True)
        wrong_count = sum(1 for i in self.history if i.is_correct is False)
        total_answers = correct_count + wrong_count

        avg_time = sum(i.response_time_sec for i in self.history) / len(self.history)
        hint_count = sum(1 for i in self.history if i.used_hint)

        good_explanations = sum(1 for i in self.history if i.explanation_quality == "good_explanation")
        confident_count = sum(1 for i in self.history if i.confidence == "confident")

        # Detect improvement trend
        if len(self.history) >= 2:
            recent = list(self.history)[-2:]
            if recent[-1].is_correct and not recent[-2].is_correct:
                trend = "improving"
            elif not recent[-1].is_correct and recent[-2].is_correct:
                trend = "struggling"
            elif all(i.is_correct for i in recent):
                trend = "consistent_success"
            elif all(not i.is_correct for i in recent if i.is_correct is not None):
                trend = "consistent_struggle"
            else:
                trend = "mixed"
        else:
            trend = "insufficient_data"

        # Detect speed improvement
        if len(self.history) >= 2:
            times = [i.response_time_sec for i in self.history if i.response_time_sec > 0]
            if len(times) >= 2:
                if times[-1] < times[0]:
                    speed_trend = "faster"
                elif times[-1] > times[0]:
                    speed_trend = "slower"
                else:
                    speed_trend = "consistent"
            else:
                speed_trend = "unknown"
        else:
            speed_trend = "unknown"

        # Determine pattern and tone adjustment
        pattern, tone, message = self._determine_pattern(
            correct_count, wrong_count, total_answers,
            trend, speed_trend, hint_count, good_explanations, confident_count
        )

        return {
            "pattern": pattern,
            "trend": trend,
            "speed_trend": speed_trend,
            "tone_adjustment": tone,
            "message": message,
            "stats": {
                "correct": correct_count,
                "wrong": wrong_count,
                "avg_response_time": round(avg_time, 2),
                "hints_used": hint_count,
                "good_explanations": good_explanations,
                "confident_answers": confident_count
            }
        }

    def _determine_pattern(self, correct, wrong, total, trend, speed_trend,
                           hints, good_expl, confident) -> tuple:
        """Determine pattern, tone adjustment, and message."""

        # Struggling patterns
        if wrong >= 2 and trend in ["struggling", "consistent_struggle"]:
            return (
                "needs_support",
                "gentle",
                "I can see this is tricky. Let's slow down and work through it together."
            )

        if hints >= 2:
            return (
                "hint_dependent",
                "encouraging",
                "Hints are great for learning! Try to remember what they taught you."
            )

        # Success patterns
        if correct >= 3 and trend == "consistent_success":
            return (
                "mastering",
                "challenging",
                "You're doing amazing! Ready for something harder?"
            )

        if trend == "improving":
            return (
                "improving",
                "celebratory",
                "I see improvement! You're getting better!"
            )

        if speed_trend == "faster" and correct >= 2:
            return (
                "speeding_up",
                "praising",
                "You're getting faster AND more accurate!"
            )

        # Good explanation pattern
        if good_expl >= 2:
            return (
                "good_thinker",
                "intellectual",
                "I love how you explain your thinking!"
            )

        # Confident pattern
        if confident >= 2 and correct >= 2:
            return (
                "confident_learner",
                "trusting",
                "You really know your stuff!"
            )

        # Default
        if total > 0:
            return (
                "learning",
                "supportive",
                "Keep going, you're learning!"
            )

        return ("new_user", "welcoming", "Let's begin!")

    def get_adaptive_prefix(self) -> str:
        """Get an adaptive message prefix based on recent history."""
        analysis = self.analyze_pattern()
        tone = analysis["tone_adjustment"]

        prefixes = {
            "gentle": ["It's okay! ", "No worries! ", "Let's try together: "],
            "encouraging": ["You can do it! ", "Keep trying! ", "Almost there! "],
            "celebratory": ["Wow! ", "Amazing! ", "Fantastic! "],
            "challenging": ["Let's push harder! ", "Ready for more? ", "Challenge time: "],
            "praising": ["Great job! ", "Excellent! ", "Well done! "],
            "intellectual": ["I like your thinking! ", "Smart! ", "Good reasoning! "],
            "trusting": ["I knew you'd get it! ", "As expected! ", "You've got this! "],
            "supportive": ["Nice try! ", "Good effort! ", "You're learning! "],
            "welcoming": ["Welcome! ", "Let's start! ", "Here we go! "],
        }

        import random
        return random.choice(prefixes.get(tone, ["", "", ""]))

    def should_offer_hint(self) -> bool:
        """Determine if we should proactively offer a hint."""
        if len(self.history) < 2:
            return False

        recent = list(self.history)[-2:]

        # Offer hint if last 2 were wrong
        wrong_streak = all(i.is_correct is False for i in recent)

        # Or if taking too long
        slow = all(i.response_time_sec > 4 for i in recent if i.response_time_sec > 0)

        return wrong_streak or slow

    def get_comparison_feedback(self) -> Optional[str]:
        """Generate feedback comparing current to previous performance."""
        if len(self.history) < 2:
            return None

        current = self.history[-1]
        previous = self.history[-2]

        feedback = []

        # Compare correctness
        if current.is_correct and not previous.is_correct:
            feedback.append("You got it this time!")
        elif not current.is_correct and previous.is_correct:
            feedback.append("This one was trickier.")

        # Compare speed
        if current.response_time_sec > 0 and previous.response_time_sec > 0:
            diff = previous.response_time_sec - current.response_time_sec
            if diff > 1:
                feedback.append(f"That was {diff:.1f}s faster!")
            elif diff < -2:
                feedback.append("Take your time, no rush.")

        # Compare explanation quality
        if current.explanation_quality == "good_explanation" and previous.explanation_quality != "good_explanation":
            feedback.append("Much better explanation!")

        return " ".join(feedback) if feedback else None

    def reset(self):
        """Clear history."""
        self.history.clear()
        self.session_start = datetime.now().isoformat()


# ============================================
# TEST
# ============================================
if __name__ == "__main__":
    memory = MemorySystem(max_history=3)

    print("=" * 50)
    print("  MEMORY SYSTEM TEST")
    print("=" * 50)

    # Test initial state
    print("\n--- Initial State ---")
    analysis = memory.analyze_pattern()
    print(f"Pattern: {analysis['pattern']}")
    print(f"Tone: {analysis['tone_adjustment']}")
    print(f"Message: {analysis['message']}")

    # Simulate struggling user
    print("\n--- Struggling User (2 wrong answers) ---")
    memory.record("answer", is_correct=False, response_time_sec=5.0, confidence="unsure", context="crash")
    memory.record("answer", is_correct=False, response_time_sec=6.0, confidence="unsure", context="crash")

    analysis = memory.analyze_pattern()
    print(f"Pattern: {analysis['pattern']}")
    print(f"Trend: {analysis['trend']}")
    print(f"Tone: {analysis['tone_adjustment']}")
    print(f"Message: {analysis['message']}")
    print(f"Should offer hint: {memory.should_offer_hint()}")

    # Simulate improvement
    print("\n--- User Improves ---")
    memory.record("answer", is_correct=True, response_time_sec=2.0, confidence="confident", context="crash")

    analysis = memory.analyze_pattern()
    print(f"Pattern: {analysis['pattern']}")
    print(f"Trend: {analysis['trend']}")
    print(f"Tone: {analysis['tone_adjustment']}")
    print(f"Message: {analysis['message']}")

    comparison = memory.get_comparison_feedback()
    print(f"Comparison: {comparison}")

    # Test adaptive prefix
    print(f"\nAdaptive prefix: '{memory.get_adaptive_prefix()}'")

    # Simulate mastery
    print("\n--- User Mastering (3 correct) ---")
    memory.reset()
    memory.record("answer", is_correct=True, response_time_sec=1.5, confidence="confident")
    memory.record("answer", is_correct=True, response_time_sec=1.2, confidence="confident")
    memory.record("answer", is_correct=True, response_time_sec=1.0, confidence="confident")

    analysis = memory.analyze_pattern()
    print(f"Pattern: {analysis['pattern']}")
    print(f"Speed trend: {analysis['speed_trend']}")
    print(f"Tone: {analysis['tone_adjustment']}")
    print(f"Message: {analysis['message']}")

    # Show history
    print("\n--- History ---")
    for h in memory.get_history():
        print(f"  {h['type']}: correct={h['is_correct']}, time={h['response_time_sec']}s")
