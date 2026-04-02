import cv2
import numpy as np
import requests
import time

from blocks import COLOR_TO_COMMAND

SERVER_URL = "http://127.0.0.1:8000/api/update"

def send_to_server(commands):
    """Send detected commands to the server."""
    try:
        requests.post(SERVER_URL, json={"commands": commands}, timeout=1)
    except requests.exceptions.RequestException as e:
        print(f"Server connection failed: {e}")

# HSV color ranges for robust detection
# Note: Red is split into two ranges because it wraps around the HSV hue circle (0-180)
# These ranges can be fine-tuned based on your exact lighting and camera
HSV_BOUNDARIES = {
    'green':  (np.array([35, 100, 100]), np.array([85, 255, 255])),
    'blue':   (np.array([90, 100, 100]), np.array([130, 255, 255])),
    'yellow': (np.array([20, 100, 100]), np.array([35, 255, 255])),
    'red1':   (np.array([0, 100, 100]),  np.array([10, 255, 255])),
    'red2':   (np.array([160, 100, 100]), np.array([180, 255, 255])),
    'orange': (np.array([10, 100, 100]), np.array([20, 255, 255])),   # loop_start
    'purple': (np.array([130, 100, 100]), np.array([160, 255, 255]))  # loop_end
}

def detect_and_sort_blocks(frame, min_area=500):
    """
    Detects colored blocks in the given frame, sorts them left-to-right, 
    and returns the sequence of commands.
    """
    # Convert image from BGR to HSV color space for lighting stability
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    
    detected_blocks = [] # List to store (center_x, block_color, contour)
    
    # Check for each color
    for color_key, (lower, upper) in HSV_BOUNDARIES.items():
        base_color = 'red' if color_key.startswith('red') else color_key
        
        # Create a boolean pixel mask for the color
        mask = cv2.inRange(hsv, lower, upper)
        
        # Morphological operations to clean up noisy pixel detections
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel) # Removes isolated pixels
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel) # Fills in small holes
        
        # Find contours of the masked regions
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        for contour in contours:
            area = cv2.contourArea(contour)
            if area > min_area: # Ignore small noise
                # Compute the boundingbox and center
                x, y, w, h = cv2.boundingRect(contour)
                center_x = x + (w // 2)
                
                detected_blocks.append({
                    'x': center_x,
                    'color': base_color,
                    'bbox': (x, y, w, h),
                    'contour': contour
                })

    # Sort blocks from left-to-right based on their x coordinates
    detected_blocks.sort(key=lambda b: b['x'])
    
    # Map from colors to a list of commands
    commands = [COLOR_TO_COMMAND[b['color']] for b in detected_blocks]
    
    return commands, detected_blocks

def main():
    # Attempt to open standard webcam (index 0)
    # Change to a specific IP or index if using an external USB / Top-Down camera
    cap = cv2.VideoCapture(0)
    
    # For higher performance / visibility, optionally set camera resolution:
    # cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    # cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

    if not cap.isOpened():
        print("Error: Cannot access the camera feed.")
        return

    print("--- Vision Command System Started ---")
    print("Place colored blocks in front of the camera in a horizontal line.")
    print("Press 'q' to quit.")

    last_commands = []
    last_send_time = 0
    DEBOUNCE_DELAY = 0.3  # Only send updates every 300ms or when commands change

    while True:
        ret, frame = cap.read()
        if not ret:
            print("Error: Failed to grab frame.")
            break

        # Run our detection algorithm
        commands, blocks = detect_and_sort_blocks(frame, min_area=800)

        # Send to server if commands changed or debounce time passed
        current_time = time.time()
        if commands != last_commands or (current_time - last_send_time) > DEBOUNCE_DELAY:
            if commands != last_commands:
                print(f"Detected: {commands}")
            send_to_server(commands)
            last_commands = commands.copy()
            last_send_time = current_time

        # Visualization
        for block in blocks:
            x, y, w, h = block['bbox']
            
            # Select display color (OpenCV uses BGR)
            bgr_colors = {
                'green': (0, 255, 0),
                'blue': (255, 0, 0),
                'yellow': (0, 255, 255),
                'red': (0, 0, 255),
                'orange': (0, 165, 255),
                'purple': (128, 0, 128)
            }
            bgr_color = bgr_colors.get(block['color'], (255, 255, 255))

            # Draw rectangle around block
            cv2.rectangle(frame, (x, y), (x + w, y + h), bgr_color, 3)
            
            # Draw command text
            cmd_text = COLOR_TO_COMMAND[block['color']]
            cv2.putText(frame, cmd_text, (x, max(15, y - 10)), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, bgr_color, 2)

        # Show the command sequence on screen
        sequence_text = f"Sequence: {commands}"
        cv2.putText(frame, sequence_text, (20, 40), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
        
        cv2.imshow('Top-Down Block Detector', frame)
        
        # Debounced command print out - just for console demonstration
        # (In production, you'd only send commands when the user gives a "submit" signal)
        
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    # Cleanup
    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
