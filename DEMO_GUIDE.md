# Lumi — Judge Demo Guide (no hardware, no WiFi needed)

This shows **all 4 stages** of the system running entirely on one laptop,
with **zero** dependence on a live camera, the internet, or a physical robot.
Nothing is faked: the computer vision is real (it runs on a saved photo),
and the robot simulator speaks the **exact same protocol** as the real ESP32
firmware — only the motors are virtual.

```
①  Blocks photo  ──▶  ②  Real CV detects them  ──▶  ③  App runs the program
   (stage 1 + 4)        color_detector.py             (stage 2: grid + AI)
                                                            │
                                                            ▼
                                          ④  Robot simulator executes
                                             (stage 3: virtual ESP32)
```

| Stage | How it's shown in the demo |
|---|---|
| 1. Camera seeing | Real OpenCV vision runs on a saved photo of the blocks |
| 2. Software understanding | Grid simulation + Lumi AI chat/hints |
| 3. Hardware robot | Robot simulator — a virtual ESP32 over WebSocket |
| 4. LEGO/block detection | The vision detects each colored block → command |

---

## One-time prep

Open a terminal in the project folder and generate the sample program image:

```powershell
cd C:\Users\User\lumi-kid-movement-analyzer-and-automated-adaptive-education-system
python make_sample_blocks.py
```

This creates `sample_blocks.png` — a row of colored blocks the vision will
reliably detect as: **forward, forward, turn_right, forward, turn_left, forward**.

> You can instead use a **photo of real LEGO/colored blocks** in a left-to-right
> row — just set `LUMI_IMAGE` to that file. Pure, bright colors detect best.

---

## Start the demo — 3 terminals

**Terminal 1 — the server (the brain)**
```powershell
cd C:\Users\User\lumi-kid-movement-analyzer-and-automated-adaptive-education-system
$env:ANTHROPIC_API_KEY = "your-key-here"
python -m uvicorn server:app --host 0.0.0.0 --port 8000
```
Wait for: `Application startup complete.`

**Terminal 2 — the app (what the child sees)**
```powershell
cd C:\Users\User\lumi-kid-movement-analyzer-and-automated-adaptive-education-system\dashboard
npm run dev
```
Open the printed URL (usually `http://localhost:5173`).

**Terminal 3 — the robot (virtual ESP32)**
```powershell
cd C:\Users\User\lumi-kid-movement-analyzer-and-automated-adaptive-education-system
python robot_simulator.py
```
Wait for: `✅ Registered! The robot is now LIVE on the dashboard 🟢`
The robot/WiFi status in the app turns **green**.

---

## The 5-minute demo flow (what to do + say)

**1. Open the app.** *"This is Lumi — a coding game where children program a
robot using colored blocks. No keyboard, no reading required."*

**2. Show the robot is connected.** Point to the green robot status / 🧠 AI panel
showing battery + sensor telemetry. *"Our robot is live and reporting its
battery and distance sensor in real time."* (It's the simulator — for a
hardware demo you'd flash the same protocol to a physical ESP32.)

**3. Stage 1 + 4 — the camera sees the blocks.** In a 4th terminal (or reuse
Terminal 3 after stopping it), run:
```powershell
$env:LUMI_IMAGE = "sample_blocks.png"
python color_detector.py
```
A window opens with **green boxes drawn around each detected block** and the
command under it. *"Our computer vision detects the colored blocks the child
laid out and converts each color into a command — green is forward, blue is
turn right, and so on."* The detected program appears in the app automatically.
Press **q** to close the window.

**4. Stage 2 — the software runs it.** In the app, press **Run**. *"The program
runs in our simulator first — the robot walks the grid, and our AI checks
whether it solves the puzzle."* The robot icon steps across the grid.

**5. Stage 3 — the robot executes.** Watch **Terminal 3**: it prints each move
(`⬆️ forward`, `↻ turn right`…). *"The exact same commands drive the physical
robot — here shown by our robot simulator, which uses the identical wireless
protocol as our ESP32 hardware."*

**6. The AI tutor.** Click **💬** and ask *"how do I get to the star?"*, or
click the **hint** button. *"An AI tutor adapts to each child — it gives gentle
hints, never the full answer, so the child still thinks for themselves."*

**7. AI auto-solve (the wow moment).** Open **🧠** → click **AI AUTO-SOLVE**.
*"Our AI can plan the optimal path itself and drive the robot."* The grid robot
and Terminal 3 both execute, and on success the robot celebrates 🎉.

---

## If you want to point the robot/camera at the CLOUD instead

Everything above works against your deployed Render server too — just set:
```powershell
$env:LUMI_SERVER = "https://YOUR-APP.onrender.com"
```
before running `robot_simulator.py` or `color_detector.py`.

---

## Quick troubleshooting

| Problem | Fix |
|---|---|
| Robot status not green | Make sure Terminal 1 (server) is running, then start Terminal 3 |
| No AI replies in chat | `ANTHROPIC_API_KEY` not set in Terminal 1 — set it and restart the server |
| Vision window is black | The image path is wrong — check `sample_blocks.png` exists |
| Vision detects wrong blocks | Use the generated `sample_blocks.png`, or brighter/cleaner block colors |
| `npm run dev` fails | Run `npm install` once in the `dashboard` folder first |

---

## Why this is an honest demo

- The **computer vision** is the real detection pipeline, just fed a photo
  instead of a live camera feed.
- The **robot simulator** sends byte-for-byte the same WebSocket messages
  (`register`, `telemetry`, `execution_complete`) as the ESP32 firmware in
  `esp32_firmware/lumi_robot/`. Swapping in real hardware changes nothing in
  the app or server.
- The **AI, grid simulation, levels, and scoring** are the production code.

The only thing virtual is the motors turning — everything else is the real system.
