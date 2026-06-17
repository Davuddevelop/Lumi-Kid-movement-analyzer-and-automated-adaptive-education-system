"""
Lumi Robot Simulator — a virtual ESP32.
─────────────────────────────────────────────────────────────────────
Connects to the Lumi server over the SAME WebSocket protocol the real
ESP32 firmware uses (/ws/robot). The dashboard then shows a LIVE,
connected robot — with battery + obstacle telemetry and step-by-step
movement — without any physical hardware.

Perfect for demos where the camera, WiFi, or robot hardware is
unreliable. Nothing here is faked: the messages are byte-for-byte the
same ones the firmware sends, so the entire app↔robot pipeline is
genuinely exercised. Only the motors are virtual.

Run (local server):
    python robot_simulator.py

Point at a cloud server:
    set LUMI_SERVER=https://lumi-server.onrender.com   (Windows)
    python robot_simulator.py
"""
import asyncio
import json
import os
import random
import sys

try:
    import websockets
except ImportError:
    print("Missing dependency. Install it with:  pip install websockets")
    sys.exit(1)

# ── Config ──────────────────────────────────────────────────────────
SERVER = os.environ.get("LUMI_SERVER", "http://127.0.0.1:8000").rstrip("/")
if SERVER.startswith("https://"):
    WS_URL = "wss://" + SERVER[len("https://"):] + "/ws/robot"
elif SERVER.startswith("http://"):
    WS_URL = "ws://" + SERVER[len("http://"):] + "/ws/robot"
else:
    WS_URL = "ws://" + SERVER + "/ws/robot"

ROBOT_ID = os.environ.get("LUMI_ROBOT_ID", "lumi-bot-1")

# ── Simulated robot state ───────────────────────────────────────────
battery_v = 8.2            # 2S LiPo ≈ 8.4V full, 6.6V empty
executing = False

MOVE_LABELS = {
    "forward":    ("⬆️  forward",     0.7),
    "turn_right": ("↻  turn right",  0.5),
    "turn_left":  ("↺  turn left",   0.5),
    "loop":       ("🔁 loop",         0.4),
}


def _telemetry_payload():
    return {
        "type": "telemetry",
        "robot_id": ROBOT_ID,
        "battery_v": round(battery_v, 2),
        "obstacle_cm": round(random.uniform(15, 90), 1),  # mostly clear
        "executing": executing,
    }


async def telemetry_loop(ws):
    """Send periodic telemetry so the dashboard shows battery + sensor data."""
    global battery_v
    try:
        while True:
            await asyncio.sleep(5)
            battery_v = max(6.6, battery_v - 0.01)  # drain slowly for realism
            await ws.send(json.dumps(_telemetry_payload()))
    except Exception:
        return


async def run_sequence(ws, commands):
    """Simulate executing a command sequence with realistic timing."""
    global executing
    executing = True
    print(f"\n🤖 Executing {len(commands)} move(s):")
    for cmd in commands:
        label, dur = MOVE_LABELS.get(cmd, (cmd, 0.4))
        print(f"    {label}")
        await ws.send(json.dumps(_telemetry_payload()))  # live update per move
        await asyncio.sleep(dur)
    print("    ✅ sequence complete\n")
    executing = False
    await ws.send(json.dumps({
        "type": "execution_complete",
        "robot_id": ROBOT_ID,
        "success": True,
    }))


async def session(ws):
    """Register, then handle server messages until disconnect."""
    await ws.send(json.dumps({"type": "register", "robot_id": ROBOT_ID}))
    print(f"📡 Sent registration as '{ROBOT_ID}'…")

    tele_task = asyncio.create_task(telemetry_loop(ws))
    try:
        async for raw in ws:
            try:
                msg = json.loads(raw)
            except (ValueError, TypeError):
                continue
            t = msg.get("type")

            if t == "registered":
                print("✅ Registered! The robot is now LIVE on the dashboard 🟢")
            elif t == "execute":
                await run_sequence(ws, msg.get("commands", []))
            elif t == "celebrate":
                print("🎉 CELEBRATION! Rainbow lights — level solved!")
            elif t == "stop":
                print("🛑 Emergency stop received.")
            elif t == "set_leds":
                print(f"💡 LEDs → R{msg.get('r', 0)} G{msg.get('g', 0)} B{msg.get('b', 0)}")
    finally:
        tele_task.cancel()


async def main():
    print("=" * 56)
    print("  Lumi Robot Simulator  (virtual ESP32, no hardware)")
    print("=" * 56)
    print(f"  Target: {WS_URL}")
    print(f"  Robot ID: {ROBOT_ID}")
    print("  Press Ctrl+C to stop.\n")

    while True:
        try:
            async with websockets.connect(WS_URL) as ws:
                print("🔌 Connected to server.")
                await session(ws)
            print("⚠️  Connection closed. Reconnecting in 3s…")
        except Exception as e:
            print(f"⚠️  Could not connect ({e}). Retrying in 3s…")
        await asyncio.sleep(3)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Simulator stopped.")
