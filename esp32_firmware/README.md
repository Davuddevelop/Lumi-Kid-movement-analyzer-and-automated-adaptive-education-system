# Lumi-Bot ESP32 Firmware

## Hardware Required
- ESP32-WROOM-32 dev board
- L298N or TB6612FNG motor driver
- 2× DC gear motors with Hall-effect encoders
- HC-SR04 ultrasonic sensor
- WS2812B NeoPixel ring (12 LEDs)
- 7.4V LiPo battery + voltage divider (100kΩ / 47kΩ) on pin 36

## Arduino Libraries (install via Library Manager)
- `ArduinoWebsockets` by Gil Maimon
- `ArduinoJson` by Benoît Blanchon  
- `FastLED` by FastLED

## Wiring

| ESP32 Pin | Connected To |
|-----------|-------------|
| 25 (PWM)  | L298N ENA / TB6612 PWMA |
| 26        | L298N IN1 / TB6612 AIN1 |
| 27        | L298N IN2 / TB6612 AIN2 |
| 14 (PWM)  | L298N ENB / TB6612 PWMB |
| 12        | L298N IN3 / TB6612 BIN1 |
| 13        | L298N IN4 / TB6612 BIN2 |
| 34        | Left encoder signal |
| 35        | Right encoder signal |
| 5         | HC-SR04 TRIG |
| 18        | HC-SR04 ECHO |
| 4         | NeoPixel DATA |
| 36        | Battery voltage divider |

## Configuration
Edit the top of `lumi_robot.ino`:
```cpp
const char* WIFI_SSID     = "YourNetworkName";
const char* WIFI_PASSWORD = "YourPassword";
const char* SERVER_HOST   = "192.168.1.100";  // Lumi server IP
const char* ROBOT_ID      = "lumi-bot-1";     // unique per robot
```

## Calibration
Adjust these constants to match your robot's physical dimensions:
```cpp
#define TICKS_PER_CELL   430   // encoder ticks = 1 grid square
#define TICKS_PER_90DEG  205   // encoder ticks = 90° rotation
#define MOTOR_SPEED      170   // 0-255 forward speed
#define TURN_SPEED       140   // 0-255 turn speed
```

**Calibration procedure:**
1. Flash firmware, open Serial Monitor (115200 baud)
2. Send a single `forward` command from the dashboard
3. Measure how far the robot actually moved vs. one grid cell
4. Adjust `TICKS_PER_CELL` proportionally
5. Repeat for turning with `TICKS_PER_90DEG`

## How It Works
1. ESP32 connects to WiFi
2. Opens WebSocket connection to Lumi server at `/ws/robot`
3. Sends `{"type":"register","robot_id":"lumi-bot-1"}`
4. Server sends `{"type":"registered"}` to confirm
5. On mission run, server sends `{"type":"execute","commands":["forward","turn_right",...]}`
6. Robot executes each command with encoder feedback, sends telemetry between steps
7. Sends `{"type":"execution_complete","success":true}` when done
8. Server triggers celebration animation, awards XP

## LED Color Meanings
| Color | Meaning |
|-------|---------|
| 🟣 Purple | Booting / Ready |
| 🔵 Blue | Moving forward |
| 🔵 Cyan | Turning right |
| 🟡 Yellow | Turning left |
| 🟢 Green | Success / Connected |
| 🔴 Red | Error / Disconnected |
| 🟠 Orange | Emergency stop |
| 🌈 Rainbow | Celebration! |
