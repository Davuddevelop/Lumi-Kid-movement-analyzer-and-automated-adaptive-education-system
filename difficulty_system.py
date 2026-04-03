"""
Lumi Adaptive Difficulty System
Smoothly adjusts game difficulty based on player performance.

Tracks: success rate, attempts, solve time
Adjusts: grid size, obstacles, required commands
"""
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime
import math


@dataclass
class PerformanceMetrics:
    """Tracks player performance over time."""
    total_attempts: int = 0
    total_successes: int = 0
    recent_times: List[float] = field(default_factory=list)  # Last N solve times
    recent_results: List[bool] = field(default_factory=list)  # Last N success/fail
    current_streak: int = 0  # Positive = wins, negative = losses
    fastest_time: float = float('inf')
    session_start: str = field(default_factory=lambda: datetime.now().isoformat())


@dataclass
class MissionParams:
    """Generated mission parameters."""
    grid_width: int
    grid_height: int
    obstacle_count: int
    min_commands: int  # Minimum commands needed to solve
    max_commands: int  # Suggested maximum
    time_limit: Optional[float]  # Seconds, None = unlimited
    difficulty_name: str
    difficulty_score: float


class AdaptiveDifficultySystem:
    """
    Smoothly adjusts difficulty based on player performance.
    Uses exponential smoothing to prevent abrupt changes.
    """

    # Difficulty level definitions
    LEVELS = [
        {"name": "Beginner", "range": (0.0, 0.2)},
        {"name": "Easy", "range": (0.2, 0.4)},
        {"name": "Medium", "range": (0.4, 0.6)},
        {"name": "Challenging", "range": (0.6, 0.8)},
        {"name": "Expert", "range": (0.8, 1.0)},
    ]

    def __init__(self,
                 initial_difficulty: float = 0.15,
                 smoothing_factor: float = 0.3,
                 history_size: int = 5):
        """
        Args:
            initial_difficulty: Starting difficulty (0.0-1.0)
            smoothing_factor: How fast difficulty changes (0.1=slow, 0.5=fast)
            history_size: Number of recent attempts to consider
        """
        self.difficulty = max(0.0, min(1.0, initial_difficulty))
        self.smoothing = smoothing_factor
        self.history_size = history_size
        self.metrics = PerformanceMetrics()

        # Target metrics for "ideal" performance at current difficulty
        self.target_success_rate = 0.7  # 70% success is ideal
        self.target_time_multiplier = 1.5  # 1.5x expected time is good

    def record_attempt(self,
                       success: bool,
                       time_seconds: float,
                       commands_used: int,
                       optimal_commands: int) -> Dict:
        """
        Record a mission attempt and update difficulty.

        Args:
            success: Whether the mission was completed
            time_seconds: Time taken to complete/fail
            commands_used: Number of commands in solution
            optimal_commands: Minimum commands needed

        Returns:
            Dict with difficulty adjustment info
        """
        self.metrics.total_attempts += 1
        if success:
            self.metrics.total_successes += 1

        # Update recent history (sliding window)
        self.metrics.recent_times.append(time_seconds)
        if len(self.metrics.recent_times) > self.history_size:
            self.metrics.recent_times.pop(0)

        self.metrics.recent_results.append(success)
        if len(self.metrics.recent_results) > self.history_size:
            self.metrics.recent_results.pop(0)

        # Update streak
        if success:
            if self.metrics.current_streak >= 0:
                self.metrics.current_streak += 1
            else:
                self.metrics.current_streak = 1
            if time_seconds < self.metrics.fastest_time:
                self.metrics.fastest_time = time_seconds
        else:
            if self.metrics.current_streak <= 0:
                self.metrics.current_streak -= 1
            else:
                self.metrics.current_streak = -1

        # Calculate performance score
        performance = self._calculate_performance(
            success, time_seconds, commands_used, optimal_commands
        )

        # Adjust difficulty smoothly
        old_difficulty = self.difficulty
        adjustment = self._calculate_adjustment(performance)
        self.difficulty = self._smooth_adjust(adjustment)

        return {
            "old_difficulty": round(old_difficulty, 3),
            "new_difficulty": round(self.difficulty, 3),
            "change": round(self.difficulty - old_difficulty, 4),
            "performance_score": round(performance, 3),
            "streak": self.metrics.current_streak,
            "level": self._get_level_name(),
            "trend": "up" if adjustment > 0 else "down" if adjustment < 0 else "stable"
        }

    def _calculate_performance(self,
                                success: bool,
                                time_seconds: float,
                                commands_used: int,
                                optimal_commands: int) -> float:
        """
        Calculate performance score (0.0-1.0).
        Higher = better performance = should increase difficulty.
        """
        if not success:
            # Failed: score based on how close they got (estimate from time spent)
            # Quick fail = didn't try hard, slow fail = struggled
            time_factor = min(1.0, time_seconds / 60.0)  # Normalize to 1 min
            return 0.2 * time_factor  # Max 0.2 for failures

        # Success scoring
        score = 0.5  # Base score for success

        # Time bonus (faster = better)
        expected_time = optimal_commands * 3.0  # ~3 sec per command expected
        time_ratio = expected_time / max(1.0, time_seconds)
        time_bonus = min(0.25, max(-0.15, (time_ratio - 0.5) * 0.3))
        score += time_bonus

        # Efficiency bonus (fewer commands = better)
        if commands_used <= optimal_commands:
            score += 0.15  # Perfect or better
        elif commands_used <= optimal_commands * 1.5:
            score += 0.05  # Good
        else:
            score -= 0.05  # Inefficient

        # Streak bonus
        if self.metrics.current_streak >= 3:
            score += 0.1
        elif self.metrics.current_streak >= 2:
            score += 0.05

        return max(0.0, min(1.0, score))

    def _calculate_adjustment(self, performance: float) -> float:
        """
        Calculate how much to adjust difficulty.
        Returns value between -0.1 and +0.1.
        """
        # Recent success rate
        if self.metrics.recent_results:
            recent_success_rate = sum(self.metrics.recent_results) / len(self.metrics.recent_results)
        else:
            recent_success_rate = 0.5

        # Performance vs target
        performance_gap = performance - 0.5  # 0.5 = neutral

        # Success rate vs target
        success_gap = recent_success_rate - self.target_success_rate

        # Combine factors
        adjustment = 0.0

        # Main adjustment from performance
        adjustment += performance_gap * 0.15

        # Secondary adjustment from success rate trend
        adjustment += success_gap * 0.08

        # Streak influence (accelerate changes on strong streaks)
        if self.metrics.current_streak >= 4:
            adjustment *= 1.3
        elif self.metrics.current_streak <= -3:
            adjustment *= 1.2

        # Clamp adjustment
        return max(-0.08, min(0.08, adjustment))

    def _smooth_adjust(self, adjustment: float) -> float:
        """Apply exponential smoothing to difficulty change."""
        # Smoothed update
        new_difficulty = self.difficulty + (adjustment * self.smoothing)

        # Apply boundaries with soft edges
        if new_difficulty < 0.05:
            new_difficulty = 0.05 + (new_difficulty - 0.05) * 0.5
        elif new_difficulty > 0.95:
            new_difficulty = 0.95 + (new_difficulty - 0.95) * 0.5

        return max(0.0, min(1.0, new_difficulty))

    def _get_level_name(self) -> str:
        """Get human-readable difficulty level."""
        for level in self.LEVELS:
            if level["range"][0] <= self.difficulty < level["range"][1]:
                return level["name"]
        return "Expert"

    def generate_mission(self) -> MissionParams:
        """
        Generate mission parameters based on current difficulty.
        Uses smooth interpolation for natural progression.
        """
        d = self.difficulty

        # Grid size: 4x4 to 10x10
        grid_size = self._interpolate(d, 4, 10)
        grid_width = grid_size
        grid_height = grid_size

        # Obstacles: 0 to 8
        obstacle_count = self._interpolate(d, 0, 8)

        # Command complexity: 2-4 (easy) to 8-15 (hard)
        min_commands = self._interpolate(d, 2, 8)
        max_commands = self._interpolate(d, 5, 15)

        # Time limit: None (easy) to 60s (hard), starts at medium
        if d < 0.3:
            time_limit = None
        else:
            time_limit = self._interpolate(d, 120, 45, start_at=0.3)

        return MissionParams(
            grid_width=grid_width,
            grid_height=grid_height,
            obstacle_count=obstacle_count,
            min_commands=min_commands,
            max_commands=max_commands,
            time_limit=time_limit,
            difficulty_name=self._get_level_name(),
            difficulty_score=round(self.difficulty, 3)
        )

    def _interpolate(self, d: float, low: int, high: int, start_at: float = 0.0) -> int:
        """Smoothly interpolate between low and high based on difficulty."""
        if d < start_at:
            return low
        adjusted_d = (d - start_at) / (1.0 - start_at)
        # Use ease-in-out curve for smoother transitions
        eased = self._ease_in_out(adjusted_d)
        value = low + (high - low) * eased
        return int(round(value))

    def _ease_in_out(self, t: float) -> float:
        """Smooth ease-in-out curve (cubic)."""
        if t < 0.5:
            return 4 * t * t * t
        else:
            return 1 - pow(-2 * t + 2, 3) / 2

    def get_status(self) -> Dict:
        """Get current system status."""
        mission = self.generate_mission()
        return {
            "difficulty": round(self.difficulty, 3),
            "level": self._get_level_name(),
            "metrics": {
                "total_attempts": self.metrics.total_attempts,
                "total_successes": self.metrics.total_successes,
                "success_rate": round(
                    self.metrics.total_successes / max(1, self.metrics.total_attempts), 2
                ),
                "current_streak": self.metrics.current_streak,
                "fastest_time": round(self.metrics.fastest_time, 1) if self.metrics.fastest_time != float('inf') else None
            },
            "next_mission": {
                "grid": f"{mission.grid_width}x{mission.grid_height}",
                "obstacles": mission.obstacle_count,
                "commands": f"{mission.min_commands}-{mission.max_commands}",
                "time_limit": mission.time_limit
            }
        }

    def set_difficulty(self, difficulty: float) -> None:
        """Manually set difficulty (for testing or overrides)."""
        self.difficulty = max(0.0, min(1.0, difficulty))

    def reset(self) -> None:
        """Reset all metrics and difficulty."""
        self.difficulty = 0.15
        self.metrics = PerformanceMetrics()


