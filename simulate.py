import time
import requests

URL = "http://127.0.0.1:8000/api/update"

def send_update(commands=None, status=None, feedback=None, robot_pos=None, path=None):
    payload = {}
    if commands is not None: payload['commands'] = commands
    if status is not None: payload['status'] = status
    if feedback is not None: payload['feedback'] = feedback
    if robot_pos is not None: payload['robot_pos'] = robot_pos
    if path is not None: payload['path'] = path
    try:
        requests.post(URL, json=payload)
    except Exception as e:
        print(f"Failed to connect to server: {e}")

if __name__ == "__main__":
    print("Starting Live Execution Grid Simulation...")
    while True:
        # Reset State
        send_update(
            commands=[], 
            status="idle", 
            feedback="Mission Ready! Place your blocks.",
            robot_pos={"x": 1, "y": 4},
            path=[]
        )
        time.sleep(3)
        
        # Scan blocks
        commands = ['forward', 'turn_right', 'turn_left', 'forward', 'forward']
        send_update(commands=commands, status="executing", feedback="Executing...")
        time.sleep(1)
        
        # Robot starts moving
        path = [{"x": 1, "y": 4}]
        
        # Step 1: Forward
        current_pos = {"x": 2, "y": 4}
        path.append(current_pos.copy())
        send_update(robot_pos=current_pos, path=path)
        time.sleep(1)
        
        # Step 2: Turn Right
        send_update(feedback="Turning Right...")
        time.sleep(1)
        
        # Oops, kid made a mistake: goes into the obstacle at (3,4)
        current_pos = {"x": 3, "y": 4}
        path.append(current_pos.copy())
        send_update(robot_pos=current_pos, path=path, status="error", feedback="Crash! We hit a rock! Try adjusting your path. 💥")
        
        time.sleep(4)
        
        # Reset and do successful run
        send_update(
            commands=['forward', 'turn_left', 'forward', 'turn_right', 'forward', 'forward'], 
            status="executing", 
            feedback="Trying again! 🚀",
            robot_pos={"x": 1, "y": 4},
            path=[]
        )
        time.sleep(1.5)
        
        # Good run simulation
        good_path_coords = [
            {"x": 2, "y": 4}, # Fwd
            {"x": 2, "y": 3}, # Turn Left, Fwd
            {"x": 3, "y": 3}, # Turn Right, Fwd
            {"x": 4, "y": 3}, # Fwd
            {"x": 5, "y": 3}, # Fwd (past obstacles)
            {"x": 6, "y": 3}, # Fwd
            {"x": 6, "y": 4}  # Turn Right, Fwd (Goal!)
        ]
        
        valid_path = [{"x": 1, "y": 4}]
        for pos in good_path_coords:
            valid_path.append(pos)
            send_update(robot_pos=pos, path=valid_path.copy())
            time.sleep(0.8)
            
        send_update(status="success", feedback="Amazing! You beat the level! 🏆")
        time.sleep(5)
