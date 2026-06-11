/*
 * Lumi-Bot ESP32 Firmware
 * ─────────────────────────────────────────────────────────────
 * Connects to the Lumi server via WiFi WebSocket.
 * Receives JSON command sequences, executes them with encoder
 * feedback, reports telemetry back.
 *
 * Hardware:
 *   - ESP32-WROOM-32 (or ESP32-S3)
 *   - L298N or TB6612 motor driver
 *   - 2× DC motors with encoders (Hall-effect)
 *   - HC-SR04 ultrasonic sensor
 *   - WS2812B NeoPixel ring (12 LEDs)
 *   - LiPo battery (7.4V) + voltage divider on ADC
 *
 * Libraries required (install via Arduino Library Manager):
 *   - ArduinoWebsockets  (gilmaimon)
 *   - ArduinoJson        (bblanchon)
 *   - FastLED            (FastLED)
 *
 * ─────────────────────────────────────────────────────────────
 */

#include <WiFi.h>
#include <ArduinoWebsockets.h>
#include <ArduinoJson.h>
#include <FastLED.h>

using namespace websockets;

// ── WiFi / Server config ───────────────────────────────────────
// Change these to match your network and server.
//
// LOCAL server (laptop on same WiFi):
//   USE_TLS = false, SERVER_HOST = "192.168.1.xx", SERVER_PORT = 8000
// CLOUD server (e.g. Render):
//   USE_TLS = true,  SERVER_HOST = "lumi-server.onrender.com", SERVER_PORT = 443
const char* WIFI_SSID     = "YOUR_WIFI_NAME";    // your WiFi SSID
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";// your WiFi password
const bool  USE_TLS       = false;               // true for cloud (wss://)
const char* SERVER_HOST   = "192.168.1.100";     // server IP or cloud hostname
const int   SERVER_PORT   = 8000;                // 8000 local, 443 cloud
const char* SERVER_PATH   = "/ws/robot";
const char* ROBOT_ID      = "lumi-bot-1";        // unique per robot

// ── Motor pins (L298N / TB6612) ────────────────────────────────
#define MOTOR_L_PWM   25
#define MOTOR_L_IN1   26
#define MOTOR_L_IN2   27
#define MOTOR_R_PWM   14
#define MOTOR_R_IN1   12
#define MOTOR_R_IN2   13

// ── Encoder pins (hardware interrupts) ─────────────────────────
#define ENC_L_PIN  34   // input-only, no pull-up needed
#define ENC_R_PIN  35

// ── Ultrasonic sensor ──────────────────────────────────────────
#define TRIG_PIN  5
#define ECHO_PIN  18

// ── NeoPixel LED ring ──────────────────────────────────────────
#define LED_PIN    4
#define NUM_LEDS  12

// ── Battery voltage divider ────────────────────────────────────
#define BATT_PIN  36   // ADC1_CH0 — connect via 100k/47k divider

// ── Tuning (calibrate these for your robot) ────────────────────
// Encoder ticks to travel exactly 1 grid cell forward:
#define TICKS_PER_CELL      430
// Encoder ticks to complete exactly 90° turn:
#define TICKS_PER_90DEG     205
// Motor base PWM (0-255):
#define MOTOR_SPEED         170
// Turn motor PWM:
#define TURN_SPEED          140
// Obstacle stop distance (cm):
#define OBSTACLE_STOP_CM    4.0f
// Telemetry interval (ms):
#define TELEMETRY_INTERVAL  5000

// ── Globals ────────────────────────────────────────────────────
WebsocketsClient ws;
CRGB leds[NUM_LEDS];

volatile long encL = 0;
volatile long encR = 0;
bool executing     = false;
bool registered    = false;
unsigned long lastTelemetry = 0;

// PWM channels
#define CH_L 0
#define CH_R 1

// ── Encoder ISRs ───────────────────────────────────────────────
void IRAM_ATTR isrEncL() { encL++; }
void IRAM_ATTR isrEncR() { encR++; }

// ── Motor helpers ──────────────────────────────────────────────
void motorLeft(int pwm) {
    bool fwd = pwm >= 0;
    digitalWrite(MOTOR_L_IN1, fwd ? HIGH : LOW);
    digitalWrite(MOTOR_L_IN2, fwd ? LOW  : HIGH);
    ledcWrite(CH_L, abs(pwm));
}

void motorRight(int pwm) {
    bool fwd = pwm >= 0;
    digitalWrite(MOTOR_R_IN1, fwd ? HIGH : LOW);
    digitalWrite(MOTOR_R_IN2, fwd ? LOW  : HIGH);
    ledcWrite(CH_R, abs(pwm));
}

void motorStop() {
    motorLeft(0);
    motorRight(0);
}

// ── LED helpers ────────────────────────────────────────────────
void setLEDs(CRGB color) {
    fill_solid(leds, NUM_LEDS, color);
    FastLED.show();
}

void ledBreath(CRGB base, int cycles = 2) {
    for (int c = 0; c < cycles; c++) {
        for (int b = 30; b <= 200; b += 8) {
            fill_solid(leds, NUM_LEDS, base);
            FastLED.setBrightness(b);
            FastLED.show();
            delay(18);
        }
        for (int b = 200; b >= 30; b -= 8) {
            FastLED.setBrightness(b);
            FastLED.show();
            delay(18);
        }
    }
    FastLED.setBrightness(100);
}

