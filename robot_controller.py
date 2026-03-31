import serial
import time

class RobotController:
    """
    Handles serial communication with the robot car.
    Designed to be easily extendable for new hardware commands.
    """
    def __init__(self, port='COM3', baudrate=9600, timeout=1):
        try:
            # Initialize serial connection
            # Depending on the OS, port might be '/dev/ttyUSB0' or 'COM3'
            self.ser = serial.Serial(port, baudrate, timeout=timeout)
            
            # Allow time for the Arduino/microcontroller to reset after connection
            time.sleep(2) 
            print(f"Connected to robot on {port}")
        except serial.SerialException as e:
            print(f"Warning: Could not open serial port {port}. Running in simulation mode.")
            self.ser = None

    def send_action(self, action):
        """
        Maps logical actions to physical serial bytes/strings.
        Extend this dictionary to add more capabilities (e.g., 'backward': 'B\n').
        """
        command_map = {
            'forward': 'F\n',
            'turn_left': 'L\n',
            'turn_right': 'R\n'
        }
        
        if action in command_map:
            serial_data = command_map[action]
            
            if self.ser and self.ser.is_open:
                # Send the encoded string over serial
                self.ser.write(serial_data.encode('utf-8'))
                print(f"--> Sent to hardware: {action}")
            else:
                # Simulation mode if no robot is plugged in
                print(f"--> [Sim] Sent: {action}")
        else:
            print(f"Unknown action ignored: {action}")

    def close(self):
        """Cleanly close the connection."""
        if self.ser and self.ser.is_open:
            self.ser.close()
            print("Disconnected from robot.")


def execute_robot_sequence(command_list, port='COM3', delay_seconds=1.5):
    """
    Takes a list of commands, processes them sequentially, handles special 
    logic like 'loop', and includes delays between hardware actions.
    """
    print(f"\nEvaluating command sequence: {command_list}")
    
    controller = RobotController(port=port)
    last_command = None
    
    for cmd in command_list:
        cmd = cmd.lower().strip()
        
        if cmd == 'loop':
            # "loop" means repeat the last command 2 times
            if last_command:
                print("LOOP detected: repeating the last action 2 times.")
                for _ in range(2):
                    controller.send_action(last_command)
                    time.sleep(delay_seconds)
            else:
                print("Ignored 'loop': No previous command exists to repeat.")
        else:
            # Normal command execution
            controller.send_action(cmd)
            last_command = cmd
            time.sleep(delay_seconds)
            
    controller.close()


if __name__ == "__main__":
    # Example usage based on your sequence
    test_sequence = ["forward", "forward", "turn_right", "loop"]
    execute_robot_sequence(test_sequence, port='COM3')
