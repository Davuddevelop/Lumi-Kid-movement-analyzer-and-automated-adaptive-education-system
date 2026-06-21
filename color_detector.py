import cv2
import numpy as np
import requests
import time
import os

from blocks import COLOR_TO_COMMAND

# Where to send detected blocks.
#   Local server:  http://127.0.0.1:8000      (default)
#   Cloud (Render): https://lumi-server.onrender.com
# Override with:  set LUMI_SERVER=https://lumi-server.onrender.com   (Windows)
#                 export LUMI_SERVER=https://lumi-server.onrender.com (Mac/Linux)
SERVER_BASE = os.environ.get("LUMI_SERVER", "http://127.0.0.1:8000").rstrip("/")
SERVER_URL = f"{SERVER_BASE}/api/update"

def send_to_server(commands):
    """Send detected commands to the server."""
    try:
        requests.post(SERVER_URL, json={"commands": commands}, timeout=1)
    except requests.exceptions.RequestException as e:
        print(f"Server connection failed: {e}")

# HSV color ranges — two block types only:
#
#   BLACK block → forward command
#     Black has no hue. We detect it by low Value (darkness) + low Saturation.
#     TIP: place blocks on WHITE paper for maximum contrast.
#
#   RED block → backward command
#     Red wraps around the HSV hue wheel so two ranges are needed.
#
# Adjust BLACK_MAX_V if your lighting is dim (raise it) or very bright (lower it).
BLACK_MAX_V  = 55   # pixels darker than this are "black" (real black LEGO: V ≈ 10-40)
BLACK_MAX_S  = 80   # keep low to exclude coloured-but-dark regions (shadows)

# Minimum block size — filters out stud shadows, small components, and noise.
# A real LEGO block viewed from ~25-40 cm on an iPad fills at least this many pixels.
# Stud shadows and small objects are typically under 30×20 px.
MIN_BLOCK_W  = 40   # minimum bounding-box width  (pixels)
MIN_BLOCK_H  = 25   # minimum bounding-box height (pixels)
MIN_BLOCK_AREA = 1500  # minimum contour area (pixels²) — overrides the min_area arg

HSV_BOUNDARIES = {
    # Black: any hue, low saturation, very low value (darkness)
    'black': (np.array([0,   0,   0]),   np.array([180, BLACK_MAX_S, BLACK_MAX_V])),
    # Red lower range (hue 0-10)
    'red1':  (np.array([0,   120, 70]),  np.array([10,  255, 255])),
    # Red upper range (hue 165-180, wraps around)
    'red2':  (np.array([165, 120, 70]),  np.array([180, 255, 255])),
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
        # red1/red2 both map to 'red'; everything else uses its own name
        base_color = 'red' if color_key.startswith('red') else color_key

        # Skip colors we don't have a command for
        if base_color not in COLOR_TO_COMMAND:
            continue

        # Create a boolean pixel mask for the color
        mask = cv2.inRange(hsv, lower, upper)
        
        # Morphological operations to clean up noisy pixel detections.
        # CLOSE with a large kernel first: fills the gaps between LEGO studs so
        # the whole top surface of a block becomes one solid region.
        # OPEN then removes any remaining isolated noise smaller than the kernel.
        close_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 15))
        open_kernel  = cv2.getStructuringElement(cv2.MORPH_RECT, (7, 7))
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, close_kernel)
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN,  open_kernel)
        
        # Find contours of the masked regions
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        for contour in contours:
            area = cv2.contourArea(contour)
            x, y, w, h = cv2.boundingRect(contour)
            # Filter: must pass area AND minimum dimensions to count as a real block
            if area < max(min_area, MIN_BLOCK_AREA):
                continue
            if w < MIN_BLOCK_W or h < MIN_BLOCK_H:
                continue
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

def open_camera():
    """
    Open either a USB webcam (numeric index) or a WiFi/IP camera (stream URL).

    Set the source with the LUMI_CAMERA env variable:
      USB webcam:   LUMI_CAMERA=0      (or 1, 2)
      WiFi camera:  LUMI_CAMERA=rtsp://user:pass@192.168.1.50:554/stream
                    LUMI_CAMERA=http://192.168.1.50:8080/video
    Default: try USB indices 0, 1, 2.
    """
    src = os.environ.get("LUMI_CAMERA", "").strip()

    # WiFi / IP camera — a stream URL
    if src.startswith(("rtsp://", "http://", "https://")):
        print(f"[Camera] Opening network stream: {src}")
        cap = cv2.VideoCapture(src)
        if cap.isOpened():
            return cap
        cap.release()
        print("Error: Could not open the WiFi camera stream.")
        print("Check the RTSP/HTTP URL, IP address, username and password.")
        return None

    # USB webcam — numeric index. DirectShow is most reliable on Windows.
    candidates = [int(src)] if src.isdigit() else [0, 1, 2]
    for idx in candidates:
        cap = cv2.VideoCapture(idx, cv2.CAP_DSHOW)
        if cap.isOpened():
            print(f"[Camera] Opened USB camera index {idx}")
            cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
            return cap
        cap.release()
    print("Error: Cannot access any USB camera (tried indices 0,1,2).")
    return None


def annotate_frame(frame, blocks, commands):
    """Draw bounding boxes + command labels onto the frame (in place)."""
    bgr_colors = {
        'black': (200, 200, 200),   # draw in light grey so it's visible on dark blocks
        'red':   (0, 0, 255),
    }
    for block in blocks:
        x, y, w, h = block['bbox']
        bgr_color = bgr_colors.get(block['color'], (255, 255, 255))
        cv2.rectangle(frame, (x, y), (x + w, y + h), bgr_color, 3)
        cmd_text = COLOR_TO_COMMAND[block['color']]
        cv2.putText(frame, cmd_text, (x, max(15, y - 10)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, bgr_color, 2)
    sequence_text = f"Sequence: {commands}"
    cv2.putText(frame, sequence_text, (20, 40),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)


def process_image(path):
    """
    DEMO MODE: run the REAL computer vision on a saved photo instead of a
    live camera. Detects the colored blocks, sends the command sequence to
    the server, and shows the annotated image. Perfect for presentations
    where a live camera/WiFi is unreliable.

    Enable with:  set LUMI_IMAGE=sample_blocks.png   (Windows)
                  python color_detector.py
    """
    frame = cv2.imread(path)
    if frame is None:
        print(f"Error: could not read image '{path}'. Check the path.")
        return

    commands, blocks = detect_and_sort_blocks(frame, min_area=800)
    print("--- Vision Command System (IMAGE DEMO) ---")
    print(f"Image: {path}")
    print(f"Detected {len(blocks)} blocks → sequence: {commands}")
    send_to_server(commands)
    print("Sent to server. The blocks now appear in the app.")
    print("Press 'q' to close the preview window.")

    annotate_frame(frame, blocks, commands)
    while True:
        cv2.imshow('Lumi Block Detector — IMAGE DEMO', frame)
        if cv2.waitKey(100) & 0xFF == ord('q'):
            break
    cv2.destroyAllWindows()


def main():
    # DEMO MODE: process a still image if LUMI_IMAGE is set.
    image_path = os.environ.get("LUMI_IMAGE", "").strip()
    if image_path:
        process_image(image_path)
        return

    cap = open_camera()
    if cap is None:
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
        annotate_frame(frame, blocks, commands)
        cv2.imshow('Top-Down Block Detector', frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    # Cleanup
    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