void celebrationAnimation() {
    for (int i = 0; i < 20; i++) {
        for (int j = 0; j < NUM_LEDS; j++) {
            leds[j] = CHSV(random8(), 220, 255);
        }
        FastLED.show();
        delay(80);
    }
    setLEDs(CRGB::Gold);
    delay(600);
    setLEDs(CRGB::Black);
}

void errorAnimation() {
    for (int i = 0; i < 6; i++) {
        setLEDs(CRGB::Red); delay(120);
        setLEDs(CRGB::Black); delay(120);
    }
}

void connectingAnimation() {
    static uint8_t hue = 0;
    for (int i = 0; i < NUM_LEDS; i++) {
        leds[i] = CHSV(hue + i * (255 / NUM_LEDS), 200, 180);
    }
    FastLED.show();
    hue += 5;
}

// ── Sensors ────────────────────────────────────────────────────
float readUltrasonic() {
    digitalWrite(TRIG_PIN, LOW);  delayMicroseconds(2);
    digitalWrite(TRIG_PIN, HIGH); delayMicroseconds(10);
    digitalWrite(TRIG_PIN, LOW);
    long dur = pulseIn(ECHO_PIN, HIGH, 25000UL);
    if (dur == 0) return 99.0f;
    return dur * 0.0343f / 2.0f;
}

float readBattery() {
    int raw = analogRead(BATT_PIN);
    // Voltage divider: 100kΩ / 47kΩ → factor ≈ 3.13
    return (raw / 4095.0f) * 3.3f * 3.13f;
}

// ── Movement primitives ────────────────────────────────────────
// Returns false if obstacle detected mid-move
bool moveForward(int cells = 1) {
    long target = (long)cells * TICKS_PER_CELL;
    encL = encR = 0;
    setLEDs(CRGB::Blue);
    motorLeft(MOTOR_SPEED);
    motorRight(MOTOR_SPEED);

    while (encL < target && encR < target) {
        // Obstacle guard
        if (readUltrasonic() < OBSTACLE_STOP_CM) {
            motorStop();
            errorAnimation();
            return false;
        }
        // Basic encoder balance (keep straight)
        long diff = encL - encR;
        if (diff > 5) {
            motorLeft(MOTOR_SPEED - 20);
            motorRight(MOTOR_SPEED);
        } else if (diff < -5) {
            motorLeft(MOTOR_SPEED);
            motorRight(MOTOR_SPEED - 20);
        }
        delay(4);
    }
    motorStop();
    delay(180);   // brief settle
    return true;
}

void turnRight() {
    encL = encR = 0;
    setLEDs(CRGB::Cyan);
    motorLeft(TURN_SPEED);
    motorRight(-TURN_SPEED);
    while (encL < TICKS_PER_90DEG) delay(4);
    motorStop();
    delay(200);
}

void turnLeft() {
    encL = encR = 0;
    setLEDs(CRGB::Yellow);
    motorLeft(-TURN_SPEED);
    motorRight(TURN_SPEED);
    while (encR < TICKS_PER_90DEG) delay(4);
    motorStop();
    delay(200);
}

// ── Telemetry ──────────────────────────────────────────────────
void sendTelemetry() {
    if (!ws.available()) return;
    StaticJsonDocument<256> doc;
    doc["type"]        = "telemetry";
    doc["robot_id"]    = ROBOT_ID;
    doc["battery_v"]   = readBattery();
    doc["obstacle_cm"] = readUltrasonic();
    doc["executing"]   = executing;
    String msg;
    serializeJson(doc, msg);
    ws.send(msg);
}

void sendResult(bool success) {
    if (!ws.available()) return;
    StaticJsonDocument<128> doc;
    doc["type"]     = success ? "execution_complete" : "collision";
    doc["robot_id"] = ROBOT_ID;
    doc["success"]  = success;
    String msg;
    serializeJson(doc, msg);
    ws.send(msg);
}

// ── Execute command sequence ───────────────────────────────────
void executeSequence(JsonArray commands) {
    executing = true;
    bool ok = true;

    for (const char* cmd : commands) {
        if (!cmd) continue;

        if (strcmp(cmd, "forward") == 0) {
            ok = moveForward(1);
        } else if (strcmp(cmd, "turn_right") == 0) {
            turnRight();
        } else if (strcmp(cmd, "turn_left") == 0) {
            turnLeft();
        }

        // Send live telemetry between commands
        sendTelemetry();

        if (!ok) break;
        delay(150);
    }

    motorStop();

    if (ok) {
        setLEDs(CRGB::Green);
    }

    sendResult(ok);
    executing = false;
}

