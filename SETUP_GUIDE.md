# Lumi — Complete Setup Guide

This guide takes you from zero to a fully working system:
cloud-deployed app + AI features + physical robot.

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Vercel    │────▶│     Render       │◀────│   ESP32     │
│  (frontend) │ API │ (FastAPI backend)│ wss │  (robot)    │
└─────────────┘     └──────────────────┘     └─────────────┘
                       ▲ ANTHROPIC_API_KEY
```

---

## Part 1 — Deploy the backend to Render (free)

1. Go to **https://render.com** → sign up with your GitHub account
2. Click **New → Web Service**
3. Connect this repository
4. Render reads `render.yaml` automatically. If it asks, use:
   - **Build command:** `pip install -r requirements.txt`
   - **Start command:** `uvicorn server:app --host 0.0.0.0 --port $PORT`
5. Under **Environment**, add:
   - Key: `ANTHROPIC_API_KEY`
   - Value: your key (starts with `sk-ant-`)
6. Click **Create Web Service** and wait for the green "Live" badge
7. Note your URL, e.g. `https://lumi-server.onrender.com`

**Test it:** open `https://YOUR-APP.onrender.com/api/levels` in a browser —
you should see JSON.

> ⚠️ Free tier sleeps after 15 min of inactivity. First request after sleep
> takes ~40s to wake. The dashboard reconnects automatically.

---

## Part 2 — Deploy the frontend to Vercel (free)

1. Go to **https://vercel.com** → sign up with GitHub
2. **Add New → Project** → import this repository
3. Vercel reads the root `vercel.json` (builds `dashboard/`)
4. Under **Environment Variables**, add:
   - Key: `VITE_API_URL`
   - Value: `https://YOUR-APP.onrender.com` (from Part 1, **no trailing slash**)
5. Deploy → you get `https://your-project.vercel.app`

Open it — the game, chat (💬), and AI panel (🧠) should all work.

---

## Part 3 — Assemble the robot

### Parts list (what the firmware expects)
| Part | Purpose |
|---|---|
| ESP32-WROOM-32 dev board | Brain |
| L298N (or TB6612) motor driver | Drives the motors |
| 2× DC gear motors **with encoders** | Wheels + distance feedback |
| HC-SR04 ultrasonic sensor | Obstacle detection |
| WS2812B NeoPixel ring (12 LEDs) | Emotions/status light |
| 7.4V LiPo battery (2S) | Power |
| 100kΩ + 47kΩ resistors | Battery voltage divider |
| Jumper wires, chassis, 2 wheels + caster | Body |

### Wiring (exact pins the firmware uses)

**Motors → L298N → ESP32**
| L298N pin | ESP32 pin | What |
|---|---|---|
| ENA | GPIO 25 | Left motor speed (PWM) |
| IN1 | GPIO 26 | Left motor direction |
| IN2 | GPIO 27 | Left motor direction |
| ENB | GPIO 14 | Right motor speed (PWM) |
| IN3 | GPIO 12 | Right motor direction |
| IN4 | GPIO 13 | Right motor direction |

**Encoders**
| Encoder wire | ESP32 pin |
|---|---|
| Left encoder signal | GPIO 34 |
| Right encoder signal | GPIO 35 |

> GPIO 34/35 are input-only with **no internal pull-ups**. If your encoder
> outputs are open-collector, add a 10kΩ resistor from the signal wire to 3.3V.
> Hall-effect encoder boards with push-pull outputs work as-is.

**Ultrasonic (HC-SR04)**
| HC-SR04 pin | ESP32 pin |
|---|---|
| TRIG | GPIO 5 |
| ECHO | GPIO 18 (⚠️ use a voltage divider: ECHO is 5V, ESP32 pins are 3.3V — 1kΩ/2kΩ) |
| VCC | 5V |
| GND | GND |

**NeoPixel ring**
| Ring pin | ESP32 pin |
|---|---|
| DIN | GPIO 4 |
| VCC | 5V |
| GND | GND |

**Battery monitor**
- Battery + → 100kΩ → **GPIO 36** → 47kΩ → GND

**Power**
- LiPo + → L298N `12V` input (powers motors)
- L298N `5V` out → ESP32 `VIN` (powers the brain)
- All grounds connected together (battery, L298N, ESP32, sensors)

---

## Part 4 — Flash the firmware (Windows)

1. Install **Arduino IDE 2** from arduino.cc
2. **File → Preferences** → Additional boards manager URLs:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
3. **Tools → Board → Boards Manager** → install **esp32 by Espressif**
4. **Tools → Manage Libraries** → install:
   - `ArduinoWebsockets` (Gil Maimon)
   - `ArduinoJson` (Benoit Blanchon)
   - `FastLED`
5. Open `esp32_firmware/lumi_robot/lumi_robot.ino` and edit the config block:
   ```cpp
   const char* WIFI_SSID     = "YourHomeWiFi";
   const char* WIFI_PASSWORD = "YourPassword";
   const bool  USE_TLS       = true;                       // cloud!
   const char* SERVER_HOST   = "lumi-server.onrender.com"; // your Render URL (no https://)
   const int   SERVER_PORT   = 443;                        // cloud port
   ```
6. Plug in the ESP32 via USB → **Tools → Board: "ESP32 Dev Module"**,
   **Tools → Port:** the new COM port (check Device Manager if unsure)
7. Click **Upload** (→). If stuck on "Connecting...", hold the **BOOT**
   button on the board for 2 seconds
8. **Tools → Serial Monitor** at **115200 baud** — you should see:
   ```
   [WiFi] Connected! IP: 192.168.x.x
   [WS] Connecting to wss://lumi-server.onrender.com:443/ws/robot
   [WS] Registered with server!
   ```

The Wifi button in the app turns **green** when the robot registers.

> ⚠️ 2.4GHz WiFi only — the ESP32 cannot see 5GHz networks.

---

## Part 5 — Calibrate

Drive the robot from the 🧠 AI panel's D-pad, then tune in the firmware:

| Symptom | Fix |
|---|---|
| Stops short of one grid cell | Increase `TICKS_PER_CELL` (430) |
| Overshoots a cell | Decrease `TICKS_PER_CELL` |
| Turns less than 90° | Increase `TICKS_PER_90DEG` (205) |
| Turns more than 90° | Decrease `TICKS_PER_90DEG` |
| Drifts left/right going straight | Check both encoders are counting (Serial Monitor) |
| Battery % looks wrong | Adjust the `3.13f` divider factor in `readBattery()` |

Re-upload after each change.

---

## LED status reference

| Color | Meaning |
|---|---|
| Purple flash | Booting |
| Rainbow spin | Connecting to WiFi |
| Blue flash | WiFi connected |
| Green flash | Registered with server ✓ |
| Blue solid | Driving forward |
| Cyan / Yellow | Turning right / left |
| Red flash | Obstacle detected |
| Rainbow party | Level solved! 🎉 |

---

## Troubleshooting

| Problem | Fix |
|---|---|
| App shows no AI replies | Check `ANTHROPIC_API_KEY` is set in Render → Environment, then redeploy |
| Robot won't register | Serial Monitor: if WiFi fails, check 2.4GHz + credentials; if WS fails, check `USE_TLS=true` + port 443 |
| First app load very slow | Render free tier waking up (~40s) — normal |
| Robot connects then drops | Render sleeps when idle; open the app to keep it awake, or upgrade the Render plan |
| Motors hum but don't move | Battery too low, or ENA/ENB jumpers still on the L298N — remove them |
