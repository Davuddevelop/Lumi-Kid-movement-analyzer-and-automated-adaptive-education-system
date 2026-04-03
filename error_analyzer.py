"""
Lumi Error Analyzer
Analyzes robot command sequences and classifies errors.

Error Types:
- distance_error: Not enough or too many forward steps
- direction_error: Wrong turns leading to incorrect facing
- logic_error: Inefficient or redundant patterns
"""
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass


@dataclass
class AnalysisResult:
    """Result of command sequence analysis."""
    error_type: Optional[str]  # "distance_error", "direction_error", "logic_error", None
    explanation: str
    suggestion: str
    details: Dict


# Direction constants: 0=North, 1=East, 2=South, 3=West
DIR_NAMES = {0: "North", 1: "East", 2: "South", 3: "West"}
DIR_VECTORS = {0: (0, -1), 1: (1, 0), 2: (0, 1), 3: (-1, 0)}


class ErrorAnalyzer:
    """Analyzes command sequences for errors and inefficiencies."""

    def __init__(self):
        # Logic error patterns (redundant/inefficient)
        self.logic_patterns = [
            # (pattern, error_name, explanation, suggestion)
            (["turn_right", "turn_right", "turn_right", "turn_right"],
             "full_rotation", "4 right turns = back to start", "Remove all 4 turns or use 0 turns"),
            (["turn_left", "turn_left", "turn_left", "turn_left"],
             "full_rotation", "4 left turns = back to start", "Remove all 4 turns or use 0 turns"),
            (["turn_right", "turn_left"],
             "cancel_turns", "Right then left cancels out", "Remove both turns"),
            (["turn_left", "turn_right"],
             "cancel_turns", "Left then right cancels out", "Remove both turns"),
            (["turn_right", "turn_right", "turn_right"],
             "inefficient_turn", "3 right turns = 1 left turn", "Replace with 1 left turn"),
            (["turn_left", "turn_left", "turn_left"],
             "inefficient_turn", "3 left turns = 1 right turn", "Replace with 1 right turn"),
            (["loop", "loop"],
             "redundant_loop", "Two loops in a row is redundant", "Combine into single loop or restructure"),
        ]

    def analyze(self, commands: List[str],
                start_pos: Tuple[int, int] = (0, 0),
                start_dir: int = 1,  # East
                goal_pos: Optional[Tuple[int, int]] = None,
                grid_size: Tuple[int, int] = (8, 8),
                obstacles: Optional[List[Tuple[int, int]]] = None) -> AnalysisResult:
        """
        Analyze a command sequence for errors.

        Args:
            commands: List of commands (forward, turn_right, turn_left, loop)
            start_pos: Starting (x, y) position
            start_dir: Starting direction (0=N, 1=E, 2=S, 3=W)
            goal_pos: Target (x, y) position (optional)
            grid_size: (width, height) of grid
            obstacles: List of (x, y) obstacle positions

        Returns:
            AnalysisResult with error_type, explanation, suggestion, details
        """
        if not commands:
            return AnalysisResult(
                error_type=None,
                explanation="No commands provided",
                suggestion="Add some commands to move the robot",
                details={"command_count": 0}
            )

        # Check for logic errors first (pattern-based)
        logic_result = self._check_logic_errors(commands)
        if logic_result:
            return logic_result

        # Simulate execution
        sim_result = self._simulate(commands, start_pos, start_dir, grid_size, obstacles or [])

        # Check for collision/boundary errors
        if sim_result["error"]:
            return self._classify_simulation_error(sim_result, commands)

        # Check distance/direction errors relative to goal
        if goal_pos:
            return self._check_goal_errors(sim_result, goal_pos, commands)

        # No errors detected
        return AnalysisResult(
            error_type=None,
            explanation="Command sequence looks valid",
            suggestion="Try running the program",
            details={
                "final_pos": sim_result["final_pos"],
                "final_dir": DIR_NAMES[sim_result["final_dir"]],
                "steps_taken": sim_result["steps_taken"]
            }
        )

    def _check_logic_errors(self, commands: List[str]) -> Optional[AnalysisResult]:
        """Check for inefficient or redundant patterns."""
        # Expand loops for pattern matching
        expanded = self._expand_loops(commands)

        for pattern, error_name, explanation, suggestion in self.logic_patterns:
            indices = self._find_pattern(expanded, pattern)
            if indices:
                return AnalysisResult(
                    error_type="logic_error",
                    explanation=explanation,
                    suggestion=suggestion,
                    details={
                        "pattern": error_name,
                        "found_at": indices[0],
                        "pattern_length": len(pattern)
                    }
                )

        # Check for no movement (only turns)
        forward_count = sum(1 for c in expanded if c == "forward")
        turn_count = sum(1 for c in expanded if c in ("turn_right", "turn_left"))

        if forward_count == 0 and turn_count > 0:
            return AnalysisResult(
                error_type="logic_error",
                explanation="Only turns, no forward movement",
                suggestion="Add forward commands to move the robot",
                details={"turn_count": turn_count, "forward_count": 0}
            )

        # Check for excessive turns compared to forwards
        if turn_count > forward_count * 2 and forward_count > 0:
            return AnalysisResult(
                error_type="logic_error",
                explanation="Too many turns relative to forward moves",
                suggestion="Simplify the path with fewer direction changes",
                details={"turn_count": turn_count, "forward_count": forward_count}
            )

        return None

    def _simulate(self, commands: List[str],
                  start_pos: Tuple[int, int],
                  start_dir: int,
                  grid_size: Tuple[int, int],
                  obstacles: List[Tuple[int, int]]) -> Dict:
        """Simulate command execution and return result."""
        x, y = start_pos
        direction = start_dir
        path = [(x, y)]
        steps_taken = 0
        expanded = self._expand_loops(commands)
        obstacles_set = set(obstacles)

        for i, cmd in enumerate(expanded):
            if cmd == "turn_right":
                direction = (direction + 1) % 4
            elif cmd == "turn_left":
                direction = (direction - 1) % 4
            elif cmd == "forward":
                dx, dy = DIR_VECTORS[direction]
                nx, ny = x + dx, y + dy

                # Boundary check
                if nx < 0 or nx >= grid_size[0] or ny < 0 or ny >= grid_size[1]:
                    return {
                        "error": "boundary",
                        "error_pos": (nx, ny),
                        "error_cmd_index": i,
                        "final_pos": (x, y),
                        "final_dir": direction,
                        "direction_name": DIR_NAMES[direction],
                        "steps_taken": steps_taken,
                        "path": path
                    }

                # Obstacle check
                if (nx, ny) in obstacles_set:
                    return {
                        "error": "obstacle",
                        "error_pos": (nx, ny),
                        "error_cmd_index": i,
                        "final_pos": (x, y),
                        "final_dir": direction,
                        "direction_name": DIR_NAMES[direction],
                        "steps_taken": steps_taken,
                        "path": path
                    }

                x, y = nx, ny
                path.append((x, y))
                steps_taken += 1

        return {
            "error": None,
            "final_pos": (x, y),
            "final_dir": direction,
            "direction_name": DIR_NAMES[direction],
            "steps_taken": steps_taken,
            "path": path
        }

    def _classify_simulation_error(self, sim_result: Dict, commands: List[str]) -> AnalysisResult:
        """Classify errors from simulation (boundary/obstacle)."""
        error_type = sim_result["error"]
        direction = sim_result["direction_name"]

        if error_type == "boundary":
            return AnalysisResult(
                error_type="direction_error",
                explanation=f"Robot went off the edge facing {direction}",
                suggestion=f"Add a turn before the forward command at step {sim_result['error_cmd_index'] + 1}",
                details={
                    "collision_type": "boundary",
                    "last_valid_pos": sim_result["final_pos"],
                    "facing": direction,
                    "steps_before_error": sim_result["steps_taken"]
                }
            )
        elif error_type == "obstacle":
            return AnalysisResult(
                error_type="direction_error",
                explanation=f"Robot crashed into obstacle at {sim_result['error_pos']}",
                suggestion="Turn to avoid the obstacle before moving forward",
                details={
                    "collision_type": "obstacle",
                    "obstacle_pos": sim_result["error_pos"],
                    "last_valid_pos": sim_result["final_pos"],
                    "facing": direction
                }
            )

        return AnalysisResult(
            error_type="direction_error",
            explanation="Unknown simulation error",
            suggestion="Check your command sequence",
            details=sim_result
        )

    def _check_goal_errors(self, sim_result: Dict, goal_pos: Tuple[int, int],
                           commands: List[str]) -> AnalysisResult:
        """Check if robot reached the goal, classify distance/direction errors."""
        final_x, final_y = sim_result["final_pos"]
        goal_x, goal_y = goal_pos

        dx = goal_x - final_x
        dy = goal_y - final_y

        # Reached goal
        if dx == 0 and dy == 0:
            return AnalysisResult(
                error_type=None,
                explanation="Robot reached the goal",
                suggestion="Great job! Try the next challenge",
                details={
                    "final_pos": sim_result["final_pos"],
                    "steps_taken": sim_result["steps_taken"],
                    "success": True
                }
            )

        # Calculate Manhattan distance
        distance = abs(dx) + abs(dy)

        # Determine if it's primarily a distance or direction issue
        forward_count = sum(1 for c in self._expand_loops(commands) if c == "forward")

        # Check if facing wrong direction at the end
        final_dir = sim_result["final_dir"]
        needed_dirs = []
        if dx > 0:
            needed_dirs.append(1)  # East
        elif dx < 0:
            needed_dirs.append(3)  # West
        if dy > 0:
            needed_dirs.append(2)  # South
        elif dy < 0:
            needed_dirs.append(0)  # North

        # Classify error
        if distance <= 2 and final_dir not in needed_dirs:
            # Close but facing wrong way
            return AnalysisResult(
                error_type="direction_error",
                explanation=f"Robot is close but facing {DIR_NAMES[final_dir]} instead of toward goal",
                suggestion=f"Turn to face {'East' if dx > 0 else 'West' if dx < 0 else 'South' if dy > 0 else 'North'} and add {distance} forward",
                details={
                    "final_pos": sim_result["final_pos"],
                    "goal_pos": goal_pos,
                    "distance_to_goal": distance,
                    "facing": DIR_NAMES[final_dir]
                }
            )
        elif dx != 0 and dy != 0:
            # Off on both axes - likely direction error
            return AnalysisResult(
                error_type="direction_error",
                explanation=f"Robot missed goal by {abs(dx)} {'right' if dx > 0 else 'left'} and {abs(dy)} {'down' if dy > 0 else 'up'}",
                suggestion="Adjust your turns to navigate toward the goal",
                details={
                    "final_pos": sim_result["final_pos"],
                    "goal_pos": goal_pos,
                    "offset_x": dx,
                    "offset_y": dy
                }
            )
        else:
            # Off on one axis - distance error
            if dx != 0:
                direction_word = "right" if dx > 0 else "left"
                return AnalysisResult(
                    error_type="distance_error",
                    explanation=f"Robot is {abs(dx)} steps too far {direction_word}",
                    suggestion=f"{'Add' if dx > 0 else 'Remove'} {abs(dx)} forward command(s) when facing East/West",
                    details={
                        "final_pos": sim_result["final_pos"],
                        "goal_pos": goal_pos,
                        "steps_off": abs(dx),
                        "direction": "horizontal"
                    }
                )
            else:
                direction_word = "down" if dy > 0 else "up"
                return AnalysisResult(
                    error_type="distance_error",
                    explanation=f"Robot is {abs(dy)} steps too far {direction_word}",
                    suggestion=f"{'Add' if dy > 0 else 'Remove'} {abs(dy)} forward command(s) when facing North/South",
                    details={
                        "final_pos": sim_result["final_pos"],
                        "goal_pos": goal_pos,
                        "steps_off": abs(dy),
                        "direction": "vertical"
                    }
                )

    def _expand_loops(self, commands: List[str]) -> List[str]:
        """Expand loop commands into repeated commands."""
        expanded = []
        for cmd in commands:
            if cmd == "loop" and expanded:
                # Repeat last command 2 more times
                expanded.extend([expanded[-1]] * 2)
            else:
                expanded.append(cmd)
        return expanded

    def _find_pattern(self, commands: List[str], pattern: List[str]) -> List[int]:
        """Find all occurrences of pattern in commands. Return start indices."""
        indices = []
        pattern_len = len(pattern)
        for i in range(len(commands) - pattern_len + 1):
            if commands[i:i + pattern_len] == pattern:
                indices.append(i)
        return indices

    def get_error_summary(self, commands: List[str], **kwargs) -> str:
        """Get a one-line summary of command analysis."""
        result = self.analyze(commands, **kwargs)
        if result.error_type:
            return f"[{result.error_type.upper()}] {result.explanation}"
        return f"[OK] {result.explanation}"


