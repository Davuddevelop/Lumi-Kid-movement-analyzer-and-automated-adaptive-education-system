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

## Project Structure

```
├── color_detector.py      # OpenCV camera detection (HSV color ranges)
├── robot_controller.py    # Serial communication with Arduino robot
├── loop_validator.py      # Validates loop_start/loop_end block pairs
├── path_simulator.py      # 2D grid simulation with collision detection
├── feedback_system.py     # Rule-based pedagogical feedback
├── kid_feedback.py        # Child-friendly encouraging messages
├── analytics_logger.py    # Teacher analytics & mistake tracking
├── mission_designer.py    # Tkinter GUI to create custom missions
├── server.py              # FastAPI WebSocket server
├── simulate.py            # Demo animation for the dashboard
└── dashboard/             # React + Vite web interface
    └── src/
        ├── App.jsx        # Main dashboard component
        └── components/
            └── GridBoard.jsx  # Live mission grid renderer
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
pip install opencv-python numpy fastapi uvicorn pyserial requests

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

## API Endpoints

| Method | Endpoint       | Description                          |
|--------|----------------|--------------------------------------|
| WS     | `/ws`          | WebSocket for real-time state updates |
| POST   | `/api/update`  | Push state changes (commands, position, feedback) |
| POST   | `/api/execute` | Trigger robot program execution      |

## Hardware Setup (Optional)

Connect an Arduino with motor drivers to `COM3` (Windows) or `/dev/ttyUSB0` (Linux). The robot expects single-character commands:
- `F` - Forward
- `L` - Turn Left
- `R` - Turn Right

## Educational Philosophy

Lumi makes abstract programming concepts tangible:

- **Sequencing**: Physical block order = execution order
- **Loops**: Repetition without writing duplicate blocks
- **Debugging**: Immediate visual feedback on mistakes
- **Spatial Reasoning**: Navigate obstacles on a 2D grid

The feedback system analyzes common cognitive mistakes and provides targeted suggestions for educators.

## License

MIT License - Copyright (c) 2026 Davud Ali
