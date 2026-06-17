"""
Generate a sample "LEGO program" image for the camera demo.
─────────────────────────────────────────────────────────────────────
Draws a left-to-right row of pure-colored blocks that the computer
vision (color_detector.py) will reliably detect. Use this when you
want a guaranteed-working demo without photographing real LEGO bricks
under perfect lighting.

Run:
    python make_sample_blocks.py
Then:
    set LUMI_IMAGE=sample_blocks.png   (Windows)
    python color_detector.py
"""
import cv2
import numpy as np

# The program we want the camera to "see", in order.
# green=forward, blue=turn_right, yellow=turn_left, red=loop
PROGRAM = ["green", "green", "blue", "green", "yellow", "green"]

# Pure BGR colors that fall squarely inside the detector's HSV ranges.
BGR = {
    "green":  (0, 200, 0),
    "blue":   (220, 0, 0),
    "yellow": (0, 220, 220),
    "red":    (0, 0, 220),
    "orange": (0, 140, 240),
    "purple": (150, 0, 150),
}

BLOCK = 170      # block size (px)
GAP = 40         # gap between blocks
MARGIN = 50      # outer margin
TOP = 90         # top offset (leaves room for labels)


def main():
    n = len(PROGRAM)
    width = MARGIN * 2 + n * BLOCK + (n - 1) * GAP
    height = TOP + BLOCK + 80
    img = np.full((height, width, 3), 245, dtype=np.uint8)  # light gray bg

    x = MARGIN
    for color in PROGRAM:
        cv2.rectangle(img, (x, TOP), (x + BLOCK, TOP + BLOCK),
                      BGR[color], thickness=-1)
        # subtle border so blocks look like physical bricks
        cv2.rectangle(img, (x, TOP), (x + BLOCK, TOP + BLOCK),
                      (60, 60, 60), thickness=3)
        x += BLOCK + GAP

    cv2.putText(img, "Lumi sample program (colored blocks)", (MARGIN, 55),
                cv2.FONT_HERSHEY_SIMPLEX, 1.0, (40, 40, 40), 2)

    out = "sample_blocks.png"
    cv2.imwrite(out, img)
    print(f"Wrote {out}  ({width}x{height})")
    print(f"Program: {PROGRAM}")
    print("Now run the camera demo:")
    print("    set LUMI_IMAGE=sample_blocks.png")
    print("    python color_detector.py")


if __name__ == "__main__":
    main()