# ============================================
# TEST
# ============================================
if __name__ == "__main__":
    import time

    analyzer = ErrorAnalyzer()

    print("=" * 60)
    print("  ERROR ANALYZER TEST")
    print("=" * 60)

    test_cases = [
        # (name, commands, kwargs)
        ("Empty commands", [], {}),
        ("Logic: 4 right turns", ["turn_right", "turn_right", "turn_right", "turn_right"], {}),
        ("Logic: Cancel turns", ["forward", "turn_right", "turn_left", "forward"], {}),
        ("Logic: 3 rights = 1 left", ["turn_right", "turn_right", "turn_right", "forward"], {}),
        ("Logic: Only turns", ["turn_left", "turn_right", "turn_left"], {}),
        ("Boundary: Off edge", ["forward", "forward", "forward", "forward", "forward"],
         {"start_pos": (1, 0), "start_dir": 0, "grid_size": (8, 8)}),  # Facing North at y=0
        ("Obstacle crash", ["forward", "forward", "forward"],
         {"start_pos": (0, 0), "start_dir": 1, "obstacles": [(2, 0)]}),
        ("Distance: Too few forwards", ["forward", "forward"],
         {"start_pos": (0, 0), "start_dir": 1, "goal_pos": (5, 0)}),
        ("Distance: Too many forwards", ["forward", "forward", "forward", "forward", "forward"],
         {"start_pos": (0, 0), "start_dir": 1, "goal_pos": (3, 0)}),
        ("Direction: Wrong final facing", ["forward", "forward", "turn_left"],
         {"start_pos": (0, 0), "start_dir": 1, "goal_pos": (4, 0)}),
        ("Success: Reaches goal", ["forward", "forward", "forward"],
         {"start_pos": (0, 0), "start_dir": 1, "goal_pos": (3, 0)}),
        ("Loop expansion", ["forward", "loop", "turn_right"], {}),
    ]

    total_time = 0

    for name, commands, kwargs in test_cases:
        start = time.perf_counter()
        result = analyzer.analyze(commands, **kwargs)
        elapsed = (time.perf_counter() - start) * 1000
        total_time += elapsed

        print(f"\n--- {name} ---")
        print(f"Commands: {commands}")
        print(f"Error Type: {result.error_type or 'None'}")
        print(f"Explanation: {result.explanation}")
        print(f"Suggestion: {result.suggestion}")
        print(f"Time: {elapsed:.3f}ms")

    print(f"\n{'=' * 60}")
    print(f"Total time for {len(test_cases)} tests: {total_time:.3f}ms")
    print(f"Average per test: {total_time / len(test_cases):.3f}ms")
    print("=" * 60)
