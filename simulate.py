"""
Auto Demo - Continuously cycles through test scenarios.
Uses the new integrated server that handles execution internally.
"""
import time
import requests

UPDATE_URL = "http://127.0.0.1:8000/api/update"
EXECUTE_URL = "http://127.0.0.1:8000/api/execute"
RESET_URL = "http://127.0.0.1:8000/api/reset"

def send_commands(commands):
    """Send detected commands to server."""
    try:
        requests.post(UPDATE_URL, json={"commands": commands}, timeout=1)
    except Exception as e:
        print(f"Failed to connect: {e}")

def execute():
    """Trigger program execution."""
    try:
        requests.post(EXECUTE_URL, timeout=1)
    except Exception as e:
        print(f"Execute failed: {e}")

def reset():
    """Reset state."""
    try:
        requests.post(RESET_URL, timeout=1)
    except Exception as e:
        print(f"Reset failed: {e}")

# Demo scenarios
DEMOS = [
    {
        "name": "Crash Demo",
        "commands": ["forward", "forward", "forward"],
        "description": "Robot crashes into obstacle at (3,4)"
    },
    {
        "name": "Success Demo",
        "commands": ["forward", "turn_left", "forward", "forward", "turn_right", "forward", "forward", "forward", "turn_right", "forward"],
        "description": "Robot avoids obstacles and reaches goal"
    },
    {
        "name": "Loop Demo",
        "commands": ["forward", "turn_left", "forward", "loop", "turn_right", "forward", "loop"],
        "description": "Uses loop blocks to repeat commands"
    },
    {
        "name": "Edge Demo",
        "commands": ["turn_left", "forward", "forward", "forward", "forward", "forward"],
        "description": "Robot goes off the edge"
    },
    {
        "name": "Spin Demo",
        "commands": ["turn_right", "turn_left", "turn_right", "turn_right", "turn_right", "forward"],
        "description": "Inefficient spinning triggers suggestions"
    }
]

if __name__ == "__main__":
    print("="*50)
    print("  LUMI AUTO DEMO")
    print("="*50)
    print("\nThis demo cycles through test scenarios.")
    print("Make sure server.py is running!")
    print("Open http://localhost:5173 to watch.\n")
    print("Press Ctrl+C to stop.\n")

    try:
        demo_index = 0
        while True:
            demo = DEMOS[demo_index % len(DEMOS)]

            print(f"\n>> [{demo_index + 1}] {demo['name']}")
            print(f"   {demo['description']}")
            print(f"   Commands: {demo['commands']}")

            # Reset
            reset()
            time.sleep(1.5)

            # Simulate gradual block placement
            commands = demo['commands']
            for i in range(len(commands)):
                send_commands(commands[:i+1])
                time.sleep(0.3)

            print("   Blocks placed. Executing...")
            time.sleep(1)

            # Execute
            execute()

            # Wait for execution to complete
            time.sleep(len(commands) * 0.8 + 3)

            demo_index += 1

    except KeyboardInterrupt:
        print("\n\nDemo stopped. Goodbye!")