# ============================================
# TEST
# ============================================
if __name__ == "__main__":
    system = AdaptiveDifficultySystem(initial_difficulty=0.15)

    print("=" * 60)
    print("  ADAPTIVE DIFFICULTY SYSTEM TEST")
    print("=" * 60)

    # Simulate a learning curve
    scenarios = [
        # (success, time_sec, commands_used, optimal_commands)
        ("Struggle at start", False, 45, 8, 4),
        ("Struggle again", False, 50, 10, 4),
        ("Finally succeed!", True, 30, 6, 4),
        ("Getting better", True, 20, 5, 4),
        ("Quick solve", True, 12, 4, 4),
        ("On a roll", True, 10, 4, 4),
        ("Speeding up", True, 8, 4, 4),
        ("Perfect!", True, 6, 4, 4),
        ("Harder now...", True, 25, 8, 6),
        ("Still good", True, 18, 7, 6),
        ("Oops, failed", False, 35, 9, 6),
        ("Recover", True, 22, 7, 6),
    ]

    for name, success, time_sec, commands, optimal in scenarios:
        result = system.record_attempt(success, time_sec, commands, optimal)
        status = "OK" if success else "FAIL"
        arrow = "^" if result["trend"] == "up" else "v" if result["trend"] == "down" else "-"

        print(f"\n[{status}] {name}")
        print(f"  Time: {time_sec}s | Commands: {commands}/{optimal}")
        print(f"  Difficulty: {result['old_difficulty']:.2f} {arrow} {result['new_difficulty']:.2f} ({result['level']})")
        print(f"  Streak: {result['streak']} | Performance: {result['performance_score']:.2f}")

    print("\n" + "=" * 60)
    print("  FINAL STATUS")
    print("=" * 60)

    status = system.get_status()
    print(f"\nDifficulty: {status['difficulty']} ({status['level']})")
    print(f"Success Rate: {status['metrics']['success_rate']*100:.0f}%")
    print(f"Streak: {status['metrics']['current_streak']}")
    print(f"\nNext Mission:")
    print(f"  Grid: {status['next_mission']['grid']}")
    print(f"  Obstacles: {status['next_mission']['obstacles']}")
    print(f"  Commands: {status['next_mission']['commands']}")
    print(f"  Time Limit: {status['next_mission']['time_limit'] or 'None'}")

    print("\n" + "=" * 60)
    print("  DIFFICULTY PROGRESSION")
    print("=" * 60)

    # Show how missions change across difficulty range
    print("\nMission parameters at each level:\n")
    print(f"{'Diff':>5} | {'Level':<12} | {'Grid':>6} | {'Obstacles':>9} | {'Commands':>10} | {'Time':>6}")
    print("-" * 60)

    for d in [0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 0.95]:
        system.set_difficulty(d)
        m = system.generate_mission()
        time_str = f"{m.time_limit:.0f}s" if m.time_limit else "None"
        print(f"{d:>5.2f} | {m.difficulty_name:<12} | {m.grid_width}x{m.grid_height:>2} | {m.obstacle_count:>9} | {m.min_commands:>4}-{m.max_commands:<5} | {time_str:>6}")
