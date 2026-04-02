# Lumi

A hands-on programming education platform where children learn algorithmic thinking by arranging physical colored blocks. A camera captures the block sequence and translates it into robot commands, making coding tactile and screen-free.

## How It Works

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌─────────────┐
│  Physical   │────►│   Camera     │────►│   Server     │────►│   Robot     │
│   Blocks    │     │  Detection   │     │  + Dashboard │     │   Car       │
└─────────────┘     └──────────────┘     └──────────────┘     └─────────────┘
    🟢🔵🟡🔴           OpenCV/HSV         FastAPI/React        Serial/Arduino
```

1. **Place Blocks** - Kids arrange colored blocks left-to-right on a mat
2. **Camera Scans** - Computer vision detects colors and order
3. **Dashboard Shows** - Real-time command visualization + grid simulation
4. **Robot Executes** - Physical robot follows the programmed path

## Block Commands

| Color  | Command     | Action                        |
|--------|-------------|-------------------------------|
| 🟢 Green  | `forward`    | Move one step forward         |
| 🔵 Blue   | `turn_right` | Rotate 90° clockwise          |
| 🟡 Yellow | `turn_left`  | Rotate 90° counter-clockwise  |
| 🔴 Red    | `loop`       | Repeat previous command 2x    |
| 🟠 Orange | `loop_start` | Begin a loop section (advanced) |
| 🟣 Purple | `loop_end`   | End loop and repeat contents (advanced) |

## Project Structure

```
├── server.py              # FastAPI WebSocket server (core hub)
├── blocks.py              # Block definitions & color mappings
├── color_detector.py      # OpenCV camera detection → POSTs to server
├── robot_controller.py    # Serial communication with Arduino robot
├── guided_questions.py    # Guided question system with voice/button input
├── mind_analyzer.py       # Natural language understanding for child speech
├── achievements.py        # Badge/achievement system for gamification
├── personality.py         # Lumi personality modes (coach/challenger/friendly)
├── memory.py              # Interaction memory (tracks last 3 for adaptation)
├── analytics_logger.py    # Teacher analytics & mistake tracking
├── path_simulator.py      # 2D grid simulation with collision detection
├── mission_designer.py    # Tkinter GUI to create custom missions
├── simulate.py            # Demo animation for testing
├── requirements.txt       # Python dependencies
└── dashboard/             # React + Vite web interface
    └── src/
        ├── App.jsx        # Main dashboard component
        └── index.css      # Styling with animations
```

## Quick Start

### Prerequisites

- Python 3.8+
- Node.js 18+
- Webcam
- (Optional) Arduino-based robot car

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/lumi-kid-coding.git
cd lumi-kid-coding

# Install Python dependencies
pip install -r requirements.txt

# Install dashboard dependencies
cd dashboard
npm install
```

### Running the System

**Terminal 1 - Start the WebSocket server:**
```bash
python server.py
```

**Terminal 2 - Start the dashboard:**
```bash
cd dashboard
npm run dev
```

**Terminal 3 - Start the camera detector:**
```bash
python color_detector.py
```

Open `http://localhost:5173` to view the dashboard.

## Components

### Vision System (`color_detector.py`)
Detects colored blocks using HSV color space analysis. Includes morphological operations to reduce noise and sorts blocks left-to-right for correct command sequencing.

**Computer Vision Pipeline:**
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Webcam     │───►│  BGR→HSV    │───►│  Color      │───►│  Sort L→R   │
│  Capture    │    │  Conversion │    │  Threshold  │    │  by X-pos   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                            │
                   ┌────────────────────────┼────────────────────────┐
                   ▼                        ▼                        ▼
            ┌─────────────┐          ┌─────────────┐          ┌─────────────┐
            │  Green      │          │  Blue       │          │  Yellow     │
            │  H:35-85    │          │  H:100-130  │          │  H:20-35    │
            │  = forward  │          │  = turn_R   │          │  = turn_L   │
            └─────────────┘          └─────────────┘          └─────────────┘