// ── WebSocket message handler ──────────────────────────────────
void onMessage(WebsocketsMessage message) {
    StaticJsonDocument<512> doc;
    DeserializationError err = deserializeJson(doc, message.data());
    if (err) {
        Serial.printf("[WS] JSON parse error: %s\n", err.c_str());
        return;
    }

    const char* type = doc["type"];
    if (!type) return;

    Serial.printf("[WS] msg: %s\n", type);

    if (strcmp(type, "registered") == 0) {
        registered = true;
        Serial.println("[WS] Registered with server!");
        setLEDs(CRGB::Green);
        delay(500);
        setLEDs(CRGB::Black);

    } else if (strcmp(type, "execute") == 0) {
        JsonArray cmds = doc["commands"].as<JsonArray>();
        if (cmds) {
            setLEDs(CRGB::Purple);
            executeSequence(cmds);
        }

    } else if (strcmp(type, "celebrate") == 0) {
        celebrationAnimation();

    } else if (strcmp(type, "stop") == 0) {
        motorStop();
        executing = false;
        setLEDs(CRGB::Orange);
        delay(300);
        setLEDs(CRGB::Black);

    } else if (strcmp(type, "set_leds") == 0) {
        uint8_t r = doc["r"] | 0;
        uint8_t g = doc["g"] | 0;
        uint8_t b = doc["b"] | 0;
        fill_solid(leds, NUM_LEDS, CRGB(r, g, b));
        FastLED.show();
    }
}

// ── WiFi + WebSocket connect ───────────────────────────────────
void connectWiFi() {
    Serial.printf("[WiFi] Connecting to %s", WIFI_SSID);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    // Animate LEDs while connecting
    unsigned long start = millis();
    while (WiFi.status() != WL_CONNECTED) {
        connectingAnimation();
        delay(60);
        Serial.print('.');
        if (millis() - start > 15000) {
            Serial.println("\n[WiFi] Timeout — retrying...");
            WiFi.disconnect();
            delay(1000);
            WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
            start = millis();
        }
    }

    Serial.printf("\n[WiFi] Connected! IP: %s\n", WiFi.localIP().toString().c_str());
    setLEDs(CRGB::Blue);
    delay(300);
    setLEDs(CRGB::Black);
}

void connectWebSocket() {
    ws.onMessage(onMessage);
    ws.onEvent([](WebsocketsEvent evt, String data) {
        if (evt == WebsocketsEvent::ConnectionOpened) {
            Serial.println("[WS] Connected to server");
            // Send registration message
            StaticJsonDocument<128> doc;
            doc["type"]     = "register";
            doc["robot_id"] = ROBOT_ID;
            String msg;
            serializeJson(doc, msg);
            ws.send(msg);
        } else if (evt == WebsocketsEvent::ConnectionClosed) {
            Serial.println("[WS] Disconnected — will reconnect");
            registered = false;
            setLEDs(CRGB::Red);
            delay(200);
            setLEDs(CRGB::Black);
        }
    });

    if (USE_TLS) {
        // Cloud hosts use proper certs; skipping validation keeps setup simple
        // and the channel is still encrypted.
        ws.setInsecure();
    }
    String url = String(USE_TLS ? "wss://" : "ws://") + SERVER_HOST + ":" + SERVER_PORT + SERVER_PATH;
    Serial.printf("[WS] Connecting to %s\n", url.c_str());
    ws.connect(url);
}

// ── Setup ──────────────────────────────────────────────────────
void setup() {
    Serial.begin(115200);
    delay(500);
    Serial.println("\n=== Lumi-Bot Starting ===");

    // Motor pins
    pinMode(MOTOR_L_IN1, OUTPUT); pinMode(MOTOR_L_IN2, OUTPUT);
    pinMode(MOTOR_R_IN1, OUTPUT); pinMode(MOTOR_R_IN2, OUTPUT);
    ledcSetup(CH_L, 20000, 8); ledcAttachPin(MOTOR_L_PWM, CH_L);
    ledcSetup(CH_R, 20000, 8); ledcAttachPin(MOTOR_R_PWM, CH_R);
    motorStop();

    // Encoders
    pinMode(ENC_L_PIN, INPUT);
    pinMode(ENC_R_PIN, INPUT);
    attachInterrupt(digitalPinToInterrupt(ENC_L_PIN), isrEncL, RISING);
    attachInterrupt(digitalPinToInterrupt(ENC_R_PIN), isrEncR, RISING);

    // Ultrasonic
    pinMode(TRIG_PIN, OUTPUT);
    pinMode(ECHO_PIN, INPUT);

    // LEDs
    FastLED.addLeds<WS2812B, LED_PIN, GRB>(leds, NUM_LEDS);
    FastLED.setBrightness(100);
    setLEDs(CRGB::Purple);   // boot colour
    delay(300);
    setLEDs(CRGB::Black);

    // WiFi
    connectWiFi();

    // WebSocket
    connectWebSocket();
}

// ── Loop ───────────────────────────────────────────────────────
void loop() {
    // Maintain WebSocket connection
    if (ws.available()) {
        ws.poll();
    } else {
        // Auto-reconnect
        delay(2000);
        Serial.println("[WS] Reconnecting...");
        connectWebSocket();
    }

    // Periodic telemetry
    if (registered && !executing && millis() - lastTelemetry > TELEMETRY_INTERVAL) {
        sendTelemetry();
        lastTelemetry = millis();
    }
}
