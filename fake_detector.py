"""
Fake Camera Detector - Simulates block detection for testing without hardware.
Run this instead of color_detector.py to test the full pipeline.
"""
import requests
import time
import random

SERVER_URL = "http://127.0.0.1:8000/api/update"
EXECUTE_URL = "http://127.0.0.1:8000/api/execute"
RESET_URL = "http://127.0.0.1:8000/api/reset"

def send_commands(commands):
    """Send commands to server."""
    try:
        requests.post(SERVER_URL, json={"commands": commands}, timeout=1)
        print(f"Sent: {commands}")
    except requests.exceptions.RequestException as e:
        print(f"Server error: {e}")

def execute():
    """Trigger execution."""
    try:
        requests.post(EXECUTE_URL, timeout=1)
        print("Execution triggered!")
    except requests.exceptions.RequestException as e:
        print(f"Execute error: {e}")

def reset():
    """Reset state."""
    try:
        requests.post(RESET_URL, timeout=1)
        print("Reset!")
    except requests.exceptions.RequestException as e:
        print(f"Reset error: {e}")

# Predefined test scenarios
SCENARIOS = {
    "1": {
        "name": "Success Path (avoids obstacles)",
        "commands": ["forward", "turn_left", "forward", "forward", "turn_right", "forward", "forward", "forward", "turn_right", "forward"]
    },
    "2": {
        "name": "Crash into obstacle",
        "commands": ["forward", "forward", "forward"]
    },
    "3": {
        "name": "Uses loop block",
        "commands": ["forward", "turn_left", "forward", "loop", "turn_right", "forward", "forward"]
    },
    "4": {
        "name": "Spinning (inefficient turns)",
        "commands": ["turn_right", "turn_left", "forward", "turn_right", "turn_right", "turn_right"]
    },
    "5": {
        "name": "Off the edge",
        "commands": ["turn_left", "forward", "forward", "forward", "forward", "forward"]
    },
    "6": {
        "name": "Advanced loop blocks",
        "commands": ["forward", "loop_start", "turn_left", "forward", "loop_end", "forward"]
    },
    "7": {
        "name": "Empty (no blocks)",
        "commands": []
    },
    "8": {
        "name": "Only turns (forgot forward)",
        "commands": ["turn_right", "turn_left", "turn_right"]
    }
}

def interactive_mode():
    """Interactive testing mode."""
    print("\n" + "="*50)
    print("  LUMI FAKE DETECTOR - Interactive Mode")
    print("="*50)
    print("\nThis simulates camera detection for testing.\n")

    while True:
        print("\nScenarios:")
        for key, scenario in SCENARIOS.items():
            print(f"  [{key}] {scenario['name']}")
        print(f"  [c] Custom commands")
        print(f"  [r] Reset state")
        print(f"  [q] Quit")

        choice = input("\nSelect scenario: ").strip().lower()

        if choice == 'q':
            print("Goodbye!")
            break
        elif choice == 'r':
            reset()
        elif choice == 'c':
            custom = input("Enter commands (comma-separated): ").strip()
            commands = [c.strip() for c in custom.split(",") if c.strip()]
            send_commands(commands)
            run = input("Execute? (y/n): ").strip().lower()
            if run == 'y':
                execute()
        elif choice in SCENARIOS:
            scenario = SCENARIOS[choice]
            print(f"\n>> {scenario['name']}")
            send_commands(scenario['commands'])
            time.sleep(0.5)
            run = input("Execute? (y/n): ").strip().lower()
            if run == 'y':
                execute()
        else:
            print("Invalid choice!")

def auto_demo_mode():
    """Automatic demo cycling through scenarios."""
    print("\n" + "="*50)
    print("  LUMI FAKE DETECTOR - Auto Demo Mode")
    print("="*50)
    print("\nCycling through test scenarios automatically...\n")
    print("Press Ctrl+C to stop.\n")

    try:
        while True:
            for key, scenario in SCENARIOS.items():
                if key == "7":  # Skip empty scenario in auto mode
                    continue

                print(f"\n>> Scenario {key}: {scenario['name']}")
                reset()
                time.sleep(1)

                # Simulate gradual block placement
                commands = scenario['commands']
                for i in range(len(commands)):
                    send_commands(commands[:i+1])
                    time.sleep(0.4)

                time.sleep(1)
                print("   Executing...")
                execute()
                time.sleep(5)  # Wait for execution to complete

    except KeyboardInterrupt:
        print("\n\nDemo stopped.")

if __name__ == "__main__":
    print("\nModes:")
    print("  [1] Interactive - Choose scenarios manually")
    print("  [2] Auto Demo - Cycle through all scenarios")

    mode = input("\nSelect mode (1/2): ").strip()

    if mode == "2":
        auto_demo_mode()
    else:
        interactive_mode()