```

**Camera Requirements:**
- Any USB webcam (720p minimum recommended)
- Good lighting to avoid color detection errors
- White or neutral background behind blocks
- Blocks should be 2-4cm apart for reliable detection

### Robot Controller (`robot_controller.py`)
Sends serial commands (`F`, `L`, `R`) to an Arduino. Falls back to simulation mode if no hardware is connected.

### Loop Validator (`loop_validator.py`)
Validates LEGO-style loop constructs (`loop_start`/`loop_end`) and provides corrections for:
- Mismatched loop blocks
- Empty loops
- Nested loops (not supported)
- Single-command loops (redundant)

### Path Simulator (`path_simulator.py`)
Runs commands on a virtual 2D grid with obstacle collision detection. Optimizes redundant turns (e.g., 3 rights = 1 left).

### Feedback System (`feedback_system.py`, `kid_feedback.py`)
Generates age-appropriate feedback:
- Detects unnecessary turn cancellations
- Encourages adding forward blocks
- Celebrates success with positive reinforcement

### Analytics Logger (`analytics_logger.py`)
Records all mission attempts to JSON and generates teacher reports:
- Retry counts per mission
- Common mistake patterns
- Pedagogical improvement suggestions

### Mission Designer (`mission_designer.py`)
Tkinter GUI for teachers/parents to create custom missions:
- Place start position, goal, and obstacles
- Auto-generates difficulty hints
- Exports to JSON format

### Dashboard (`dashboard/`)
React-based real-time interface showing:
- Detected command sequence
- Robot position on mission grid
- Status indicators (idle, executing, success, error)
- Run Program button to trigger execution
- Voice interaction with Web Speech API
- Guided question buttons for fallback input

### Adaptive Learning System

**Guided Questions (`guided_questions.py`)**
- Context-aware questions after crashes/success
- Voice recognition with fuzzy keyword matching
- Response time analysis (confident <2s, medium 2-4s, unsure >4s)
- Explanation quality scoring (keywords + word count)

**Achievement System (`achievements.py`)**
- 15 badges across categories: accuracy, speed, efficiency, milestones
- Tracks streaks, missions completed, hints used
- Celebratory feedback when badges are earned

**Personality Modes (`personality.py`)**
- **Coach**: Supportive and encouraging
- **Challenger**: Pushes for better performance
- **Friendly**: Casual and fun tone

**Interaction Memory (`memory.py`)**
- Stores last 3 interactions for pattern detection
- Detects: improving, struggling, mastering, hint-dependent
- Adjusts feedback tone automatically
- Compares current vs previous performance

## API Endpoints

| Method | Endpoint             | Description                                      |
|--------|----------------------|--------------------------------------------------|
| WS     | `/ws`                | WebSocket for real-time state updates            |
| POST   | `/api/update`        | Push state changes (commands, position, feedback)|
| POST   | `/api/execute`       | Trigger robot program execution with path sim    |
| POST   | `/api/reset`         | Reset robot to start and clear commands          |
| POST   | `/api/demo`          | Load next demo scenario                          |
| POST   | `/api/voice/interact`| Process voice input with guided questions        |
| POST   | `/api/answer`        | Submit button answer to current question         |
| GET    | `/api/question`      | Get current guided question                      |
| POST   | `/api/hint`          | Offer a hint to the user                         |
| POST   | `/api/hint/respond`  | Process hint accept/decline response             |
| GET    | `/api/achievements`  | Get player badges and stats                      |
| GET    | `/api/personality`   | Get current personality mode                     |
| POST   | `/api/personality`   | Set Lumi personality mode                        |
| GET    | `/api/memory`        | Get interaction history and pattern analysis     |
| POST   | `/api/memory/reset`  | Clear interaction memory                         |

## Hardware Setup (Optional)

### Robot Car
Connect an Arduino with motor drivers to `COM3` (Windows) or `/dev/ttyUSB0` (Linux). The robot expects single-character commands:
- `F` - Forward (one grid step)
- `L` - Turn Left (90° counter-clockwise)
- `R` - Turn Right (90° clockwise)

**Recommended Components:**
- Arduino Uno/Nano
- L298N or L293D motor driver
- 2WD or 4WD chassis with DC motors
- 9V battery pack
- HC-05 Bluetooth module (optional for wireless)

### Camera Setup
- USB webcam (720p or higher)
- Position 30-50cm above the block placement area
- Ensure even lighting (avoid shadows on blocks)
- Use colored blocks with distinct hues (e.g., LEGO DUPLO)

### Block Colors (HSV Ranges)
| Color  | Hue Range | Example Block       |
|--------|-----------|---------------------|
| Green  | 35-85     | LEGO green 2x2      |
| Blue   | 100-130   | LEGO blue 2x2       |
| Yellow | 20-35     | LEGO yellow 2x2     |
| Red    | 0-10, 170-180 | LEGO red 2x2    |

## Educational Philosophy

Lumi makes abstract programming concepts tangible:

- **Sequencing**: Physical block order = execution order
- **Loops**: Repetition without writing duplicate blocks
- **Debugging**: Immediate visual feedback on mistakes
- **Spatial Reasoning**: Navigate obstacles on a 2D grid

The feedback system analyzes common cognitive mistakes and provides targeted suggestions for educators.

## License

MIT License - Copyright (c) 2026 Davud Ali
