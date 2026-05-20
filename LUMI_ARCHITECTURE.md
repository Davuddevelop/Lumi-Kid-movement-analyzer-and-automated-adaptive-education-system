# LUMI — Futuristic AI Smart Table Platform
## Complete System Architecture & Product Design Document

> "Where LEGO meets Tesla, Pixar, Iron Man, and Duolingo."
> Target: Ages 4–12 | Physical + Digital | AI-First | Child-Safe

---

## TABLE OF CONTENTS

1. [Vision & Product Philosophy](#1-vision--product-philosophy)
2. [System Overview Map](#2-system-overview-map)
3. [Hardware Architecture](#3-hardware-architecture)
4. [Software Architecture](#4-software-architecture)
5. [AI Engine Architecture](#5-ai-engine-architecture)
6. [Computer Vision System](#6-computer-vision-system)
7. [Child Interface (UI/UX)](#7-child-interface-uiux)
8. [Parent Dashboard](#8-parent-dashboard)
9. [AI Avatar Companion — "Lumi"](#9-ai-avatar-companion--lumi)
10. [Game Engine & Game Library](#10-game-engine--game-library)
11. [Robotics System](#11-robotics-system)
12. [Educational Intelligence System](#12-educational-intelligence-system)
13. [Emotion & Personality Engine](#13-emotion--personality-engine)
14. [Gamification Architecture](#14-gamification-architecture)
15. [Database Architecture](#15-database-architecture)
16. [API Architecture](#16-api-architecture)
17. [Real-Time Synchronization System](#17-real-time-synchronization-system)
18. [Cloud Infrastructure](#18-cloud-infrastructure)
19. [Safety Architecture](#19-safety-architecture)
20. [Community & Multiplayer System](#20-community--multiplayer-system)
21. [AI Training Pipeline](#21-ai-training-pipeline)
22. [Monetization Strategy](#22-monetization-strategy)
23. [School Integration Strategy](#23-school-integration-strategy)
24. [MVP Roadmap](#24-mvp-roadmap)
25. [Scaling Strategy](#25-scaling-strategy)
26. [Child Psychology Design Principles](#26-child-psychology-design-principles)
27. [Tech Stack](#27-tech-stack)

---

## 1. VISION & PRODUCT PHILOSOPHY

### Core Thesis

Children aged 4–12 learn best through **tangible, physical play**. The screen-first era of education (iPads, apps, Scratch) misses a critical developmental window — the child's need to touch, build, and interact with the real world.

**Lumi** inverts this model. The **physical world IS the interface**. A child builds with LEGO bricks on a smart table. The table's AI sees what they built, understands their intent, and responds — through story, robot movement, games, and emotional feedback — in real time.

The screen becomes a **mirror of physical creation**, not a replacement for it.

### Design Pillars

| Pillar | Meaning |
|--------|---------|
| **Physical-First** | The table surface is the primary input, not a touchscreen |
| **Emotionally Aware** | The system reads the child's face, posture, and voice |
| **Radically Simple** | A 4-year-old should understand it within 60 seconds |
| **Developmentally Honest** | Features match cognitive stages, not age labels |
| **Parent-Transparent** | Every insight the AI generates is shared with parents |
| **School-Ready** | Multi-student, teacher-manageable, curriculum-aligned |
| **Safe by Default** | Privacy, content safety, and physical safety are non-negotiable |

### Age Segmentation

| Segment | Age | Cognitive Stage | Primary Features |
|---------|-----|----------------|-----------------|
| **Explorers** | 4–5 | Preoperational | Colors, robot movement, simple sequences |
| **Builders** | 6–7 | Early Concrete | Logic sequences, basic loops, storytelling |
| **Creators** | 8–9 | Concrete Operational | Puzzles, strategy, coding concepts, teamwork |
| **Innovators** | 10–12 | Formal Operational | Advanced logic, AI interaction, leadership games |

---

## 2. SYSTEM OVERVIEW MAP

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          LUMI PLATFORM ECOSYSTEM                         │
│                                                                           │
│  ┌─────────────────────┐         ┌──────────────────────────────────┐   │
│  │   SMART TABLE       │◄────────│        AI BRAIN (Cloud)          │   │
│  │   HARDWARE LAYER    │────────►│  ┌──────────┐  ┌──────────────┐ │   │
│  │                     │         │  │ Vision AI│  │ Emotion AI   │ │   │
│  │  • 4 AI Cameras     │         │  └──────────┘  └──────────────┘ │   │
│  │  • RGB Surface      │         │  ┌──────────┐  ┌──────────────┐ │   │
│  │  • Sensors          │         │  │ NLP/Voice│  │ Learning AI  │ │   │
│  │  • Microphones      │         │  └──────────┘  └──────────────┘ │   │
│  │  • Speakers         │         │  ┌──────────┐  ┌──────────────┐ │   │
│  │  • Robot Modules    │         │  │ Game AI  │  │ Analytics AI │ │   │
│  └──────────┬──────────┘         │  └──────────┘  └──────────────┘ │   │
│             │                    └──────────────────────────────────┘   │
│             │                                   │                        │
│  ┌──────────▼──────────┐         ┌─────────────▼──────────────────┐   │
│  │   CHILD INTERFACE   │         │        PARENT DASHBOARD         │   │
│  │   (Tablet/Display)  │         │        (Mobile/Web App)         │   │
│  │                     │         │                                  │   │
│  │  • Lumi Avatar      │         │  • Development Reports          │   │
│  │  • Game Board       │         │  • Emotion Analytics            │   │
│  │  • Story Mode       │         │  • Learning Insights            │   │
│  │  • Missions         │         │  • AI Recommendations           │   │
│  │  • Progress Map     │         │  • Session Recordings           │   │
│  └─────────────────────┘         └──────────────────────────────────┘  │
│                                                                           │
│  ┌─────────────────────┐         ┌──────────────────────────────────┐  │
│  │   TEACHER CONSOLE   │         │     COMMUNITY / MULTIPLAYER      │  │
│  │                     │         │                                   │  │
│  │  • Class Management │         │  • Safe Social Layer             │  │
│  │  • Curriculum Tools │         │  • Team Challenges               │  │
│  │  • Analytics View   │         │  • Leaderboards                  │  │
│  │  • Mission Creator  │         │  • Shared Builds Gallery         │  │
│  └─────────────────────┘         └──────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. HARDWARE ARCHITECTURE

### 3.1 Smart Table — Physical Design

```
┌─────────────────────────────────────────────────────┐
│                   TOP VIEW                           │
│  ┌───────────────────────────────────────────────┐  │
│  │  CAM1                           CAM2          │  │
│  │   ◉                               ◉           │  │
│  │                                               │  │
│  │         LEGO BUILD SURFACE                   │  │
│  │         (RGB-lit, 60x90cm grid)              │  │
│  │                                               │  │
│  │   ◉                               ◉           │  │
│  │  CAM3                           CAM4          │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
│  ┌────────────┐         ┌──────────────────────┐    │
│  │   TABLET   │         │   ROBOT DOCK AREA    │    │
│  │  (Display) │         │   (charging + park)  │    │
│  └────────────┘         └──────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### 3.2 Hardware Component Stack

**Processing Unit**
- Raspberry Pi 5 (8GB) — local AI inference, hardware control
- NVIDIA Jetson Orin Nano (optional) — heavy CV workloads
- Dedicated GPU module for real-time vision processing

**Camera System**
- 4× wide-angle 12MP AI cameras (overhead, 4-corner mount)
- 1× face-tracking camera (child-facing, emotional analysis)
- Infrared depth sensor (posture/distance detection)
- All cameras: 60fps, low-latency USB3 / CSI connection

**Surface & Lighting**
- 60×90cm LEGO-compatible baseplate surface
- RGB LED matrix underneath (addressable, zone-controllable)
- Reactive lighting responds to game events, emotions, achievements
- Anti-glare tempered glass overlay

**Sensors**
- Capacitive touch sensors (table edges)
- Pressure sensors (detect block placement zones)
- IMU sensor (table tilt/movement detection)
- Proximity sensors (child detection, auto wake)
- Temperature/ambient light sensors (eye strain prevention)

**Audio System**
- 4× directional microphones (360° voice capture, noise cancellation)
- 2× stereo speakers with subwoofer (spatial audio)
- Voice activity detection chipset

**Connectivity**
- WiFi 6E + Bluetooth 5.3
- USB-C hub (robot connection, accessories)
- Ethernet port (school/enterprise)
- Optional: 5G module

**Display Integration**
- 13" tablet slot (side-mounted, child eye level)
- HDMI out (classroom projector / TV connection)
- Optional: short-throw projector mount for surface projection

**Robot Interface**
- 2× robot charging dock ports
- USB serial / BLE connection to robots
- Magnetic robot detection sensors

### 3.3 Robot Hardware

**Lumi-Bot (Primary Robot)**
- Arduino Mega 2560 + ESP32 (WiFi/BLE)
- DC motors with encoders (precise movement)
- Ultrasonic sensors (obstacle detection)
- Color sensor (line following)
- RGB LED ring (emotional expression)
- Servo arms (optional: block manipulation)
- LiPo battery (2h continuous use)
- LEGO Technic compatible mounting

**Lumi-Bot Companion (Secondary)**
- Smaller, simpler — for multiplayer sessions
- Bluetooth-only (shorter range)

---

## 4. SOFTWARE ARCHITECTURE

### 4.1 High-Level Software Stack

```
┌──────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                         │
│  Child UI (React/Next.js)  │  Parent App (React Native)  │
│  Teacher Console (Next.js) │  Admin Panel (Next.js)      │
└───────────────────────────┬──────────────────────────────┘
                            │ WebSocket / REST / GraphQL
┌───────────────────────────▼──────────────────────────────┐
│                    API GATEWAY LAYER                       │
│   Kong / AWS API Gateway — Auth, Rate Limiting, Routing   │
└───────────┬──────────────────────────────────────────────┘
            │
┌───────────▼──────────────────────────────────────────────┐
│                  MICROSERVICES LAYER                       │
│                                                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │ Auth     │ │ Session  │ │ Game     │ │ Analytics  │  │
│  │ Service  │ │ Service  │ │ Service  │ │ Service    │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │ Avatar   │ │ Mission  │ │ Robot    │ │ Report     │  │
│  │ Service  │ │ Service  │ │ Service  │ │ Service    │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │ Vision   │ │ Emotion  │ │ Learning │ │ Community  │  │
│  │ Service  │ │ Service  │ │ Service  │ │ Service    │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘  │
└───────────┬──────────────────────────────────────────────┘
            │
┌───────────▼──────────────────────────────────────────────┐
│                    AI ENGINE LAYER                         │
│  Vision AI │ Emotion AI │ NLP │ Learning AI │ Game AI    │
└───────────┬──────────────────────────────────────────────┘
            │
┌───────────▼──────────────────────────────────────────────┐
│                  DATA LAYER                               │
│  PostgreSQL │ Redis │ TimescaleDB │ S3 │ Pinecone (vector)│
└───────────────────────────────────────────────────────────┘
```

### 4.2 Local Edge Layer (On-Table Raspberry Pi)

```python
# Edge services running on the smart table hardware
edge_services = {
    "camera_daemon":      "Captures frames from all 4 cameras at 30fps",
    "vision_local":       "Runs lightweight YOLO model for real-time detection",
    "audio_daemon":       "Captures and streams voice with VAD",
    "robot_controller":   "Serial/BLE bridge to robot hardware",
    "sensor_aggregator":  "Collects all sensor data, publishes to MQTT",
    "lighting_controller":"Controls RGB surface LEDs",
    "sync_agent":         "Buffers data, syncs to cloud when connected",
    "local_ai_cache":     "Caches model responses for offline use",
}
```

### 4.3 Service Communication

- **MQTT** — Hardware events (sensors, cameras) to edge services
- **WebSocket** — Real-time game state to child UI
- **gRPC** — Microservice-to-microservice (low latency)
- **REST** — Parent/teacher dashboard API calls
- **GraphQL** — Complex analytics queries (parent reports)
- **Redis Pub/Sub** — Real-time events across services

---

## 5. AI ENGINE ARCHITECTURE

### 5.1 AI Engine Overview

```
                    ┌─────────────────────────────┐
                    │       MASTER AI ORCHESTRATOR  │
                    │   (routes inputs to engines)  │
                    └──────────────┬──────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                           │
┌───────▼──────┐        ┌──────────▼──────┐        ┌─────────▼───────┐
│  VISION AI   │        │  EMOTION AI     │        │  LEARNING AI    │
│              │        │                 │        │                 │
│ • LEGO detect│        │ • Face mesh     │        │ • Skill model   │
│ • Structure  │        │ • Voice tone    │        │ • Difficulty    │
│ • Gesture    │        │ • Posture       │        │ • Path planning │
│ • Posture    │        │ • Sentiment     │        │ • Weakness det. │
└──────────────┘        └─────────────────┘        └─────────────────┘
        │                          │                           │
        └──────────────────────────▼───────────────────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │      SYNTHESIS ENGINE        │
                    │  (merges all signals into    │
                    │   one child state model)     │
                    └──────────────┬──────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                     │
   ┌──────────▼──────┐  ┌─────────▼──────┐  ┌─────────▼──────┐
   │  AVATAR ENGINE  │  │  GAME ENGINE   │  │ REPORT ENGINE  │
   │  (what Lumi     │  │  (what the     │  │ (what parents  │
   │   says/does)    │  │   game does)   │  │  are told)     │
   └─────────────────┘  └────────────────┘  └────────────────┘
```

### 5.2 Child State Model (Real-Time)

```python
class ChildState:
    # Identity
    child_id: str
    session_id: str
    age_segment: Literal["explorer", "builder", "creator", "innovator"]

    # Cognitive metrics (0-100, updated every 30s)
    focus_level: float
    engagement_level: float
    frustration_level: float
    confidence_level: float
    curiosity_level: float

    # Behavioral signals (updated per action)
    reaction_speed_ms: float
    decision_consistency: float
    risk_taking_score: float
    help_seeking_pattern: str        # "never" | "appropriate" | "excessive"
    persistence_score: float
    distraction_events: int

    # Emotional state (updated per camera frame)
    primary_emotion: str             # joy/frustration/confusion/boredom/neutral
    emotion_confidence: float
    posture_quality: str             # good/slouching/too_close/away
    eye_contact_score: float

    # Learning metrics (cumulative)
    current_skill_level: dict        # per skill area
    learning_velocity: float         # how fast skills are growing
    learning_style: str              # visual/kinesthetic/auditory
    dominant_intelligence: str       # spatial/logical/linguistic/etc

    # Session context
    current_game: str
    current_mission: str
    blocks_placed_count: int
    errors_made: int
    hints_requested: int
    time_on_task_sec: int
```

### 5.3 Adaptive Intelligence Loop

```
Every 30 seconds:
1. Collect → all sensor/camera/interaction data
2. Analyze → run through all AI engines
3. Synthesize → update ChildState model
4. Decide → what should happen next
   a. Should difficulty increase/decrease?
   b. Should Lumi avatar intervene?
   c. Should a hint be offered?
   d. Should the game type change?
   e. Should a break be suggested?
5. Act → trigger appropriate response
6. Log → record everything for analytics
7. Learn → update child's long-term profile
```

---

## 6. COMPUTER VISION SYSTEM

### 6.1 Vision Pipeline

```
4 Cameras → Frame Merger → Preprocessing → Detection Engine
                                              │
              ┌───────────────────────────────┤
              │                               │
     ┌────────▼────────┐           ┌─────────▼────────┐
     │  LEGO DETECTION │           │  CHILD DETECTION  │
     │                 │           │                   │
     │ • Color segment │           │ • Face landmark   │
     │ • Shape classif │           │ • Pose estimation │
     │ • Structure type│           │ • Eye tracking    │
     │ • 3D reconstruct│           │ • Emotion classif │
     │ • Change detect │           │ • Gesture recogn  │
     └────────┬────────┘           └─────────┬─────────┘
              │                              │
              └──────────────┬───────────────┘
                             │
                    ┌────────▼────────┐
                    │  SCENE GRAPH    │
                    │  GENERATOR      │
                    │                 │
                    │ "Child (age ~6) │
                    │  built a tower  │
                    │  5 blocks tall  │
                    │  emotion: joy   │
                    │  focus: high"   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  GAME REACTOR   │
                    │  (what happens  │
                    │   in response)  │
                    └─────────────────┘
```

### 6.2 LEGO Structure Recognition

**Detection Layers**:

```python
class LEGODetectionEngine:

    def detect_structure_type(self, frame) -> StructureType:
        """
        Recognized structure types:
        - tower (vertical stacking, height analysis)
        - wall (horizontal linear, width analysis)
        - enclosure (closed shape, area analysis)
        - bridge (support + span pattern)
        - road/path (sequential connected segments)
        - vehicle (wheels + body pattern)
        - house (walls + roof angle)
        - symmetrical (mirror detection)
        - freeform (creative / no category)
        """

    def analyze_build_quality(self, structure) -> BuildQuality:
        """
        Metrics:
        - structural_stability (simulated)
        - color_harmony (palette analysis)
        - symmetry_score
        - complexity_score
        - creativity_index (vs. common patterns)
        - instruction_adherence (if following a mission)
        """

    def detect_color_sequence(self, frame) -> List[Color]:
        """
        For block-command mode (existing functionality, enhanced):
        - HSV range detection with auto-calibration
        - Spatial ordering (left-to-right, Z-depth aware)
        - Confidence scoring per detection
        """

    def track_build_progress(self, frames: List[Frame]) -> BuildTimeline:
        """
        Time-series analysis of build evolution:
        - When each block was placed
        - Hesitation moments (block held, not placed)
        - Correction events (block removed and replaced)
        - Build velocity (blocks per minute)
        """
```

### 6.3 Emotion Detection Pipeline

```python
class EmotionDetectionEngine:

    # Model: MediaPipe Face Mesh + custom emotion classifier
    # Input: Face camera frames at 15fps
    # Latency target: <100ms

    facial_action_units = [
        "AU1",   # inner brow raise (worry/concern)
        "AU4",   # brow lowerer (frustration/concentration)
        "AU6",   # cheek raiser (genuine smile)
        "AU12",  # lip corner puller (smile)
        "AU17",  # chin raiser (doubt)
        "AU20",  # lip stretcher (fear/stress)
        "AU25",  # lips part (engagement/surprise)
        "AU43",  # eyes closed (fatigue/boredom)
    ]

    emotion_outputs = {
        "joy":          0.0-1.0,
        "frustration":  0.0-1.0,
        "confusion":    0.0-1.0,
        "boredom":      0.0-1.0,
        "concentration":0.0-1.0,
        "surprise":     0.0-1.0,
        "neutral":      0.0-1.0,
    }

    posture_signals = {
        "leaning_in":       "high engagement",
        "leaning_back":     "low engagement / boredom",
        "head_down":        "frustration / fatigue",
        "fidgeting":        "distraction / anxiety",
        "too_close":        "eye strain risk — trigger warning",
        "looking_away":     "distraction event — log it",
    }
```

### 6.4 Gesture Recognition

```python
gestures = {
    "thumbs_up":    "positive confirmation",
    "thumbs_down":  "negative / dislike",
    "wave":         "greeting / call avatar",
    "point":        "select / indicate direction",
    "open_palm":    "stop / pause",
    "fist_pump":    "celebration (auto-detected post-win)",
    "scratch_head": "confusion signal",
    "clap":         "celebration — trigger confetti",
}
```

---

## 7. CHILD INTERFACE (UI/UX)

### 7.1 Design Language

**Visual Identity**: Holographic-soft. Not harsh cyberpunk — warm neon. Think: Pixar's futuristic world rendered in the palette of a Northern Lights sky. Glowing edges, particle effects, soft shadows, rounded corners. Nothing sharp. Nothing scary.

**Typography**:
- Primary: Custom rounded display font (0% sharp angles)
- Body: Nunito / Baloo — scientifically shown to be most readable for ages 5-9
- All text at minimum 24px
- Icon-first: every text label has a corresponding icon

**Color System**:
```
--lumi-primary:    #6C63FF  (cosmic violet)
--lumi-secondary:  #00D4FF  (electric cyan)
--lumi-success:    #00E87A  (achievement green)
--lumi-warning:    #FFB800  (caution amber)
--lumi-energy:     #FF6B6B  (energy coral)
--lumi-bg-dark:    #0A0E1A  (deep space)
--lumi-bg-mid:     #111827  (nebula dark)
--lumi-surface:    #1A2235  (card surface)
--lumi-glow:       rgba(108, 99, 255, 0.4)
```

**Themes** (child-selectable):
- **Space Mode** — Dark, stars, planetary elements (default)
- **Ocean Mode** — Deep blues, glowing fish, bubbles
- **Forest Mode** — Greens, fireflies, magical creatures
- **Candy Mode** — Pastel, soft pinks/yellows (younger children)
- **Superhero Mode** — Bold colors, power effects

### 7.2 Main Dashboard Layout

```
┌─────────────────────────────────────────────────────────┐
│  ⭐ LUMI                    🔔  👤 Zara  Lv.12   🌙     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐   ┌──────────────┐  ┌─────────────┐  │
│  │              │   │              │  │             │  │
│  │   LUMI BOT   │   │   TODAY'S    │  │   MY       │  │
│  │  (animated   │   │  MISSION     │  │   PLANET   │  │
│  │   avatar)    │   │   CARD       │  │  (XP map)  │  │
│  │              │   │              │  │             │  │
│  └──────────────┘   └──────────────┘  └─────────────┘  │
│                                                          │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌──────────┐  │
│  │ 🎮 PLAY  │  │📖 LEARN │  │🏆BUILD  │  │👥 TEAM  │  │
│  │         │  │         │  │         │  │         │  │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘  │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │  ✨ Daily Streak: 7 days  🔥  │  ⚡ XP: 2,840  │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 7.3 Key Child UI Screens

**1. World Map (Progress Visualization)**
- 3D isometric world that grows as the child levels up
- Each unlocked zone becomes a physical place (forest, city, space station)
- Stars collected from missions appear as stars in the sky
- Zero menus — navigation is walking through the world

**2. Mission Screen**
- One mission displayed at a time (no list overwhelming)
- Large animated preview of what to build
- Lumi Bot explains the mission vocally (no reading required)
- Three difficulty dots (auto-selected based on current level)
- Giant "LET'S GO!" button

**3. Live Game Board**
- Full-screen, no chrome/UI clutter during play
- Robot position shown with trail effect
- Obstacle glow (pulse red when near)
- Goal star pulses gold
- Lumi Bot floats in corner, reacts emotionally

**4. Achievement Explosion Screen**
- Full-screen particle burst
- Badge flies in with 3D spin
- Audio: custom sound FX + Lumi celebrates
- Share button (parent-mediated)
- Lasts 5 seconds, auto-dismisses (no button mash required)

**5. Avatar Customization**
- Drag-to-dress interaction (no menus)
- Unlocks tied to achievements (not purchases — except in premium tier)
- Live 3D preview of avatar
- Avatar appearance syncs to physical robot's LED pattern

### 7.4 Accessibility

- **No text required** for ages 4-6 — full icon + voice mode
- **Colorblind modes** — shape-coded blocks in addition to color
- **High contrast mode**
- **Font size adjustable** (parent-controlled)
- **Audio descriptions** for all visual elements
- **Motor accessibility** — large touch targets (minimum 60×60px), no small gestures
- **Distraction reduction mode** — simplified UI, fewer animations

### 7.5 Focus & Study Mode

```
Focus Mode Features:
- Pomodoro timer (visual, not numeric — sand glass / charging bar)
- Distraction detection (camera notices child looking away)
- Gentle audio cue when distraction detected (not alarming)
- Break suggestions with 2-minute movement game
- "Deep Work" badge for sustained 15+ minute focus sessions
- Focus score tracked and shown to parents
```

---

## 8. PARENT DASHBOARD

### 8.1 Dashboard Architecture

**Three-Level Hierarchy**:
```
Parent App
├── Today's Summary (quick glance)
│   ├── Time played
│   ├── Mood arc (how they felt during session)
│   ├── Missions completed
│   └── Notable moments (first-try wins, frustration events)
│
├── Development Reports (weekly/monthly)
│   ├── Cognitive Skills Radar Chart
│   ├── Emotional Wellbeing Timeline
│   ├── Focus Quality Heatmap
│   ├── Learning Velocity Graph
│   └── Peer Comparison (anonymized, opt-in)
│
└── AI Insights (expert-level)
    ├── Personalized Recommendations
    ├── Potential Interest Areas
    ├── Developmental Flags (if any)
    └── Next-Step Activities
```

### 8.2 Analytics Cards

```
┌─────────────────────────────────────────────────────────┐
│  ZARA'S WEEKLY REPORT                    Week 22, 2026  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  🎯 Focus Score: 78/100  ▲+12 vs last week             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━          │
│                                                          │
│  📊 SKILLS RADAR                                        │
│     Spatial Logic  ████████░░ 82%                       │
│     Problem Solving████████░░ 79%                       │
│     Creativity     ███████░░░ 71%                        │
│     Persistence    █████░░░░░ 55%  ← needs attention    │
│     Teamwork       ██████░░░░ 63%                       │
│     Math Thinking  ███████░░░ 70%                       │
│                                                          │
│  😊 EMOTIONAL PROFILE                                   │
│     Mostly joyful (68% of session time)                 │
│     2 frustration peaks (level 8, level 12)             │
│     Recovery time: avg 2.3 minutes (healthy)           │
│                                                          │
│  🤖 AI INSIGHT                                          │
│  "Zara shows strong spatial reasoning but tends to      │
│   quit puzzles before trying all options. Try the       │
│   Persistence Challenge missions this week."            │
│                                                          │
│  [View Full Report]  [Share with Teacher]  [Settings]  │
└─────────────────────────────────────────────────────────┘
```

### 8.3 Notification Types

```python
parent_notifications = {
    "achievement":    "🏆 Zara just earned the 'Loop Master' badge!",
    "milestone":      "📈 Zara reached Level 10 — top 15% of her age group",
    "concern":        "⚠️ Zara seemed frustrated during today's session (18 min)",
    "insight":        "💡 We noticed Zara is showing strong logical thinking patterns",
    "session_end":    "✅ Today's session: 34 min, 3 missions, mood: happy",
    "streak_risk":    "🔥 Zara's 12-day streak ends tonight — 8pm reminder set",
    "recommendation": "🎯 New mission unlocked that matches Zara's learning style",
    "report_ready":   "📊 This week's development report is ready to view",
}
```

### 8.4 Screen Time & Safety Controls

- **Session time limits** (hard stop with wind-down warning)
- **Schedule controls** (active hours, school night lockout)
- **Content review** (parent can see all mission content)
- **Camera data control** (choose what's stored vs. processed-only)
- **Download all data** (GDPR/COPPA compliance)
- **Delete account** (immediate, no hoops)

---

## 9. AI AVATAR COMPANION — "LUMI"

### 9.1 Avatar Personality Model

Lumi is not a chatbot. Lumi is a companion character with persistent memory, emotional intelligence, and a character arc that evolves with the child.

**Core Personality Traits**:
- Curious, enthusiastic, warm
- Never sarcastic, never dismissive
- Makes mistakes sometimes (relatable, not perfect)
- Has its own likes/dislikes (builds relationship)
- References past sessions ("Remember when you built that tower?")

**Personality Modes** (auto-adjusted to child state):
```python
class LumiPersonality:
    # Base modes
    COACH     = "supportive, goal-oriented, celebrates effort"
    BUDDY     = "casual, fun, peer-like, shares excitement"
    TEACHER   = "curious, question-based, Socratic"
    CHEERLEADER = "high energy, celebratory, motivational"
    GENTLE    = "calm, reassuring, used during frustration"
    STORY_TELLER = "dramatic, narrative, immersive"

    # Auto-switches based on:
    # - child's current emotion
    # - task type
    # - time of day
    # - child's preference history
```

### 9.2 Avatar Interaction System

```python
class LumiInteractionSystem:

    def generate_response(self, context: ChildState) -> LumiResponse:
        """
        Response generation pipeline:
        1. Read current ChildState
        2. Select appropriate personality mode
        3. Choose interaction type:
           - Active: Lumi speaks first (proactive)
           - Reactive: Lumi responds to child action
           - Silent: Lumi just reacts emotionally (no words)
        4. Select/generate message
        5. Choose animation
        6. Set audio tone/speed (slower for frustration)
        7. Optional: trigger hardware (robot LED, table lighting)
        """

    interaction_triggers = {
        # Proactive interventions
        "30s_silence":       "gently check in",
        "3_consecutive_fails":"offer encouragement + hint",
        "joy_detected":      "celebrate together",
        "distraction_event": "gentle refocus",
        "build_recognized":  "react to what was built",
        "level_up":          "major celebration sequence",
        "session_start":     "personalized greeting",
        "session_end":       "recap + tomorrow preview",

        # Reactive
        "block_placed":      "subtle positive acknowledgment",
        "robot_wins":        "victory animation",
        "robot_crashes":     "empathetic reaction, not criticism",
        "hint_requested":    "teach, don't just tell",
        "voice_input":       "active listening, then respond",
    }
```

### 9.3 Voice System

**Text-to-Speech**:
- Custom Lumi voice (trained, not generic TTS)
- Age-appropriate vocabulary library (2,000 words for age 5-6, 5,000 for age 10+)
- Emotional prosody (voice changes with emotion)
- Speed adjustment (slower when child is frustrated)
- Multiple languages supported

**Speech Recognition**:
- On-device recognition (privacy — no cloud processing of child voice)
- Child-speech model (trained on children's speech patterns)
- Intent classification over literal transcription
- Fallback: button-based answer system

**Voice Vocabulary Age Limits**:
```python
vocabulary_by_age = {
    "5-6": {
        "max_sentence_length": 8,     # words
        "concept_complexity": "concrete_only",
        "question_type": "yes_no_or_choice",
        "vocabulary_tier": "tier_1",  # common everyday words
    },
    "7-8": {
        "max_sentence_length": 14,
        "concept_complexity": "semi_abstract",
        "question_type": "open_with_scaffolding",
        "vocabulary_tier": "tier_2",  # academic vocabulary
    },
    "9-12": {
        "max_sentence_length": 20,
        "concept_complexity": "abstract_ok",
        "question_type": "open_ended",
        "vocabulary_tier": "tier_3",  # domain vocabulary
    },
}
```

---

## 10. GAME ENGINE & GAME LIBRARY

### 10.1 Game Engine Architecture

```python
class LumiGameEngine:

    game_loop_hz: int = 60           # target frame rate
    physics_hz: int = 120            # physics simulation rate
    ai_update_hz: float = 0.5        # AI analysis rate (every 2s)

    def run_game_loop(self):
        while session_active:
            self.process_input()       # camera, voice, touch
            self.update_physics()      # robot/entity movement
            self.update_ai()           # child state analysis
            self.update_game_state()   # mission logic
            self.generate_feedback()   # lumi reactions
            self.render()              # update display
            self.log()                 # analytics

    def adapt_difficulty(self, child_state: ChildState):
        """
        Dynamic difficulty adjustment (DDA) runs every 60 seconds:
        - If frustration > 70%: reduce complexity, offer hint
        - If boredom > 60%: increase complexity, add challenge
        - If focus < 40%: shorten current task
        - If winning streak > 3: unlock harder variant
        """
```

### 10.2 Full Game Library

**Category 1: Robot & Movement**

| Game | Description | Age | Skills |
|------|-------------|-----|--------|
| **Line Follower** | Build a path with blocks, robot follows it | 5+ | Sequencing |
| **Robot Rescue** | Guide robot to save a trapped character | 5+ | Problem solving |
| **Traffic Sim** | Build roads, program traffic flow | 7+ | Systems thinking |
| **Target Striker** | Aim robot at targets with precision | 6+ | Spatial reasoning |
| **Robot Battle** | Two robots, strategic positioning | 8+ | Strategy |
| **Maze Master** | Build and solve your own maze | 7+ | Logic |
| **Remote Control Pro** | Timed precision driving challenge | 6+ | Motor skills |
| **Relay Race** | Pass an object robot-to-robot (multiplayer) | 6+ | Teamwork |

**Category 2: Puzzle & Logic**

| Game | Description | Age | Skills |
|------|-------------|-----|--------|
| **Puzzle Path Builder** | LEGO path must match algorithm | 6+ | Algorithmic thinking |
| **Pattern Repeat** | Recreate shown LEGO pattern | 5+ | Visual memory |
| **Block Sorter** | Sort blocks by property under time limit | 5+ | Classification |
| **Code Breaker** | Decode a sequence hidden in blocks | 8+ | Logic |
| **Escape Room** | Build your way out of scenarios | 9+ | Creative problem solving |
| **Bridge Builder** | Build bridge that holds virtual weight | 7+ | Engineering |
| **Mirror Mirror** | Build the mirror image | 6+ | Spatial rotation |
| **AI Decision** | Choose path, AI adapts — is it optimal? | 9+ | Decision trees |

**Category 3: Knowledge & Learning**

| Game | Description | Age | Skills |
|------|-------------|-----|--------|
| **Quiz Battle** | Answer questions, blocks are tokens | 6+ | Knowledge |
| **Math Blocks** | Physical blocks = math operations | 6+ | Arithmetic |
| **Word Builder** | Letter blocks → words → sentences | 6+ | Literacy |
| **Science Lab** | Build structures, test hypotheses | 8+ | Scientific method |
| **History Quest** | Recreate historical structures | 9+ | History |
| **Geo Challenge** | Build country/continent shapes | 7+ | Geography |
| **Music Blocks** | Color sequence = musical notes | 5+ | Music/Patterns |
| **Story Blocks** | Arrange blocks = story sequence | 5+ | Narrative thinking |

**Category 4: Creativity & Social**

| Game | Description | Age | Skills |
|------|-------------|-----|--------|
| **Free Build** | Open sandbox with AI analysis | 4+ | Creativity |
| **Team Tower** | Two players build together | 5+ | Collaboration |
| **Design Challenge** | Build to a creative brief | 7+ | Creative thinking |
| **Vote for Best** | Community rates builds (moderated) | 8+ | Social/aesthetic |
| **Treasure Hunt** | Multi-session build hunt | 7+ | Persistence |
| **Imagination Machine** | Build anything, Lumi creates a story about it | 4+ | Imagination |
| **Emotion Architect** | Build how you feel | 5+ | Emotional expression |

**Category 5: Focus & Reflex**

| Game | Description | Age | Skills |
|------|-------------|-----|--------|
| **Time Challenge** | Complete build before timer | 6+ | Speed/accuracy |
| **Memory Match** | Remember and rebuild shown structure | 5+ | Working memory |
| **Attention Keeper** | Spot the change in block arrangement | 6+ | Attention |
| **Reflex Racer** | React to robot signal with correct block | 7+ | Reaction speed |
| **Focus Marathon** | Sustained 10-min challenge | 8+ | Executive function |

### 10.3 Story Mode

```
STORY STRUCTURE:
└── World (e.g., "Space Station Lumi")
    ├── Chapter 1: Arrival
    │   ├── Episode 1: "First Mission" (tutorial)
    │   ├── Episode 2: "The Lost Robot"
    │   └── Episode 3: "Crystal Caves"
    ├── Chapter 2: The Challenge
    │   ├── ...
    └── Chapter 3: The Grand Build
        └── ...

Each episode:
- 3D animated cutscene (30-60 sec, voiced)
- 2-4 gameplay challenges
- Character interaction with Lumi
- Collectible unlock
- Cliffhanger → motivation for next session

Story branches based on:
- Child's dominant learning style
- Current skill focus
- Emotional history
- Session frequency
```

---

## 11. ROBOTICS SYSTEM

### 11.1 Robot Control Architecture

```python
class RoboticsSystem:

    # Communication Stack
    primary_comm: str = "WebSocket over WiFi"  # <10ms latency
    fallback_comm: str = "Bluetooth BLE"        # offline mode
    emergency_stop: str = "hardware button + voice 'STOP'"

    # Movement Engine
    movement_modes = {
        "grid":       "discrete steps on calibrated grid",
        "continuous": "smooth pathfinding movement",
        "precise":    "encoder-feedback exact positioning",
        "creative":   "free movement, obstacle avoidance",
    }

    # Intelligence Layers
    local_intelligence = [
        "obstacle_avoidance",    # runs on robot MCU
        "line_following",        # sensor-based, no WiFi needed
        "emergency_stop",        # always active
        "battery_management",    # auto-dock when low
    ]

    cloud_intelligence = [
        "pathfinding",           # A* with dynamic obstacles
        "mission_execution",     # mission command sequences
        "story_reactions",       # narrative-driven movement
        "personality_expression",# LED patterns, movement style
    ]
```

### 11.2 Robot Interaction Modes

**Educational Mode**: Robot executes child's block sequence step-by-step with pause capability for teaching moments.

**Story Mode**: Robot becomes a character — moves dramatically, pauses for effect, expresses emotion through LED ring and movement style.

**Battle Mode**: Two robots compete. Deterministic enough to be fair, variable enough to be exciting.

**Free Roam**: Robot explores autonomously, child can redirect with gestures or voice.

### 11.3 Robot Safety System

```python
robot_safety_rules = [
    "max_speed: 15cm/s (safe for table edge)",
    "table_edge_detection: mandatory, cannot disable",
    "obstacle_stop_distance: 3cm minimum",
    "voice_stop: 'STOP' or 'LUMI STOP' triggers immediate halt",
    "physical_button: red mushroom stop on robot body",
    "battery_critical: auto-dock at 15%, shutdown at 5%",
    "fall_detection: accelerometer triggers safe stop",
    "child_proximity: slows to 5cm/s if hand detected within 10cm",
]
```

---

## 12. EDUCATIONAL INTELLIGENCE SYSTEM

### 12.1 Skill Tree Architecture

```
LUMI SKILL TREE
│
├── 🧠 COGNITIVE
│   ├── Logical Thinking (5 tiers)
│   ├── Spatial Reasoning (5 tiers)
│   ├── Pattern Recognition (5 tiers)
│   ├── Working Memory (5 tiers)
│   └── Analytical Thinking (5 tiers)
│
├── 💡 COMPUTATIONAL
│   ├── Sequencing (5 tiers)
│   ├── Loops & Repetition (5 tiers)
│   ├── Conditionals (5 tiers)
│   ├── Problem Decomposition (5 tiers)
│   └── Debugging (5 tiers)
│
├── 🎨 CREATIVE
│   ├── Design Thinking (5 tiers)
│   ├── Storytelling (5 tiers)
│   ├── Innovation (5 tiers)
│   ├── Aesthetic Sense (5 tiers)
│   └── Imagination (5 tiers)
│
├── 👥 SOCIAL
│   ├── Teamwork (5 tiers)
│   ├── Leadership (5 tiers)
│   ├── Communication (5 tiers)
│   ├── Empathy (5 tiers)
│   └── Conflict Resolution (5 tiers)
│
└── 💪 CHARACTER
    ├── Persistence (5 tiers)
    ├── Risk-Taking (5 tiers)
    ├── Self-Regulation (5 tiers)
    ├── Growth Mindset (5 tiers)
    └── Curiosity (5 tiers)
```

### 12.2 Adaptive Learning Engine

```python
class AdaptiveLearningEngine:

    def generate_learning_path(self, child: ChildProfile) -> LearningPath:
        """
        Inputs:
        - Current skill levels (all tree nodes)
        - Recent performance history (last 20 sessions)
        - Detected learning style (visual/kinesthetic/auditory)
        - Current emotional baseline
        - Parent goals (if set)
        - Age norms for comparison

        Algorithm:
        1. Identify weakest skill node (below age norm by >15%)
        2. Find games that specifically train that node
        3. Weight toward child's preferred game types
        4. Schedule in optimal sequence (novelty + spaced repetition)
        5. Insert mastery checks at intervals
        6. Re-evaluate every 5 sessions
        """

    def detect_learning_style(self, session_history: List[Session]) -> LearningStyle:
        """
        Signals:
        Visual:       Performs better with diagram previews, builds symmetrically
        Kinesthetic:  Higher engagement with physical block missions, moves a lot
        Auditory:     Responds faster when Lumi speaks, higher accuracy after voice hints
        Social:       Better performance in team modes vs. solo
        Logical:      Higher accuracy on sequential tasks, seeks patterns
        """

    def spaced_repetition_scheduler(self, skills: List[Skill]) -> Schedule:
        """
        Forgetting curve compensation:
        - New skill: review in 1 day
        - 1 review: next review in 3 days
        - 2 reviews: 1 week
        - 3+ reviews: 2 weeks
        - Mastered: monthly check
        """
```

### 12.3 AI-Generated Curriculum

```python
class CurriculumGenerator:

    def generate_weekly_plan(self, child: ChildProfile) -> WeeklyPlan:
        """
        Returns 5-day plan (school week) with:
        - Daily session duration (15-30 min based on age)
        - Primary skill focus per day
        - Game recommendations with rationale
        - Balance of solo / team / creative activities
        - Difficulty arc (easier Monday, peak Wednesday, review Friday)
        """

    def generate_mission(self, params: MissionParams) -> Mission:
        """
        AI-generated missions that are:
        - Aligned to current skill focus
        - Appropriately difficult (target: 70% success rate)
        - Narratively engaging (story context)
        - Buildable with available block sets
        """
```

---

## 13. EMOTION & PERSONALITY ENGINE

### 13.1 Real-Time Emotional Response System

```python
emotional_response_matrix = {
    # (child_emotion, game_context) -> system_response

    ("frustration", "mid_mission"): [
        "lumi_switches_to_gentle_mode",
        "table_lighting_softens_to_warm",
        "offer_hint_after_30s",
        "shorten_next_subtask",
        "log_frustration_event_for_parent",
    ],

    ("boredom", "early_mission"): [
        "add_optional_challenge_layer",
        "lumi_introduces_surprise_element",
        "unlock_bonus_content_early",
        "increase_difficulty_next_level",
    ],

    ("joy", "any"): [
        "lumi_celebrates_authentically",
        "table_lights_pulse_with_colors",
        "robot_does_victory_dance",
        "record_joy_peak_moment",
        "social_share_prompt_to_parent",
    ],

    ("confusion", "puzzle_mode"): [
        "lumi_asks_guiding_question",
        "highlight_relevant_blocks",
        "offer_tiered_hint_after_45s",
        "simplify_current_task_presentation",
    ],

    ("fatigue", "any"): [
        "suggest_break_gently",
        "offer_2min_movement_game",
        "dim_table_lights_slightly",
        "notify_parent_if_session_long",
    ],
}
```

### 13.2 Personality Profile Generation

```python
class PersonalityProfiler:
    """
    Over 10+ sessions, builds a personality model:

    Gardner's Multiple Intelligences detected:
    - Spatial (block structures, maze solving)
    - Logical-Mathematical (patterns, sequences)
    - Linguistic (story engagement, word games)
    - Bodily-Kinesthetic (robot games, reflex speed)
    - Musical (rhythm games, pattern music)
    - Interpersonal (team performance vs. solo)
    - Intrapersonal (self-regulation, hint-seeking behavior)
    - Naturalist (interest in themed builds: animals, nature)

    Big 5 Personality Traits (adapted for children):
    - Openness (tries new game types vs. sticks to favorites)
    - Conscientiousness (completion rate, tidiness of builds)
    - Extraversion (voice interaction volume, team preference)
    - Agreeableness (teamwork cooperation score)
    - Neuroticism (frustration frequency, recovery time)

    Output: plain-language parent report
    "Zara shows strong spatial intelligence and high openness.
     She prefers working alone but performs better in teams.
     She may benefit from creative leadership roles."
    """
```

---

## 14. GAMIFICATION ARCHITECTURE

### 14.1 XP & Level System

```python
xp_sources = {
    "mission_complete":          100,     # base
    "first_try_bonus":            50,     # no retries
    "speed_bonus":             10-50,     # based on time
    "efficiency_bonus":        10-30,     # blocks used vs. optimal
    "creativity_bonus":        10-40,     # vision AI scores build uniqueness
    "focus_bonus":             10-25,     # sustained attention reward
    "teamwork_bonus":          20-40,     # cooperation score
    "daily_streak":            25*day,    # compound daily
    "help_a_friend":              30,     # community interaction
    "parent_challenge":           50,     # parent-assigned task
}

level_thresholds = [
    # Level: XP Required, Title, Unlocks
    (1,    0,      "Spark",         "basic_skins"),
    (5,    1000,   "Builder",       "ocean_theme"),
    (10,   3000,   "Creator",       "robot_colors"),
    (15,   7000,   "Engineer",      "team_missions"),
    (20,   15000,  "Architect",     "story_chapter_3"),
    (30,   35000,  "Innovator",     "mentor_badge"),
    (50,   100000, "Lumi Master",   "legendary_avatar"),
]
```

### 14.2 Badge System

**Badge Categories** (50+ total badges):

```
🏆 ACHIEVEMENT BADGES
  First Steps, Mission Complete, Perfect Score,
  10-Mission Streak, Speed Demon, No-Hint Hero

🧠 SKILL BADGES
  Logic Star, Loop Master, Spatial Genius,
  Pattern Pro, Code Thinker, Math Whiz

❤️ CHARACTER BADGES
  Never Give Up, Team Player, Helper,
  Creative Spark, Brave Thinker, Kind Robot

🌟 LEGENDARY BADGES (rare, animated)
  Lumi Legend, Grand Architect, Story Master,
  The Innovator, Robot Whisperer
```

### 14.3 Daily Challenge System

```python
daily_challenge_types = [
    "speed_run":        "Complete mission in under X seconds",
    "no_hints":         "Finish without asking for help",
    "creativity":       "Build something never seen before",
    "team_up":          "Complete with a friend",
    "parent_join":      "Do this one with a parent",
    "skill_focus":      "Use only [specific block type]",
    "memory":           "Remember and rebuild this structure",
    "beat_yesterday":   "Beat your own best time",
]
```

### 14.4 Reward Economy

```python
reward_system = {
    "stars": {
        "earned_by": "mission completion quality",
        "spent_on": "avatar accessories (non-pay)",
        "max_per_mission": 3,
    },
    "crystals": {
        "earned_by": "daily challenges, streaks",
        "spent_on": "theme unlocks, robot skins",
        "bonus_from": "parent gifting",
    },
    "build_tokens": {
        "earned_by": "creative mode high scores",
        "spent_on": "community gallery feature posts",
        "purpose": "recognition currency",
    },
}
# Key principle: all meaningful content unlockable without payment.
# Premium is about aesthetics, not gameplay advantage.
```

---

## 15. DATABASE ARCHITECTURE

### 15.1 Schema Overview

```sql
-- CORE ENTITIES

CREATE TABLE children (
    id              UUID PRIMARY KEY,
    parent_id       UUID REFERENCES parents(id),
    display_name    VARCHAR(32),           -- first name only
    age_segment     VARCHAR(20),
    avatar_config   JSONB,
    created_at      TIMESTAMPTZ,
    last_active     TIMESTAMPTZ
);

CREATE TABLE sessions (
    id              UUID PRIMARY KEY,
    child_id        UUID REFERENCES children(id),
    table_device_id UUID,
    started_at      TIMESTAMPTZ,
    ended_at        TIMESTAMPTZ,
    duration_sec    INTEGER,
    focus_score     SMALLINT,              -- 0-100
    mood_arc        JSONB,                 -- [{t, emotion}]
    games_played    JSONB
);

CREATE TABLE mission_attempts (
    id              UUID PRIMARY KEY,
    session_id      UUID REFERENCES sessions(id),
    mission_id      UUID,
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    result          VARCHAR(20),           -- success/fail/abandoned
    attempts_count  SMALLINT,
    hints_used      SMALLINT,
    first_try_win   BOOLEAN,
    star_rating     SMALLINT,             -- 1-3
    efficiency_score SMALLINT,            -- 0-100
    commands_used   JSONB,
    error_log       JSONB
);

-- ANALYTICS (TimescaleDB hypertable)
CREATE TABLE skill_snapshots (
    child_id        UUID,
    snapshot_at     TIMESTAMPTZ,          -- hypertable time column
    skill_area      VARCHAR(50),
    score           SMALLINT,
    PRIMARY KEY (child_id, snapshot_at, skill_area)
);

CREATE TABLE emotion_events (
    child_id        UUID,
    recorded_at     TIMESTAMPTZ,
    emotion         VARCHAR(30),
    intensity       SMALLINT,
    context         VARCHAR(50),          -- game/mission/free_build
    duration_sec    SMALLINT
);

-- GAMIFICATION
CREATE TABLE child_xp (
    child_id        UUID PRIMARY KEY,
    total_xp        INTEGER,
    current_level   SMALLINT,
    current_streak  SMALLINT,
    longest_streak  SMALLINT,
    badges          JSONB                 -- [{badge_id, earned_at}]
);

-- COMMUNITY
CREATE TABLE builds (
    id              UUID PRIMARY KEY,
    child_id        UUID,
    session_id      UUID,
    image_url       VARCHAR,
    structure_type  VARCHAR(50),
    creativity_score SMALLINT,
    moderation_status VARCHAR(20),        -- pending/approved/rejected
    community_visible BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ
);
```

### 15.2 Data Storage Strategy

| Data Type | Store | Retention | Privacy |
|-----------|-------|-----------|---------|
| Session metadata | PostgreSQL | Indefinite | Parent-owned |
| Skill scores | TimescaleDB | Indefinite | Parent-owned |
| Emotion events | TimescaleDB | 90 days raw, aggregated forever | No raw sharing |
| Camera frames | NOT stored | Processed, immediately discarded | Critical |
| Voice audio | NOT stored | Processed locally, discarded | Critical |
| Build images | S3 | Until deletion | Parent-controlled |
| Community builds | S3 (moderated) | Until deletion | Public (opt-in) |
| Analytics aggregates | PostgreSQL | Indefinite | De-identified |

---

## 16. API ARCHITECTURE

### 16.1 API Structure

```yaml
# REST API — Parent/Teacher facing
/api/v1/
  /auth/
    POST /register
    POST /login
    POST /refresh
    DELETE /logout

  /children/
    GET    /                          # list children in family
    POST   /                          # create child profile
    GET    /{child_id}
    PUT    /{child_id}
    DELETE /{child_id}

  /sessions/
    GET    /                          # list sessions (filtered)
    GET    /{session_id}
    GET    /{session_id}/replay       # session event replay

  /analytics/
    GET    /summary?child_id&period
    GET    /skills?child_id&period
    GET    /emotions?child_id&period
    GET    /reports/weekly?child_id
    GET    /reports/monthly?child_id

  /missions/
    GET    /                          # all missions
    POST   /                          # teacher: create mission
    GET    /{mission_id}
    PUT    /{mission_id}

# WebSocket — Real-time game
WS /ws/game/{session_id}
  # Client → Server events
  { type: "block_sequence", commands: [...] }
  { type: "voice_input", transcript: "..." }
  { type: "gesture", gesture: "thumbs_up" }
  { type: "answer_button", answer: "rock" }

  # Server → Client events
  { type: "game_state", state: {...} }
  { type: "lumi_speak", text: "...", emotion: "joy" }
  { type: "robot_command", sequence: [...] }
  { type: "lighting_event", zones: [...], color: "..." }
  { type: "achievement_unlocked", badge: {...} }
  { type: "question", question: {...} }

# Internal gRPC — Microservice communication
vision.proto    → detect_lego, analyze_build, detect_emotion
ai.proto        → generate_response, update_child_state
robot.proto     → execute_command, get_position, emergency_stop
```

---

## 17. REAL-TIME SYNCHRONIZATION SYSTEM

### 17.1 Event Bus Architecture

```
Hardware Events (MQTT)
    │
    ▼
Edge MQTT Broker (Raspberry Pi)
    │
    ├─────► Local AI Processing (vision, emotion)
    │
    ├─────► Local Game State Manager
    │
    └─────► Cloud Sync Agent (buffers + uploads)
                │
                ▼
           Cloud Event Bus (Redis Streams / AWS Kinesis)
                │
                ├─────► Game Service (real-time state)
                ├─────► Analytics Service (logging)
                ├─────► Avatar Service (Lumi responses)
                └─────► Parent Notification Service
```

### 17.2 Offline-First Design

- **Offline capability**: Core gameplay works without internet
- **Local state**: All game state persists on Raspberry Pi
- **Sync queue**: Events buffered locally, synced when reconnected
- **Conflict resolution**: Last-write-wins for simple fields, merge for arrays
- **Parent dashboard**: Shows cached data during offline periods with clear indicator

---

## 18. CLOUD INFRASTRUCTURE

### 18.1 Infrastructure Map

```
                        AWS / GCP CLOUD
┌─────────────────────────────────────────────────────────┐
│                                                          │
│  CDN (CloudFront)          AI Services                  │
│    └── Static assets         ├── Vision (ECS/GPU)       │
│                              ├── NLP (Lambda)           │
│  Load Balancer               └── Emotion (ECS/GPU)      │
│    └── API Gateway                                      │
│         ├── Auth Service (Lambda)                       │
│         ├── Game Service (ECS Fargate)                  │
│         ├── Analytics Service (ECS Fargate)             │
│         ├── Report Service (Lambda)                     │
│         └── Community Service (ECS Fargate)             │
│                                                          │
│  Data Layer                 Message Layer               │
│    ├── RDS PostgreSQL         ├── ElastiCache Redis      │
│    ├── TimescaleDB            ├── Kinesis Event Bus      │
│    ├── S3 (media)             └── SQS (job queues)      │
│    └── Pinecone (vectors)                               │
│                                                          │
│  Observability              Security                    │
│    ├── Datadog                ├── Cognito (auth)         │
│    ├── Sentry                 ├── WAF                   │
│    └── CloudWatch             └── KMS (encryption)     │
└─────────────────────────────────────────────────────────┘
```

### 18.2 Performance Targets

| Metric | Target |
|--------|--------|
| API response time (p95) | <100ms |
| WebSocket latency | <50ms |
| Robot command latency | <30ms (local WiFi) |
| Vision AI processing | <200ms per frame |
| Dashboard load time | <2s |
| Offline sync | <5s on reconnect |
| System uptime | 99.9% (school hours priority) |

---

## 19. SAFETY ARCHITECTURE

### 19.1 Child Safety Principles (COPPA / GDPR-K Aligned)

```python
safety_principles = [
    "NO camera data stored — processed and immediately discarded",
    "NO voice recordings stored — on-device processing only",
    "NO real names in community — display names only",
    "NO direct messaging between children",
    "ALL community content human-moderated before visibility",
    "NO behavioral data sold or shared with third parties",
    "ALL data deletable on parent request within 24 hours",
    "NO targeted advertising to children",
    "NO dark patterns (no urgency manipulation, no FOMO engineering)",
    "Screen time limits — enforced, not advisory",
    "Content age-gating — verified, not self-reported",
]
```

### 19.2 Content Safety System

```python
class ContentModerationSystem:

    def moderate_build(self, build_image: Image) -> ModerationResult:
        """
        Two-stage:
        1. AWS Rekognition / OpenAI Vision — automated pre-screen
        2. Human moderator queue — all flagged + all first-time submissions
        
        Child build images default to private.
        Community visibility requires explicit parent opt-in.
        """

    def moderate_voice(self, transcript: str) -> VoiceModerationResult:
        """
        Real-time NLP scan for:
        - Distress signals ("I want to hurt...", "I hate myself")
        - Abuse indicators (unusual behavior patterns)
        - Content safety (profanity, inappropriate topics)
        
        Distress signals → immediate parent notification
        """
```

### 19.3 Physical Safety

- Table edges: rounded, no sharp corners
- Robot max speed: 15cm/s on table, proximity-capped
- Cable management: all cables internal or magnetic-detach
- Material certifications: CE, FCC, child-safe plastics
- Camera privacy: physical lens covers, LED indicator when active
- Table stability: anti-tip weight distribution, rubber feet

---

## 20. COMMUNITY & MULTIPLAYER SYSTEM

### 20.1 Community Architecture

```
SAFE COMMUNITY LAYERS
│
├── Tier 1: Family (always enabled)
│   └── Share builds with parents, grandparents (link-based)
│
├── Tier 2: Classroom (school accounts)
│   ├── Class gallery (teacher-moderated)
│   ├── Team challenges within class
│   └── Teacher-managed interactions only
│
└── Tier 3: Global Community (parent opt-in, 8+)
    ├── Moderated build gallery
    ├── Anonymous (display name only)
    ├── Curated leaderboards (no direct contact)
    └── Team challenges (teacher/parent-assembled teams only)
```

### 20.2 Multiplayer Game Session

```python
class MultiplayerSession:
    max_players: int = 4              # at same table or remote
    min_age: int = 5
    session_types = [
        "cooperative",                # work together to win
        "parallel",                   # same task, compare results
        "turn_based",                 # take turns, no real-time pressure
    ]
    # No real-time competition for ages 5-7 (developmentally inappropriate)
    # Competition only from age 8+, always opt-in
```

---

## 21. AI TRAINING PIPELINE

### 21.1 Model Training Strategy

```
DATA SOURCES:
├── LEGO Dataset (public)
│   └── ~500k LEGO structure images, labeled
├── Custom Build Dataset (platform-generated)
│   └── Collected from platform (opt-in, anonymized)
├── Children's Speech Dataset
│   └── Kaggle + licensed + custom recording sessions
├── Child Emotion Dataset
│   └── Licensed research datasets (AffectNet, JAFFE)
└── Educational Outcome Data
    └── Session performance → skill outcome mappings

TRAINING INFRASTRUCTURE:
├── Training: AWS SageMaker / Google Vertex AI
├── Experiment tracking: MLflow / W&B
├── Model registry: MLflow Model Registry
├── Serving: TorchServe / Triton Inference Server
└── Edge deployment: TFLite / ONNX Runtime (Raspberry Pi)

MODEL UPDATE CYCLE:
├── Vision models: retrain monthly with new build data
├── Emotion models: retrain quarterly (slow drift)
├── Learning models: retrain weekly (fast feedback loop)
└── NLP/Avatar: fine-tune monthly, full retrain yearly
```

### 21.2 Feedback Loop

```
Child Interaction → Log → Analysis → Model Improvement
                              │
                              └── Teacher validates outcomes
                                  (did the child actually learn?)
                                  → Ground truth for model evaluation
```

---

## 22. MONETIZATION STRATEGY

### 22.1 Revenue Model

**Hardware** (Primary revenue, B2C + B2B)
- Lumi Smart Table: $599 (consumer) / $499 (school bulk)
- Lumi-Bot Starter Pack: $79
- Block Extension Packs: $29-49
- Accessories (robot skins, table overlays): $15-29

**Software Subscription**
- **Free Tier**: 10 missions, 5 game types, basic reports (acquisition)
- **Family Plan**: $9.99/mo — unlimited missions, all games, full analytics
- **School Seat**: $4.99/mo/student — teacher console, curriculum tools, class management
- **School Bundle**: $2,999/yr/classroom (25 students) — full platform + 2 robots + support

**Content**
- Story Packs (additional world/chapter): $4.99 (optional, not required)
- Mission Packs (curriculum-aligned): $9.99 (school market)

**Data & Insights** (B2B)
- Anonymized, aggregated learning insights to education researchers (opt-in institutions)
- NOT individual child data

**Key principle**: The educational core is never paywalled. Premium is always aesthetic or convenience.

---

## 23. SCHOOL INTEGRATION STRATEGY

### 23.1 Teacher Console Features

```
TEACHER CONSOLE
├── Class Management
│   ├── Student roster (display names, age segments)
│   ├── Seating groups (table assignments)
│   ├── Session scheduling
│   └── Progress at a glance
│
├── Curriculum Tools
│   ├── Mission creator (drag-and-drop)
│   ├── Learning objective mapping (to CSTA standards)
│   ├── Assignment with due dates
│   └── Difficulty per student (override AI)
│
├── Analytics
│   ├── Class heatmap (who needs help where)
│   ├── Individual student deep-dive
│   ├── Printable progress reports
│   └── Flag system (students to follow up with)
│
└── Content Library
    ├── Pre-built curriculum packs
    ├── Community-contributed missions (teacher-vetted)
    └── Integration with Google Classroom / Canvas
```

### 23.2 Curriculum Alignment

- **CS Education Standards**: CSTA K-12 CS Framework alignment
- **STEM Integration**: Math, Science concept tie-ins per level
- **Social-Emotional Learning**: SEL standards (CASEL framework)
- **Common Core Math**: arithmetic concepts through block games (grades K-3)
- **Next Gen Science Standards**: engineering design process

---

## 24. MVP ROADMAP

### Phase 1: Foundation (Months 1-4)
**Goal**: Working hardware prototype + core software

- [ ] Smart table hardware prototype (2 cameras, basic RGB, 1 robot)
- [ ] Color detection + command execution (existing codebase enhanced)
- [ ] Lumi Avatar v1 (voice only, 3 personalities)
- [ ] 10 core missions (levels 1-10 reworked for 5-7 year olds)
- [ ] Basic parent dashboard (session summary only)
- [ ] Child UI: mission screen + game board (no-read mode)

**Success metric**: 10 children ages 5-7 complete 3+ sessions without adult help

---

### Phase 2: Intelligence (Months 5-8)
**Goal**: AI systems live and adapting

- [ ] Emotion detection (face camera integration)
- [ ] Adaptive difficulty (live, not rule-based)
- [ ] Full guided questions system (image-based for non-readers)
- [ ] Achievement system (15 badges)
- [ ] Parent dashboard (skill analytics, weekly report)
- [ ] 4-camera setup + LEGO structure recognition
- [ ] Story Mode: Chapter 1 (3 episodes)
- [ ] Robot interactions linked to game narrative

**Success metric**: Adaptive AI measurably improves session completion rate

---

### Phase 3: Experience (Months 9-12)
**Goal**: Magical product experience

- [ ] 3D World Map (full progression visualization)
- [ ] All 5 game categories live (25+ games)
- [ ] Story Mode: Chapters 1-3
- [ ] Multiplayer (2-player, cooperative only)
- [ ] Teacher console beta
- [ ] Community gallery (moderated, family tier)
- [ ] Mobile parent app (iOS + Android)
- [ ] Full theme system (5 themes)

**Success metric**: Parent NPS > 70. Teacher pilot in 3 schools.

---

### Phase 4: Scale (Months 13-18)
**Goal**: Market-ready product

- [ ] School enterprise features
- [ ] Curriculum alignment documentation
- [ ] Production hardware manufacturing
- [ ] Global community layer
- [ ] Multi-language support (5 languages)
- [ ] Accessibility compliance (WCAG 2.1 AA)
- [ ] App store launch (iOS + Android)
- [ ] School channel sales launch

---

## 25. SCALING STRATEGY

### Technical Scaling

| Traffic Level | Architecture |
|--------------|-------------|
| 0-1K tables | Single-region, monolith-lite, managed services |
| 1K-10K tables | Microservices, auto-scaling, CDN |
| 10K-100K tables | Multi-region, global DB replication |
| 100K+ tables | Full global mesh, edge AI, dedicated infrastructure |

### Business Scaling

1. **Direct to Consumer** → 1-2 tables per family
2. **School Clubs** → 2-5 tables per school
3. **Classroom Standard** → 25 students, 5 tables per room
4. **District-Wide** → Enterprise contract, centralized analytics
5. **International** → Licensing to EdTech distributors per country

---

## 26. CHILD PSYCHOLOGY DESIGN PRINCIPLES

### 26.1 Developmental Stage Alignment

```
AGE 4-5 (PREOPERATIONAL)
✓ Concrete, physical interactions only
✓ Immediate cause-and-effect feedback (<3 seconds)
✓ No abstract concepts (loops, conditionals)
✓ Voice + icon UI — zero reading required
✓ Short sessions (10-15 min max)
✓ High positive reinforcement ratio (5:1 positive to corrective)
✓ Lumi does most of the talking — child responds, doesn't initiate
✗ Never: leaderboards, comparison to others, time pressure

AGE 6-7 (EARLY CONCRETE OPERATIONAL)
✓ Simple cause-and-effect chains (up to 4 steps)
✓ Basic loop concept with physical demonstration
✓ Choice between 2-3 options (not more)
✓ Beginning of reading support (large text, icons still primary)
✓ 20-25 min sessions
✓ Peer collaboration with structured roles
✓ "Why did this happen?" questions (concrete, not abstract)
✗ Never: open-ended debugging without scaffolding

AGE 8-9 (CONCRETE OPERATIONAL)
✓ Multi-step problem solving
✓ Comparison and self-reflection
✓ Strategy and planning ahead
✓ Reading-ready UI acceptable
✓ 30-40 min sessions
✓ Mild competition (opt-in, not default)
✓ Self-set goals with AI guidance
✓ Metacognitive prompts ("What strategy worked?")

AGE 10-12 (EARLY FORMAL OPERATIONAL)
✓ Abstract concepts (algorithms, optimization)
✓ Hypothesis testing
✓ Self-directed learning paths
✓ Community contribution
✓ 45-60 min deep work sessions
✓ Leadership roles in multiplayer
✓ Complex analytics visible to child (not just parents)
```

### 26.2 Motivation Architecture (Self-Determination Theory)

```
AUTONOMY (child controls their experience)
→ Choose game type daily
→ Choose avatar, theme, name
→ Opt out of any game at any time, no penalty
→ Set own difficulty preference (AI suggests, child decides)

COMPETENCE (child feels capable)
→ Difficulty always at 70% success rate (not too easy, not too hard)
→ Immediate feedback on every action
→ Progress always visible
→ Struggle normalized ("Lumi gets confused too sometimes!")
→ Effort praised over ability ("You kept trying — that's amazing")

RELATEDNESS (child feels connected)
→ Lumi remembers past sessions ("Last time you built a tower!")
→ Parent involvement missions (designed to play together)
→ Collaborative missions build friendship
→ Lumi has consistent personality — feels like a real friend
```

### 26.3 Anti-Dark-Pattern Commitments

```
❌ NO: Variable reward schedules (slot machine mechanics)
❌ NO: FOMO triggers ("Only 2 hours left to get this!")
❌ NO: Artificially extended session mechanics ("just one more!")
❌ NO: Social pressure ("Your friend already finished this level")
❌ NO: Guilt for missing sessions ("You haven't played in 3 days...")
❌ NO: Paywalled educational content
❌ NO: Advertising of any kind in child UI

✅ YES: Natural stopping points at end of each mission
✅ YES: Honest session length estimates before starting
✅ YES: Celebration of stopping ("Great work today! See you tomorrow!")
✅ YES: Parent-enforced time limits with graceful wind-down
✅ YES: Offline play without degraded experience
```

---

## 27. TECH STACK

### Final Recommended Stack

```yaml
FRONTEND:
  child_ui:           "Next.js 15 + React 19 + Framer Motion + Three.js"
  parent_app:         "React Native (Expo) + NativeWind"
  teacher_console:    "Next.js 15 + Tailwind + Recharts"
  3d_effects:         "Three.js + React Three Fiber + GSAP"
  real_time:          "Socket.io client"

BACKEND:
  api_gateway:        "Kong Gateway"
  game_service:       "FastAPI (Python) — WebSocket + game loop"
  auth_service:       "Node.js + Supabase Auth"
  analytics_service:  "FastAPI + TimescaleDB"
  report_service:     "FastAPI + WeasyPrint (PDF)"
  community_service:  "Node.js + GraphQL"
  notification_svc:   "Node.js + Firebase Cloud Messaging"

AI & ML:
  computer_vision:    "Python + OpenCV + YOLOv11 (custom trained)"
  emotion_ai:         "MediaPipe Face Mesh + custom classifier"
  posture_ai:         "MediaPipe Pose"
  nlp_avatar:         "Claude API (claude-haiku-4-5 for real-time)"
  report_generation:  "Claude API (claude-sonnet-4-6)"
  speech_to_text:     "Whisper (on-device, small model)"
  text_to_speech:     "Coqui TTS (custom Lumi voice)"
  learning_model:     "scikit-learn + XGBoost (skill prediction)"
  training_platform:  "PyTorch + AWS SageMaker"

HARDWARE LAYER:
  edge_compute:       "Raspberry Pi 5 (8GB) + Ubuntu Server 24.04"
  gpu_accelerator:    "NVIDIA Jetson Orin Nano (optional)"
  cameras:            "Raspberry Pi Camera Module 3 (×4) + USB face cam"
  robot_brain:        "Arduino Mega 2560 + ESP32 WiFi module"
  robot_firmware:     "Arduino C++ + FreeRTOS"
  hardware_comm:      "MQTT (Mosquitto broker on Pi)"
  table_lighting:     "NeoPixel LED strips + FastLED library"

DATA:
  primary_db:         "PostgreSQL 16 (Supabase)"
  time_series:        "TimescaleDB (session events, skill scores)"
  cache:              "Redis 7 (game state, sessions)"
  search:             "Pinecone (vector search for similar builds)"
  file_storage:       "AWS S3 + CloudFront"
  analytics_store:    "ClickHouse (aggregated metrics at scale)"

INFRASTRUCTURE:
  cloud:              "AWS (primary) + GCP (AI services)"
  containerization:   "Docker + Kubernetes (EKS)"
  ci_cd:              "GitHub Actions + ArgoCD"
  monitoring:         "Datadog + Sentry + PagerDuty"
  secrets:            "AWS Secrets Manager"
  iac:                "Terraform"

COMMUNICATION:
  real_time:          "WebSocket (Socket.io)"
  internal_rpc:       "gRPC (protobuf)"
  event_bus:          "AWS Kinesis / Redis Streams"
  iot_protocol:       "MQTT (hardware ↔ edge)"
  push:               "Firebase Cloud Messaging"

SAFETY & COMPLIANCE:
  content_moderation: "AWS Rekognition + human review queue"
  auth:               "Supabase Auth + Row-Level Security"
  encryption:         "AES-256 at rest, TLS 1.3 in transit"
  compliance:         "COPPA, GDPR-K, CCPA"
  penetration_testing:"Quarterly third-party audit"
```

---

## CLOSING NOTES FOR THE TEAM

### The Three Non-Negotiables

1. **A 5-year-old must be able to start a mission within 60 seconds of sitting down** — no reading, no menus, no loading screens that outlast their attention span.

2. **Parents must be able to trust the platform completely** — no dark patterns, no surprise purchases, no data surprises, no exceptions.

3. **The physical table IS the interface** — every design decision must start from "what does this feel like with blocks in your hands," not "how does this look on a screen."

### What Makes This Different

Most EdTech fails because it is education dressed up as entertainment. Children see through it.

Lumi works because the physical building IS the game. The learning is invisible. Children go home and tell their parents they played with robots. They don't know they just learned algorithmic thinking, spatial reasoning, and emotional regulation.

**That is the goal. Magic on the surface, science underneath.**

---

*Document Version: 1.0 — Architecture Design*
*Platform: Lumi Smart Education Table*
*Target: Ages 4–12 | School + Home*
