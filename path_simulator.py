import time

class PathSimulator:
    def __init__(self, grid_size=8, obstacles=None):
        """
        Initializes a 2D simulation grid for the robot.
        grid_size: width and height of the grid.
        obstacles: list of (x, y) tuples representing unsafe zones.
        """
        self.size = grid_size
        self.obstacles = obstacles if obstacles else [(3, 1), (2, 2), (5, 4), (4, 4), (5, 5)]
        
        # Mapping 0: North, 1: East, 2: South, 3: West
        # Cartesian grid with (0,0) at top-left
        self.dir_vectors = {
            0: (0, -1),
            1: (1, 0),
            2: (0, 1),
            3: (-1, 0)
        }

    def unroll_commands(self, commands):
        """Converts nested logical commands (like loop) into physical straight steps."""
        unrolled = []
        for cmd in commands:
            if cmd == 'loop':
                if unrolled:
                    last_cmd = unrolled[-1]
                    unrolled.append(last_cmd)
                    unrolled.append(last_cmd) # Replicate the loop behavior
            else:
                unrolled.append(cmd)
        return unrolled

    def optimize_commands(self, commands):
        """Optimizes away redundant spins and cancelling moves."""
        raw_sequence = self.unroll_commands(commands)
        optimized = []
        
        for cmd in raw_sequence:
            # Cancel immediate opposites (Right then Left)
            if optimized and cmd in ['turn_right', 'turn_left']:
                prev = optimized[-1]
                if (prev == 'turn_left' and cmd == 'turn_right') or (prev == 'turn_right' and cmd == 'turn_left'):
                    optimized.pop() # Cancel them out!
                    continue
            
            optimized.append(cmd)
            
            # Check for Spinning (4 rights = 0 rights, 4 lefts = 0 lefts)
            if len(optimized) >= 4:
                if optimized[-4:] == ['turn_right', 'turn_right', 'turn_right', 'turn_right'] or \
                   optimized[-4:] == ['turn_left', 'turn_left', 'turn_left', 'turn_left']:
                    del optimized[-4:]
                    continue
            
            # Check for inefficiencies (3 rights = 1 left, 3 lefts = 1 right)
            if len(optimized) >= 3:
                if optimized[-3:] == ['turn_right', 'turn_right', 'turn_right']:
                    del optimized[-3:]
                    optimized.append('turn_left')
                elif optimized[-3:] == ['turn_left', 'turn_left', 'turn_left']:
                    del optimized[-3:]
                    optimized.append('turn_right')
                    
        return optimized

    def simulate(self, commands, start_pos=(0, 4), start_dir=1):
        """
        Runs the exact command sequence in the 2D arena to test for completion or collisions.
        start_dir=1 means facing East.
        """
        unrolled = self.unroll_commands(commands)
        
        x, y = start_pos
        direction = start_dir
        path = [(x, y)]
        
        collision_event = None
        
        for cmd in unrolled:
            if cmd == 'turn_right':
                direction = (direction + 1) % 4
            elif cmd == 'turn_left':
                direction = (direction - 1) % 4
            elif cmd == 'forward':
                dx, dy = self.dir_vectors[direction]
                nx, ny = x + dx, y + dy
                
                # Bounds check
                if nx < 0 or nx >= self.size or ny < 0 or ny >= self.size:
                    collision_event = (nx, ny, "Out of Bounds")
                    break
                    
                # Obstacle check
                if (nx, ny) in self.obstacles:
                    collision_event = (nx, ny, "Obstacle Collision")
                    break
                    
                x, y = nx, ny
                path.append((x, y))

        
        # Visual ASCII Rendering
        self._render_grid(path, collision_event, start_pos)
        
        optimized_route = self.optimize_commands(commands)
        
        print("\n=== Diagnosis Report ===")
        if collision_event:
            print(f"⚠️ CRISIS: Robot encountered '{collision_event[2]}' trying to reach ({collision_event[0]}, {collision_event[1]})!")
        else:
            print(f"✅ Path Safe: Robot reached ({x}, {y}) without hitting anything.")
            
        print(f"-> Submitted Sequence: {commands}")
        print(f"-> Optimized Engine Route: {optimized_route}")
        
        if len(optimized_route) < len(unrolled):
            print("💡 Observation: I removed unnecessary spinning to reach the target faster!")
            
        return optimized_route

    def _render_grid(self, path, collision, start_pos):
        print("\n" + "="*24)
        print("  2D SIMULATION MAT")
        print("="*24)
        grid = [['.' for _ in range(self.size)] for _ in range(self.size)]
        
        # Draw Obstacles
        for ox, oy in self.obstacles:
            if 0 <= ox < self.size and 0 <= oy < self.size:
                grid[oy][ox] = '#' 
                
        # Draw Path
        for px, py in path:
            grid[py][px] = '*' 
            
        # Draw Start
        grid[start_pos[1]][start_pos[0]] = 'S'
        
        # Draw Collision/End
        if collision:
            cx, cy = collision[0], collision[1]
            if 0 <= cx < self.size and 0 <= cy < self.size:
                grid[cy][cx] = 'X'
        else:
            ex, ey = path[-1]
            if not (ex == start_pos[0] and ey == start_pos[1]):
                grid[ey][ex] = 'E'
            
        # Print Grid
        for y in range(self.size):
            row_str = " ".join(grid[y])
            print(f"{y} | {row_str}")
            
        print("\nLegend: S=Start, E=End, *=Path, #=Obstacle, X=Crash")


if __name__ == "__main__":
    sim = PathSimulator()
    
    print("\n[ SCENARIO 1: Redundant spins & safe finish ]")
    # Goes forward, turns right, realizes it was wrong, turns left, goes forward.
    sim.simulate(['forward', 'turn_right', 'turn_left', 'forward', 'forward'])
    
    time.sleep(1)
    
    print("\n[ SCENARIO 2: A terrible collision into an obstacle ]")
    # Will hit the obstacle at (3, 1) or out of bounds. Start is (0,4) facing East
    sim.simulate(['forward', 'forward', 'turn_left', 'forward', 'loop'])
    
    time.sleep(1)
    
    print("\n[ SCENARIO 3: Three turns right is just one turn left! ]")
    sim.simulate(['forward', 'turn_right', 'turn_right', 'turn_right', 'forward'])
