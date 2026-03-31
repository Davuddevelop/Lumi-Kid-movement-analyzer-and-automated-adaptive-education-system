from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import uvicorn
from suggestion_engine import get_suggestion

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RobotState:
    def __init__(self):
        self.commands = []
        self.status = "idle"  # idle, executing, success, error
        self.feedback = "Waiting for blocks..."
        self.suggestion = ""
        
        # Grid state defaults
        self.grid_size = {"width": 8, "height": 8}
        self.start_pos = {"x": 1, "y": 4}
        self.robot_pos = {"x": 1, "y": 4}
        self.goal = {"x": 6, "y": 4}
        self.obstacles = [{"x": 3, "y": 4}, {"x": 4, "y": 4}]
        self.path = [] # Coordinates the robot has traveled

    def to_dict(self):
        return {
            "commands": self.commands,
            "status": self.status,
            "feedback": self.feedback,
            "suggestion": self.suggestion,
            "grid_size": self.grid_size,
            "start_pos": self.start_pos,
            "robot_pos": self.robot_pos,
            "goal": self.goal,
            "obstacles": self.obstacles,
            "path": self.path
        }

state = RobotState()
clients = []

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    clients.append(websocket)
    try:
        await websocket.send_json(state.to_dict())
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        clients.remove(websocket)

async def broadcast_state():
    data = state.to_dict()
    dead_clients = []
    for client in clients:
        try:
            await client.send_json(data)
        except Exception:
            dead_clients.append(client)
            
    for dc in dead_clients:
        if dc in clients:
            clients.remove(dc)

class StateUpdate(BaseModel):
    commands: Optional[List[str]] = None
    status: Optional[str] = None
    feedback: Optional[str] = None
    grid_size: Optional[Dict[str, int]] = None
    start_pos: Optional[Dict[str, int]] = None
    robot_pos: Optional[Dict[str, int]] = None
    goal: Optional[Dict[str, int]] = None
    obstacles: Optional[List[Dict[str, int]]] = None
    path: Optional[List[Dict[str, int]]] = None

@app.post("/api/update")
async def update_state(update: StateUpdate):
    if update.commands is not None: state.commands = update.commands
    if update.status: state.status = update.status
    if update.feedback is not None: state.feedback = update.feedback
    if update.grid_size is not None: state.grid_size = update.grid_size
    if update.start_pos is not None: state.start_pos = update.start_pos
    if update.robot_pos is not None: state.robot_pos = update.robot_pos
    if update.goal is not None: state.goal = update.goal
    if update.obstacles is not None: state.obstacles = update.obstacles
    if update.path is not None: state.path = update.path
    
    # Update suggestions
    try:
        grid_w = state.grid_size.get('width', 8) if isinstance(state.grid_size, dict) else 8
        state.suggestion = get_suggestion(state.status, state.path, state.commands, grid_w)
    except Exception as e:
        print(f"Suggestion Error: {e}")
        state.suggestion = ""
    
        
    await broadcast_state()
    return {"message": "State updated"}

@app.post("/api/execute")
async def execute_program():
    state.status = "executing"
    state.feedback = "Robot is starting mission..."
    state.path = []
    # Reset robot to start position for the run
    state.robot_pos = state.start_pos.copy()
    await broadcast_state()
    return {"message": "Execution started"}

if __name__ == "__main__":
    print("Starting WebSocket server on http://127.0.0.1:8000")
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)
