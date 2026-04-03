"""
CodeBrick Level Progression System
A structured learning journey from beginner to advanced.

Features:
- 20 carefully designed levels
- Progressive concept introduction
- Validation and scoring
- Hint system
- Level unlocking
- Random level generator
"""
from typing import Dict, List, Optional, Tuple, Set
from dataclasses import dataclass, field
from enum import Enum
import json
import random
import copy


# ============================================
# DATA STRUCTURES
# ============================================

class Difficulty(Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    EXPERT = "expert"


@dataclass
class Level:
    """Represents a single game level."""
    level_id: int
    name: str
    difficulty: Difficulty
    grid_size: Tuple[int, int]
    start: Tuple[int, int]
    goal: Tuple[int, int]
    obstacles: List[Tuple[int, int]]
    allowed_commands: List[str]
    description: str
    learning_goal: str
    max_steps: Optional[int] = None
    time_limit: Optional[int] = None  # seconds
    optimal_solution: Optional[int] = None  # minimum commands needed
    hints: List[str] = field(default_factory=list)
    requires_loop: bool = False
    unlock_requires: Optional[int] = None  # level_id required to unlock

    def to_dict(self) -> Dict:
        return {
            "level_id": self.level_id,
            "name": self.name,
            "difficulty": self.difficulty.value,
            "grid_size": list(self.grid_size),
            "start": list(self.start),
            "goal": list(self.goal),
            "obstacles": [list(o) for o in self.obstacles],
            "allowed_commands": self.allowed_commands,
            "max_steps": self.max_steps,
            "time_limit": self.time_limit,
            "optimal_solution": self.optimal_solution,
            "description": self.description,
            "learning_goal": self.learning_goal,
            "hints": self.hints,
            "requires_loop": self.requires_loop
        }


@dataclass
class ValidationResult:
    """Result of validating a solution."""
    success: bool
    reached_goal: bool
    error: Optional[str]
    path: List[Tuple[int, int]]
    commands_used: int
    efficiency_score: float  # 0-100
    stars: int  # 1-3 stars
    feedback: str


@dataclass
class PlayerProgress:
    """Tracks player progress through levels."""
    completed_levels: Set[int] = field(default_factory=set)
    stars_earned: Dict[int, int] = field(default_factory=dict)
    attempts: Dict[int, int] = field(default_factory=dict)
    best_solutions: Dict[int, int] = field(default_factory=dict)  # level_id -> commands


# ============================================
# LEVEL DEFINITIONS
# ============================================

LEVELS: List[Level] = [
    # === CHAPTER 1: BASICS (Levels 1-5) ===
    Level(
        level_id=1,
        name="First Steps",
        difficulty=Difficulty.EASY,
        grid_size=(5, 5),
        start=(0, 2),
        goal=(3, 2),
        obstacles=[],
        allowed_commands=["forward"],
        description="Move the robot to the flag! Just go forward.",
        learning_goal="Learn that 'forward' moves the robot one step",
        optimal_solution=3,
        hints=[
            "The robot moves one step with each 'forward' command",
            "Count the squares between you and the goal",
            "You need 3 forward commands"
        ]
    ),
    Level(
        level_id=2,
        name="One More Step",
        difficulty=Difficulty.EASY,
        grid_size=(5, 5),
        start=(0, 2),
        goal=(4, 2),
        obstacles=[],
        allowed_commands=["forward"],
        description="The goal is a bit further now. Keep going!",
        learning_goal="Practice counting steps accurately",
        optimal_solution=4,
        hints=[
            "Count carefully - how many squares?",
            "One forward = one square",
            "You need exactly 4 forwards"
        ],
        unlock_requires=1
    ),
    Level(
        level_id=3,
        name="Turn Right",
        difficulty=Difficulty.EASY,
        grid_size=(5, 5),
        start=(1, 2),
        goal=(1, 4),
        obstacles=[],
        allowed_commands=["forward", "turn_right"],
        description="The goal is below you. Learn to turn!",
        learning_goal="Introduce turning - the robot can change direction",
        optimal_solution=3,
        hints=[
            "The robot starts facing right (East)",
            "Turn right to face down (South)",
            "Then move forward to the goal"
        ],
        unlock_requires=2
    ),
    Level(
        level_id=4,
        name="Turn Left",
        difficulty=Difficulty.EASY,
        grid_size=(5, 5),
        start=(2, 2),
        goal=(2, 0),
        obstacles=[],
        allowed_commands=["forward", "turn_left"],
        description="Now try turning left to reach the goal above!",
        learning_goal="Learn left turns complement right turns",
        optimal_solution=3,
        hints=[
            "Turn left to face up (North)",
            "The goal is 2 squares above you",
            "Turn once, then go forward twice"
        ],
        unlock_requires=3
    ),
    Level(
        level_id=5,
        name="L-Shape Path",
        difficulty=Difficulty.EASY,
        grid_size=(5, 5),
        start=(0, 0),
        goal=(2, 2),
        obstacles=[],
        allowed_commands=["forward", "turn_right", "turn_left"],
        description="Combine movement and turning to make an L-shape!",
        learning_goal="Combine forward and turns in a sequence",
        optimal_solution=5,
        hints=[
            "Go forward first, then turn, then forward again",
            "Think about the shape of your path",
            "Forward 2, turn right, forward 2"
        ],
        unlock_requires=4
    ),

    # === CHAPTER 2: OBSTACLES (Levels 6-10) ===
    Level(
        level_id=6,
        name="First Obstacle",
        difficulty=Difficulty.EASY,
        grid_size=(5, 5),
        start=(0, 2),
        goal=(4, 2),
        obstacles=[(2, 2)],
        allowed_commands=["forward", "turn_right", "turn_left"],
        description="There's a rock in the way! Go around it.",
        learning_goal="Learn to navigate around a single obstacle",
        optimal_solution=6,
        hints=[
            "You can't go through the rock!",
            "Go up or down to get around it",
            "Turn, go forward, turn back, continue"
        ],
        unlock_requires=5
    ),
    Level(
        level_id=7,
        name="Narrow Passage",
        difficulty=Difficulty.MEDIUM,
        grid_size=(6, 6),
        start=(0, 2),
        goal=(5, 2),
        obstacles=[(2, 1), (2, 2), (2, 3), (3, 3)],
        allowed_commands=["forward", "turn_right", "turn_left"],
        description="Find the gap in the wall of rocks!",
        learning_goal="Identify and navigate through openings",
        optimal_solution=9,
        hints=[
            "Look for where there's no rock",
            "The gap is at the top",
            "Go up, across, then back down"
        ],
        unlock_requires=6
    ),
    Level(
        level_id=8,
        name="Zigzag Path",
        difficulty=Difficulty.MEDIUM,
        grid_size=(6, 6),
        start=(0, 0),
        goal=(5, 5),
        obstacles=[(1, 1), (2, 2), (3, 3), (4, 4)],
        allowed_commands=["forward", "turn_right", "turn_left"],
        description="Navigate the diagonal obstacles!",
        learning_goal="Plan complex paths around multiple obstacles",
        optimal_solution=14,
        hints=[
            "The rocks form a diagonal line",
            "Stay below or above the line",
            "Zigzag around each rock"
        ],
        unlock_requires=7
    ),
    Level(
        level_id=9,
        name="The Corridor",
        difficulty=Difficulty.MEDIUM,
        grid_size=(7, 5),
        start=(0, 2),
        goal=(6, 2),
        obstacles=[(1, 0), (1, 1), (1, 3), (1, 4), (3, 0), (3, 1), (3, 3), (3, 4), (5, 0), (5, 1), (5, 3), (5, 4)],
        allowed_commands=["forward", "turn_right", "turn_left"],
        description="Find your way through the winding corridor!",
        learning_goal="Navigate through constrained spaces",
        optimal_solution=10,
        hints=[
            "The path weaves through the walls",
            "Only one way through at each wall",
            "Keep moving forward through the gaps"
        ],
        unlock_requires=8
    ),
    Level(
        level_id=10,
        name="Efficiency Challenge",
        difficulty=Difficulty.MEDIUM,
        grid_size=(6, 6),
        start=(0, 0),
        goal=(5, 0),
        obstacles=[(2, 0), (2, 1), (3, 1)],
        allowed_commands=["forward", "turn_right", "turn_left"],
        max_steps=12,
        description="Reach the goal in 12 steps or less!",
        learning_goal="Learn to optimize your solution",
        optimal_solution=9,
        hints=[
            "Don't waste moves!",
            "Find the shortest path around",
            "Every extra turn costs a step"
        ],
        unlock_requires=9
    ),

    # === CHAPTER 3: LOOPS (Levels 11-15) ===
    Level(
        level_id=11,
        name="Repeat After Me",
        difficulty=Difficulty.MEDIUM,
        grid_size=(8, 5),
        start=(0, 2),
        goal=(7, 2),
        obstacles=[],
        allowed_commands=["forward", "loop"],
        description="Going far? Use the loop block to repeat!",
        learning_goal="Introduce the loop command for repetition",
        optimal_solution=4,
        hints=[
            "Loop repeats the previous command",
            "forward + loop = 3 forwards",
            "Use fewer blocks with loops!"
        ],
        unlock_requires=10
    ),
    Level(
        level_id=12,
        name="Loop Master",
        difficulty=Difficulty.MEDIUM,
        grid_size=(8, 8),
        start=(0, 0),
        goal=(0, 7),
        obstacles=[],
        allowed_commands=["forward", "turn_right", "turn_left", "loop"],
        max_steps=6,
        requires_loop=True,
        description="Reach the bottom with only 6 commands!",
        learning_goal="Loops are essential for efficiency",
        optimal_solution=4,
        hints=[
            "You MUST use loops to solve this",
            "Turn right, then use forward + loops",
            "One loop = 2 extra of the same move"
        ],
        unlock_requires=11
    ),
    Level(
        level_id=13,
        name="Spiral Outward",
        difficulty=Difficulty.HARD,
        grid_size=(7, 7),
        start=(3, 3),
        goal=(6, 6),
        obstacles=[(3, 4), (4, 3), (2, 3), (3, 2)],
        allowed_commands=["forward", "turn_right", "turn_left", "loop"],
        description="Spiral out from the center!",
        learning_goal="Combine turns and loops strategically",
        optimal_solution=10,
        hints=[
            "You're surrounded! Find the escape",
            "Move diagonally outward",
            "Use loops when going straight"
        ],
        unlock_requires=12
    ),
    Level(
        level_id=14,
        name="The Square",
        difficulty=Difficulty.HARD,
        grid_size=(6, 6),
        start=(1, 1),
        goal=(1, 1),  # Return to start!
        obstacles=[(2, 2), (2, 3), (3, 2), (3, 3)],
        allowed_commands=["forward", "turn_right", "loop"],
        max_steps=12,
        description="Go around the obstacle and return home!",
        learning_goal="Plan a complete circuit path",
        optimal_solution=10,
        hints=[
            "You need to make a square path",
            "Each side: forward + loop",
            "4 sides = 4 turns"
        ],
        unlock_requires=13
    ),
    Level(
        level_id=15,
        name="Precision Required",
        difficulty=Difficulty.HARD,
        grid_size=(8, 8),
        start=(0, 4),
        goal=(7, 4),
        obstacles=[(2, 3), (2, 4), (2, 5), (4, 2), (4, 3), (4, 5), (4, 6), (6, 3), (6, 4), (6, 5)],
        allowed_commands=["forward", "turn_right", "turn_left", "loop"],
        max_steps=20,
        description="Navigate the maze with limited moves!",
        learning_goal="Combine all skills: planning, loops, efficiency",
        optimal_solution=16,
        hints=[
            "Plan your entire route first",
            "Each wall has exactly one gap",
            "Use loops on the long stretches"
        ],
        unlock_requires=14
    ),

    # === CHAPTER 4: MASTERY (Levels 16-20) ===
    Level(
        level_id=16,
        name="The Labyrinth",
        difficulty=Difficulty.HARD,
        grid_size=(9, 9),
        start=(0, 4),
        goal=(8, 4),
        obstacles=[
            (1, 1), (1, 2), (1, 3), (1, 5), (1, 6), (1, 7),
            (3, 0), (3, 1), (3, 3), (3, 4), (3, 5), (3, 7), (3, 8),
            (5, 1), (5, 2), (5, 3), (5, 5), (5, 6), (5, 7),
            (7, 0), (7, 1), (7, 3), (7, 4), (7, 5), (7, 7), (7, 8)
        ],
        allowed_commands=["forward", "turn_right", "turn_left", "loop"],
        description="The ultimate maze challenge!",
        learning_goal="Master maze navigation with all tools",
        optimal_solution=24,
        hints=[
            "Map out the entire path first",
            "There's only one way through",
            "Be patient and systematic"
        ],
        unlock_requires=15
    ),
    Level(
        level_id=17,
        name="Speed Run",
        difficulty=Difficulty.HARD,
        grid_size=(8, 8),
        start=(0, 0),
        goal=(7, 7),
        obstacles=[(2, 2), (2, 5), (5, 2), (5, 5)],
        allowed_commands=["forward", "turn_right", "turn_left", "loop"],
        time_limit=30,
        description="Reach the goal in 30 seconds!",
        learning_goal="Apply skills quickly under pressure",
        optimal_solution=18,
        hints=[
            "Don't overthink - act fast!",
            "Diagonal path is shortest",
            "Use loops to save time"
        ],
        unlock_requires=16
    ),
    Level(
        level_id=18,
        name="Minimal Moves",
        difficulty=Difficulty.EXPERT,
        grid_size=(10, 10),
        start=(0, 5),
        goal=(9, 5),
        obstacles=[(3, 4), (3, 5), (3, 6), (6, 3), (6, 4), (6, 6), (6, 7)],
        allowed_commands=["forward", "turn_right", "turn_left", "loop"],
        max_steps=15,
        requires_loop=True,
        description="Cross the field with only 15 commands!",
        learning_goal="Extreme efficiency with loops",
        optimal_solution=13,
        hints=[
            "Every command must count",
            "Maximize loop usage",
            "Find the path with longest straights"
        ],
        unlock_requires=17
    ),
    Level(
        level_id=19,
        name="The Gauntlet",
        difficulty=Difficulty.EXPERT,
        grid_size=(10, 6),
        start=(0, 3),
        goal=(9, 3),
        obstacles=[
            (1, 2), (1, 4),
            (2, 1), (2, 3), (2, 5),
            (3, 0), (3, 2), (3, 4),
            (4, 1), (4, 3), (4, 5),
            (5, 2), (5, 4),
            (6, 1), (6, 3), (6, 5),
            (7, 0), (7, 2), (7, 4),
            (8, 1), (8, 3), (8, 5)
        ],
        allowed_commands=["forward", "turn_right", "turn_left", "loop"],
        max_steps=25,
        description="Weave through the dense obstacle field!",
        learning_goal="Handle high-density obstacle navigation",
        optimal_solution=22,
        hints=[
            "Follow the zigzag pattern",
            "Look one move ahead always",
            "Patience is key"
        ],
        unlock_requires=18
    ),
    Level(
        level_id=20,
        name="Grand Master",
        difficulty=Difficulty.EXPERT,
        grid_size=(12, 12),
        start=(0, 6),
        goal=(11, 6),
        obstacles=[
            # Outer walls with gaps
            (2, 0), (2, 1), (2, 2), (2, 4), (2, 5), (2, 6), (2, 7), (2, 8), (2, 10), (2, 11),
            (5, 1), (5, 2), (5, 3), (5, 4), (5, 6), (5, 7), (5, 8), (5, 9), (5, 10),
            (8, 0), (8, 1), (8, 3), (8, 4), (8, 5), (8, 6), (8, 8), (8, 9), (8, 10), (8, 11)
        ],
        allowed_commands=["forward", "turn_right", "turn_left", "loop"],
        max_steps=30,
        time_limit=60,
        requires_loop=True,
        description="The final challenge. Prove your mastery!",
        learning_goal="Apply everything you've learned",
        optimal_solution=26,
        hints=[
            "This is the ultimate test",
            "Plan completely before starting",
            "You've trained for this!"
        ],
        unlock_requires=19
    ),
]


# ============================================
# LEVEL SYSTEM CLASS
# ============================================

class LevelSystem:
    """Manages levels, validation, and progression."""

    # Direction vectors: 0=North, 1=East, 2=South, 3=West
    DIR_VECTORS = {0: (0, -1), 1: (1, 0), 2: (0, 1), 3: (-1, 0)}
    DIR_NAMES = {0: "North", 1: "East", 2: "South", 3: "West"}

    def __init__(self):
        self.levels = {level.level_id: level for level in LEVELS}
        self.progress = PlayerProgress()

    def get_level(self, level_id: int) -> Optional[Level]:
        """Load a level by ID."""
        return self.levels.get(level_id)

    def get_all_levels(self) -> List[Level]:
        """Get all levels in order."""
        return sorted(self.levels.values(), key=lambda l: l.level_id)

    def get_available_levels(self) -> List[Level]:
        """Get levels that are unlocked for the player."""
        available = []
        for level in self.get_all_levels():
            if self.is_level_unlocked(level.level_id):
                available.append(level)
        return available

    def is_level_unlocked(self, level_id: int) -> bool:
        """Check if a level is unlocked."""
        level = self.get_level(level_id)
        if not level:
            return False
        if level.unlock_requires is None:
            return True  # First level is always unlocked
        return level.unlock_requires in self.progress.completed_levels

    def validate_solution(self, commands: List[str], level_id: int) -> ValidationResult:
        """
        Validate a solution against a level.

        Returns ValidationResult with success, path, score, etc.
        """
        level = self.get_level(level_id)
        if not level:
            return ValidationResult(
                success=False,
                reached_goal=False,
                error="Level not found",
                path=[],
                commands_used=0,
                efficiency_score=0,
                stars=0,
                feedback="Invalid level"
            )

        # Check allowed commands
        for cmd in commands:
            if cmd not in level.allowed_commands:
                return ValidationResult(
                    success=False,
                    reached_goal=False,
                    error=f"Command '{cmd}' is not allowed in this level",
                    path=[],
                    commands_used=len(commands),
                    efficiency_score=0,
                    stars=0,
                    feedback=f"Oops! You can't use '{cmd}' here. Try: {', '.join(level.allowed_commands)}"
                )

        # Check max steps
        if level.max_steps and len(commands) > level.max_steps:
            return ValidationResult(
                success=False,
                reached_goal=False,
                error=f"Too many commands: {len(commands)} > {level.max_steps}",
                path=[],
                commands_used=len(commands),
                efficiency_score=0,
                stars=0,
                feedback=f"Too many blocks! Use {level.max_steps} or fewer."
            )

        # Check requires_loop
        if level.requires_loop and "loop" not in commands:
            return ValidationResult(
                success=False,
                reached_goal=False,
                error="This level requires using a loop",
                path=[],
                commands_used=len(commands),
                efficiency_score=0,
                stars=0,
                feedback="Hint: You need to use the loop block to solve this!"
            )

        # Simulate execution
        result = self._simulate(commands, level)

        return result

    def _simulate(self, commands: List[str], level: Level) -> ValidationResult:
        """Simulate command execution on a level."""
        x, y = level.start
        direction = 1  # Start facing East
        path = [(x, y)]
        obstacles_set = set(level.obstacles)
        grid_w, grid_h = level.grid_size

        # Expand loops
        expanded = self._expand_loops(commands)

        for i, cmd in enumerate(expanded):
            if cmd == "turn_right":
                direction = (direction + 1) % 4
            elif cmd == "turn_left":
                direction = (direction - 1) % 4
            elif cmd == "forward":
                dx, dy = self.DIR_VECTORS[direction]
                nx, ny = x + dx, y + dy

                # Boundary check
                if nx < 0 or nx >= grid_w or ny < 0 or ny >= grid_h:
                    return ValidationResult(
                        success=False,
                        reached_goal=False,
                        error=f"Fell off the edge at step {i+1}",
                        path=path,
                        commands_used=len(commands),
                        efficiency_score=0,
                        stars=0,
                        feedback=f"Oops! The robot went off the edge. Try turning first!"
                    )

                # Obstacle check
                if (nx, ny) in obstacles_set:
                    return ValidationResult(
                        success=False,
                        reached_goal=False,
                        error=f"Hit obstacle at ({nx}, {ny})",
                        path=path,
                        commands_used=len(commands),
                        efficiency_score=0,
                        stars=0,
                        feedback=f"Crash! There's a rock at ({nx}, {ny}). Go around it!"
                    )

                x, y = nx, ny
                path.append((x, y))

        # Check if reached goal
        reached_goal = (x, y) == level.goal

        if not reached_goal:
            return ValidationResult(
                success=False,
                reached_goal=False,
                error=f"Did not reach goal. Ended at ({x}, {y})",
                path=path,
                commands_used=len(commands),
                efficiency_score=0,
                stars=0,
                feedback=f"Almost! You ended at ({x}, {y}) but the goal is at {level.goal}."
            )

        # Calculate score
        efficiency = self._calculate_efficiency(commands, level)
        stars = self._calculate_stars(commands, level, efficiency)
        feedback = self._generate_success_feedback(stars, len(commands), level)

        return ValidationResult(
            success=True,
            reached_goal=True,
            error=None,
            path=path,
            commands_used=len(commands),
            efficiency_score=efficiency,
            stars=stars,
            feedback=feedback
        )

    def _expand_loops(self, commands: List[str]) -> List[str]:
        """Expand loop commands into repeated commands."""
        expanded = []
        for cmd in commands:
            if cmd == "loop" and expanded:
                expanded.extend([expanded[-1]] * 2)
            else:
                expanded.append(cmd)
        return expanded

    def _calculate_efficiency(self, commands: List[str], level: Level) -> float:
        """Calculate efficiency score (0-100)."""
        if not level.optimal_solution:
            return 100.0

        used = len(commands)
        optimal = level.optimal_solution

        if used <= optimal:
            return 100.0
        elif used <= optimal * 1.25:
            return 90.0 - (used - optimal) * 5
        elif used <= optimal * 1.5:
            return 70.0 - (used - optimal * 1.25) * 4
        else:
            return max(30.0, 50.0 - (used - optimal * 1.5) * 3)

    def _calculate_stars(self, commands: List[str], level: Level, efficiency: float) -> int:
        """Calculate star rating (1-3)."""
        if efficiency >= 95:
            return 3
        elif efficiency >= 75:
            return 2
        else:
            return 1

    def _generate_success_feedback(self, stars: int, commands_used: int, level: Level) -> str:
        """Generate celebratory feedback based on performance."""
        if stars == 3:
            messages = [
                "Perfect! You're a coding master!",
                "Amazing! Couldn't be better!",
                "Brilliant! Optimal solution!",
            ]
        elif stars == 2:
            messages = [
                "Great job! Can you do even better?",
                "Well done! Try to use fewer blocks!",
                "Nice work! You're getting good at this!",
            ]
        else:
            messages = [
                "You did it! Now try to optimize!",
                "Goal reached! Can you find a shorter path?",
                "Success! Practice makes perfect!",
            ]

        return random.choice(messages)

    def record_completion(self, level_id: int, result: ValidationResult) -> Dict:
        """Record level completion and update progress."""
        if not result.success:
            self.progress.attempts[level_id] = self.progress.attempts.get(level_id, 0) + 1
            return {"recorded": False, "reason": "Level not completed successfully"}

        # Update completed levels
        self.progress.completed_levels.add(level_id)

        # Update stars (keep best)
        current_stars = self.progress.stars_earned.get(level_id, 0)
        if result.stars > current_stars:
            self.progress.stars_earned[level_id] = result.stars

        # Update best solution
        current_best = self.progress.best_solutions.get(level_id, float('inf'))
        if result.commands_used < current_best:
            self.progress.best_solutions[level_id] = result.commands_used

        # Check for newly unlocked levels
        newly_unlocked = []
        for level in self.get_all_levels():
            if level.unlock_requires == level_id and level.level_id not in self.progress.completed_levels:
                newly_unlocked.append(level.level_id)

        return {
            "recorded": True,
            "stars": result.stars,
            "is_new_best": result.commands_used < current_best,
            "newly_unlocked": newly_unlocked,
            "total_stars": sum(self.progress.stars_earned.values()),
            "levels_completed": len(self.progress.completed_levels)
        }

    def get_hint(self, level_id: int, hint_index: int = 0) -> Optional[str]:
        """Get a hint for a level."""
        level = self.get_level(level_id)
        if not level or not level.hints:
            return None
        if hint_index >= len(level.hints):
            return level.hints[-1]  # Return last hint
        return level.hints[hint_index]

    def get_progress_summary(self) -> Dict:
        """Get summary of player progress."""
        total_levels = len(self.levels)
        completed = len(self.progress.completed_levels)
        total_stars = sum(self.progress.stars_earned.values())
        max_stars = total_levels * 3

        return {
            "levels_completed": completed,
            "total_levels": total_levels,
            "completion_percent": round(completed / total_levels * 100, 1),
            "total_stars": total_stars,
            "max_stars": max_stars,
            "star_percent": round(total_stars / max_stars * 100, 1),
            "next_level": self._get_next_level()
        }

    def _get_next_level(self) -> Optional[int]:
        """Get the next uncompleted level."""
        for level in self.get_all_levels():
            if level.level_id not in self.progress.completed_levels:
                if self.is_level_unlocked(level.level_id):
                    return level.level_id
        return None

    def reset_progress(self) -> None:
        """Reset all player progress."""
        self.progress = PlayerProgress()


# ============================================
# RANDOM LEVEL GENERATOR
# ============================================

class RandomLevelGenerator:
    """Generates random levels with guaranteed solvability."""

    def __init__(self):
        self.level_counter = 1000  # Start IDs at 1000 for generated levels

    def generate(self,
                 difficulty: Difficulty = Difficulty.MEDIUM,
                 grid_size: Optional[Tuple[int, int]] = None,
                 include_loops: bool = False) -> Level:
        """
        Generate a random level with guaranteed path to goal.
        """
        # Set grid size based on difficulty
        if grid_size is None:
            sizes = {
                Difficulty.EASY: (5, 5),
                Difficulty.MEDIUM: (7, 7),
                Difficulty.HARD: (9, 9),
                Difficulty.EXPERT: (11, 11)
            }
            grid_size = sizes[difficulty]

        w, h = grid_size

        # Place start and goal
        start = (0, h // 2)
        goal = (w - 1, h // 2)

        # Generate a valid path first
        path = self._generate_path(start, goal, grid_size)

        # Place obstacles (not on path)
        path_set = set(path)
        obstacle_counts = {
            Difficulty.EASY: (0, 2),
            Difficulty.MEDIUM: (3, 6),
            Difficulty.HARD: (6, 10),
            Difficulty.EXPERT: (10, 15)
        }
        min_obs, max_obs = obstacle_counts[difficulty]
        obstacle_count = random.randint(min_obs, max_obs)

        obstacles = []
        available = [(x, y) for x in range(w) for y in range(h)
                     if (x, y) not in path_set and (x, y) != start and (x, y) != goal]

        if available:
            obstacles = random.sample(available, min(obstacle_count, len(available)))

        # Determine allowed commands
        if include_loops:
            allowed = ["forward", "turn_right", "turn_left", "loop"]
        else:
            allowed = ["forward", "turn_right", "turn_left"]

        # Calculate optimal solution estimate
        optimal = len(path) - 1 + self._count_turns(path)

        self.level_counter += 1

        return Level(
            level_id=self.level_counter,
            name=f"Random Challenge #{self.level_counter - 1000}",
            difficulty=difficulty,
            grid_size=grid_size,
            start=start,
            goal=goal,
            obstacles=obstacles,
            allowed_commands=allowed,
            description=f"A randomly generated {difficulty.value} challenge!",
            learning_goal="Practice your skills on a new puzzle",
            optimal_solution=optimal,
            hints=[
                "This is a random level - explore!",
                "Find the path between obstacles",
                "You can do it!"
            ]
        )

    def _generate_path(self, start: Tuple[int, int], goal: Tuple[int, int],
                       grid_size: Tuple[int, int]) -> List[Tuple[int, int]]:
        """Generate a valid path from start to goal using simple pathfinding."""
        path = [start]
        x, y = start
        gx, gy = goal
        w, h = grid_size

        while (x, y) != goal:
            # Move toward goal with some randomness
            moves = []
            if x < gx:
                moves.append((1, 0))
            elif x > gx:
                moves.append((-1, 0))
            if y < gy:
                moves.append((0, 1))
            elif y > gy:
                moves.append((0, -1))

            if not moves:
                break

            # Add some random wandering
            if random.random() < 0.2:
                all_moves = [(1, 0), (-1, 0), (0, 1), (0, -1)]
                valid = [(dx, dy) for dx, dy in all_moves
                         if 0 <= x + dx < w and 0 <= y + dy < h]
                if valid:
                    moves = valid

            dx, dy = random.choice(moves)
            nx, ny = x + dx, y + dy

            if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in path:
                x, y = nx, ny
                path.append((x, y))

        return path

    def _count_turns(self, path: List[Tuple[int, int]]) -> int:
        """Count direction changes in a path."""
        if len(path) < 3:
            return 0

        turns = 0
        for i in range(1, len(path) - 1):
            prev_dir = (path[i][0] - path[i-1][0], path[i][1] - path[i-1][1])
            next_dir = (path[i+1][0] - path[i][0], path[i+1][1] - path[i][1])
            if prev_dir != next_dir:
                turns += 1
        return turns


# ============================================
# EXPORT FUNCTIONS
# ============================================

def export_levels_json(filepath: str = "levels.json") -> None:
    """Export all levels to JSON file."""
    levels_data = [level.to_dict() for level in LEVELS]
    with open(filepath, 'w') as f:
        json.dump(levels_data, f, indent=2)
    print(f"Exported {len(levels_data)} levels to {filepath}")


def load_levels_json(filepath: str = "levels.json") -> List[Level]:
    """Load levels from JSON file."""
    with open(filepath, 'r') as f:
        data = json.load(f)

    levels = []
    for d in data:
        level = Level(
            level_id=d["level_id"],
            name=d["name"],
            difficulty=Difficulty(d["difficulty"]),
            grid_size=tuple(d["grid_size"]),
            start=tuple(d["start"]),
            goal=tuple(d["goal"]),
            obstacles=[tuple(o) for o in d["obstacles"]],
            allowed_commands=d["allowed_commands"],
            description=d["description"],
            learning_goal=d["learning_goal"],
            max_steps=d.get("max_steps"),
            time_limit=d.get("time_limit"),
            optimal_solution=d.get("optimal_solution"),
            hints=d.get("hints", []),
            requires_loop=d.get("requires_loop", False)
        )
        levels.append(level)

    return levels


# ============================================
# TEST
# ============================================

if __name__ == "__main__":
    system = LevelSystem()

    print("=" * 65)
    print("  CODEBRICK LEVEL SYSTEM")
    print("=" * 65)

    print("\n--- ALL LEVELS ---\n")
    print(f"{'ID':>3} | {'Name':<20} | {'Difficulty':<10} | {'Grid':>5} | {'Obs':>3} | {'Opt':>3}")
    print("-" * 65)

    for level in system.get_all_levels():
        obs = len(level.obstacles)
        opt = level.optimal_solution or "-"
        grid = f"{level.grid_size[0]}x{level.grid_size[1]}"
        print(f"{level.level_id:>3} | {level.name:<20} | {level.difficulty.value:<10} | {grid:>5} | {obs:>3} | {opt:>3}")

    print("\n--- VALIDATION TESTS ---\n")

    # Test Level 1
    print("Level 1 - Correct solution:")
    result = system.validate_solution(["forward", "forward", "forward"], 1)
    print(f"  Success: {result.success}, Stars: {result.stars}")
    print(f"  Feedback: {result.feedback}")

    # Test Level 1 - Wrong
    print("\nLevel 1 - Too few commands:")
    result = system.validate_solution(["forward", "forward"], 1)
    print(f"  Success: {result.success}")
    print(f"  Feedback: {result.feedback}")

    # Test Level 6 - Obstacle
    print("\nLevel 6 - Hit obstacle:")
    result = system.validate_solution(["forward", "forward", "forward"], 6)
    print(f"  Success: {result.success}")
    print(f"  Feedback: {result.feedback}")

    # Test Level 6 - Correct
    print("\nLevel 6 - Go around obstacle:")
    result = system.validate_solution([
        "forward", "turn_left", "forward", "turn_right",
        "forward", "forward", "turn_right", "forward", "turn_left", "forward"
    ], 6)
    print(f"  Success: {result.success}, Stars: {result.stars}")
    print(f"  Efficiency: {result.efficiency_score:.1f}%")

    # Test loop requirement
    print("\nLevel 12 - Requires loop (without loop):")
    result = system.validate_solution(["turn_right"] + ["forward"] * 7, 12)
    print(f"  Success: {result.success}")
    print(f"  Feedback: {result.feedback}")

    print("\nLevel 12 - With loop:")
    result = system.validate_solution(["turn_right", "forward", "loop", "loop"], 12)
    print(f"  Success: {result.success}, Stars: {result.stars}")

    print("\n--- RANDOM LEVEL GENERATOR ---\n")

    generator = RandomLevelGenerator()
    for diff in [Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD]:
        level = generator.generate(diff)
        print(f"{diff.value.upper()}: {level.grid_size[0]}x{level.grid_size[1]} grid, {len(level.obstacles)} obstacles")

    print("\n--- PROGRESS TRACKING ---\n")

    # Simulate completing some levels
    for i in [1, 2, 3]:
        result = system.validate_solution(["forward"] * 3, i)
        if result.success or i <= 2:  # Force success for demo
            result.success = True
            result.stars = 3
        completion = system.record_completion(i, result)
        if completion["recorded"]:
            print(f"Level {i}: {completion['stars']} stars")
            if completion["newly_unlocked"]:
                print(f"  Unlocked: Level {completion['newly_unlocked']}")

    summary = system.get_progress_summary()
    print(f"\nProgress: {summary['levels_completed']}/{summary['total_levels']} levels")
    print(f"Stars: {summary['total_stars']}/{summary['max_stars']}")
    print(f"Next level: {summary['next_level']}")

    print("\n" + "=" * 65)
    print("  LEVEL SYSTEM READY")
    print("=" * 65)
