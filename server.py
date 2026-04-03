from fastapi import FastAPI, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import uvicorn
import asyncio
import json
import os
from mind_analyzer import MindAnalyzer
from analytics_logger import MissionLogger
from guided_questions import GuidedQuestionSystem
from achievements import AchievementSystem
from personality import PersonalitySystem
from memory import MemorySystem
from level_system import LevelSystem, ValidationResult

app = FastAPI()

# Initialize components
analyzer = MindAnalyzer()
logger = MissionLogger("lumi_mission_logs.json")
question_system = GuidedQuestionSystem()
achievement_system = AchievementSystem()
personality_system = PersonalitySystem(default_mode="coach")
memory_system = MemorySystem(max_history=3)
level_system = LevelSystem()
last_mistake_tag = None  # Track for questions

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Block definitions (inline - no external import needed)
BLOCKS = {
    'forward': {'color': 'green', 'description': 'Move one step forward', 'icon': 'ArrowUp'},
    'turn_right': {'color': 'blue', 'description': 'Rotate 90° clockwise', 'icon': 'CornerDownRight'},
    'turn_left': {'color': 'yellow', 'description': 'Rotate 90° counter-clockwise', 'icon': 'CornerDownLeft'},
    'loop': {'color': 'red', 'description': 'Repeat previous block 2x', 'icon': 'Repeat'},
}

# Demo scenarios
DEMO_SCENARIOS = [
    {"name": "Success Path", "commands": ["forward", "turn_left", "forward", "forward", "turn_right", "forward", "forward", "forward", "turn_right", "forward"], "description": "Avoids obstacles and reaches the goal!"},
    {"name": "Crash Demo", "commands": ["forward", "forward", "forward"], "description": "Uh oh, crashes into the rock!"},
    {"name": "Loop Power", "commands": ["forward", "turn_left", "forward", "loop", "turn_right", "forward", "loop"], "description": "Uses loop blocks to repeat moves!"},
    {"name": "Edge Fall", "commands": ["turn_left", "forward", "forward", "forward", "forward", "forward"], "description": "Goes off the edge!"},
    {"name": "Spin Master", "commands": ["turn_right", "turn_left", "turn_right", "turn_right", "turn_right", "forward"], "description": "Too much spinning!"},
]
demo_index = 0

# Direction vectors: 0=North, 1=East, 2=South, 3=West
DIR_VECTORS = {0: (0, -1), 1: (1, 0), 2: (0, 1), 3: (-1, 0)}

class RobotState:
    def __init__(self):
        self.commands = DEMO_SCENARIOS[0]["commands"].copy()
        self.status = "idle"
        self.feedback = "Demo loaded! Press Run Program to start."
        self.suggestion = ""
        self.grid_size = {"width": 8, "height": 8}
        self.start_pos = {"x": 1, "y": 4}
        self.robot_pos = {"x": 1, "y": 4}
        self.goal = {"x": 6, "y": 4}
        self.obstacles = [{"x": 3, "y": 4}, {"x": 4, "y": 4}]
        self.path = []
        self.vitals = {"joy": 85, "focus": 40}
        self.sentiment = "curiosity"
        self.current_level_id = 1

    def to_dict(self):
        data = {
            "commands": self.commands,
            "status": self.status,
            "feedback": self.feedback,
            "suggestion": self.suggestion,
            "grid_size": self.grid_size,
            "start_pos": self.start_pos,
            "robot_pos": self.robot_pos,
            "goal": self.goal,
            "obstacles": self.obstacles,
            "path": self.path,
            "vitals": self.vitals,
            "sentiment": self.sentiment,
            "current_level_id": self.current_level_id,
            "available_blocks": BLOCKS
        }
        # Add current question if any
        q_data = question_system.get_current_question_data()
        if q_data:
            data["question"] = q_data
        return data

state = RobotState()
clients = []

# Start first mission session
logger.start_mission(DEMO_SCENARIOS[0]["name"])

async def broadcast_state():
    data = state.to_dict()
    dead = []
    for client in clients:
        try:
            await client.send_json(data)
        except:
            dead.append(client)
    for d in dead:
        if d in clients:
            clients.remove(d)

async def execute_commands():
    """Execute commands step by step."""
    global last_mistake_tag
    x, y = state.start_pos["x"], state.start_pos["y"]
    direction = 1  # East
    state.path = [{"x": x, "y": y}]
    state.robot_pos = {"x": x, "y": y}

    obstacles_set = {(o["x"], o["y"]) for o in state.obstacles}
    grid_w = state.grid_size["width"]
    grid_h = state.grid_size["height"]

    # Unroll loops
    unrolled = []
    for cmd in state.commands:
        if cmd == 'loop' and unrolled:
            unrolled.extend([unrolled[-1]] * 2)
        else:
            unrolled.append(cmd)

    collision = False

    for cmd in unrolled:
        state.feedback = f"Executing: {cmd}"
        await broadcast_state()

        if cmd == 'turn_right':
            direction = (direction + 1) % 4
        elif cmd == 'turn_left':
            direction = (direction - 1) % 4
        elif cmd == 'forward':
            dx, dy = DIR_VECTORS[direction]
            nx, ny = x + dx, y + dy

            # Bounds check
            if nx < 0 or nx >= grid_w or ny < 0 or ny >= grid_h:
                last_mistake_tag = "fell_off_edge"
                state.status = "error"
                logger.log_attempt(state.commands, "fail", duration_seconds=len(unrolled)*0.5, mistake_tag="fell_off_edge")
                # Ask a guided question
                q = question_system.get_question_for_state("error", "fell_off_edge")
                state.feedback = q.text if q else "Oops! You went off the edge!"
                state.suggestion = q.hint if q else "Try turning before going forward."
                await broadcast_state()
                return

            # Obstacle check
            if (nx, ny) in obstacles_set:
                last_mistake_tag = "crashed_into_obstacle"
                state.status = "error"
                logger.log_attempt(state.commands, "fail", duration_seconds=len(unrolled)*0.5, mistake_tag="crashed_into_obstacle")
                # Ask a guided question
                q = question_system.get_question_for_state("error", "crashed_into_obstacle")
                state.feedback = q.text if q else "Crash! You hit a rock!"
                state.suggestion = q.hint if q else "Try turning earlier to avoid obstacles."
                await broadcast_state()
                return

            x, y = nx, ny
            state.robot_pos = {"x": x, "y": y}
            state.path.append({"x": x, "y": y})

        await broadcast_state()
        await asyncio.sleep(0.5)

    # Check goal
    result = "fail"
    if x == state.goal["x"] and y == state.goal["y"]:
        state.status = "success"
        result = "success"
        last_mistake_tag = None
        
        # Record level completion in LevelSystem
        completion_result = ValidationResult(
            success=True,
            reached_goal=True,
            error=None,
            path=[(p["x"], p["y"]) for p in state.path],
            commands_used=len(unrolled),
            efficiency_score=100.0,
            stars=3,
            feedback="Perfect!"
        )
        level_system.record_completion(state.current_level_id, completion_result)
        
        # Record mission completion for achievements
        mission_badges = achievement_system.record_mission_complete()
        # Use personality-based success message
        success_msg = personality_system.get_response("success")
        # Ask success question
        q = question_system.get_question_for_state("success")
        state.feedback = q.text if q else success_msg
        state.suggestion = q.hint if q else "Try the next demo!"
        # Add badge celebration to feedback if earned
        if mission_badges:
            badge = mission_badges[0]
            state.suggestion = f"{badge.icon} NEW BADGE: {badge.name}!"
    else:
        state.status = "error"
        result = "partial"
        last_mistake_tag = "missed_goal"
        # Ask miss goal question
        q = question_system.get_question_for_state("partial", "missed_goal")
        state.feedback = q.text if q else "You didn't crash, but missed the goal!"
        state.suggestion = q.hint if q else "Adjust your path to reach the flag."

    # Log to analytics
    logger.log_attempt(state.commands, result, duration_seconds=len(unrolled)*0.5)

    await broadcast_state()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    clients.append(websocket)
    try:
        await websocket.send_json(state.to_dict())
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        if websocket in clients:
            clients.remove(websocket)

class StateUpdate(BaseModel):
    commands: Optional[List[str]] = None
    status: Optional[str] = None
    feedback: Optional[str] = None

@app.post("/api/update")
async def update_state(update: StateUpdate):
    if update.commands is not None:
        state.commands = update.commands
    if update.status:
        state.status = update.status
    if update.feedback is not None:
        state.feedback = update.feedback
    await broadcast_state()
    return {"message": "Updated"}

@app.post("/api/execute")
async def execute_program():
    if state.status == "executing":
        return {"message": "Already executing"}
    if not state.commands:
        return {"message": "No commands"}

    state.status = "executing"
    state.feedback = "Robot starting..."
    state.path = []
    state.robot_pos = state.start_pos.copy()
    await broadcast_state()

    asyncio.create_task(execute_commands())
    return {"message": "Started"}

@app.post("/api/demo")
async def load_demo():
    global demo_index
    demo = DEMO_SCENARIOS[demo_index % len(DEMO_SCENARIOS)]
    demo_index += 1

    state.commands = demo["commands"].copy()
    state.status = "idle"
    state.feedback = f"{demo['name']}: {demo['description']}"
    state.suggestion = ""
    state.robot_pos = state.start_pos.copy()
    state.path = []
    
    # Start analytics session
    logger.start_mission(demo["name"])
    
    await broadcast_state()
    return {"message": f"Loaded: {demo['name']}"}

class VoiceInput(BaseModel):
    text: str

@app.post("/api/voice/interact")
async def voice_interact(voice: VoiceInput):
    """Process voice input - try guided question first, fallback to free-form."""

    # Check if there's an active guided question
    if question_system.current_question:
        result = question_system.process_answer(spoken_text=voice.text)

        if result["success"]:
            # Matched an answer
            is_correct = result.get("answer", {}).get("is_correct", False)
            response_time = result.get("response_time_sec", 5)
            response_confidence = result.get("response_confidence", "unknown")
            explanation_quality = result.get("explanation_quality", "n/a")

            # Record to memory
            memory_system.record(
                interaction_type="answer",
                is_correct=is_correct,
                response_time_sec=response_time,
                confidence=response_confidence,
                explanation_quality=explanation_quality,
                context=last_mistake_tag or "general"
            )

            # Get memory-based adaptive feedback
            comparison = memory_system.get_comparison_feedback()
            memory_prefix = memory_system.get_adaptive_prefix()

            # Combine feedback with memory insight
            feedback = result["feedback"]
            if comparison:
                feedback = f"{feedback} {comparison}"
            if memory_prefix and is_correct:
                feedback = f"{memory_prefix}{feedback}"

            state.feedback = feedback
            state.suggestion = ""
            logger.log_interaction(voice.text, {"type": "guided_answer", "result": result})

            # Record achievement
            badges = achievement_system.record_answer(
                is_correct=is_correct,
                response_time_sec=response_time,
                explanation_quality=explanation_quality
            )

            await broadcast_state()
            return {
                "speech": feedback,
                "answer": result["answer"],
                "confidence": result["confidence"],
                "response_time_sec": response_time,
                "response_confidence": response_confidence,
                "explanation_quality": explanation_quality,
                "explanation_details": result.get("explanation_details", {}),
                "badges": [{"id": b.id, "name": b.name, "message": b.message, "icon": b.icon} for b in badges],
                "memory": memory_system.analyze_pattern()
            }
        else:
            # Didn't match - show buttons as fallback
            state.feedback = result["feedback"]
            await broadcast_state()
            return {
                "speech": result["feedback"],
                "show_buttons": True,
                "question": question_system.get_current_question_data(),
                "explanation_quality": result.get("explanation_quality", "n/a"),
                "explanation_details": result.get("explanation_details", {})
            }

    # No active question - use free-form mind analyzer
    analysis = analyzer.analyze(voice.text)
    response = analyzer.get_lumi_response(analysis, state.to_dict())

    # Sync state with analysis
    state.sentiment = analysis.get("sentiment", "neutral")
    # Dynamically adjust vitals based on sentiment
    if state.sentiment == "joy":
        state.vitals["joy"] = min(100, state.vitals["joy"] + 10)
    elif state.sentiment == "frustration":
        state.vitals["joy"] = max(0, state.vitals["joy"] - 15)
        state.vitals["focus"] = max(0, state.vitals["focus"] - 5)
    elif state.sentiment == "curiosity":
        state.vitals["focus"] = min(100, state.vitals["focus"] + 15)

    logger.log_interaction(voice.text, analysis)
    state.feedback = response
    await broadcast_state()

    return {
        "speech": response,
        "analysis": analysis,
        "vitals": state.vitals,
        "sentiment": state.sentiment
    }

class AnswerInput(BaseModel):
    button_id: str

@app.post("/api/answer")
async def answer_question(answer: AnswerInput):
    """Handle button press answer to guided question."""
    result = question_system.process_answer(button_id=answer.button_id)

    is_correct = result.get("answer", {}).get("is_correct", False)
    response_time = result.get("response_time_sec", 5)
    response_confidence = result.get("response_confidence", "unknown")

    # Record to memory
    memory_system.record(
        interaction_type="answer",
        is_correct=is_correct,
        response_time_sec=response_time,
        confidence=response_confidence,
        context=last_mistake_tag or "general"
    )

    # Get memory-based adaptive feedback
    comparison = memory_system.get_comparison_feedback()
    memory_prefix = memory_system.get_adaptive_prefix()

    # Combine feedback with memory insight
    feedback = result["feedback"]
    if comparison:
        feedback = f"{feedback} {comparison}"
    if memory_prefix and is_correct:
        feedback = f"{memory_prefix}{feedback}"

    state.feedback = feedback
    state.suggestion = ""

    logger.log_interaction(f"[BUTTON] {answer.button_id}", {"type": "button_answer", "result": result})

    # Record achievement
    badges = achievement_system.record_answer(
        is_correct=is_correct,
        response_time_sec=response_time
    )

    await broadcast_state()

    return {
        "speech": feedback,
        "answer": result.get("answer"),
        "is_correct": is_correct,
        "response_time_sec": response_time,
        "response_confidence": response_confidence,
        "badges": [{"id": b.id, "name": b.name, "message": b.message, "icon": b.icon} for b in badges],
        "memory": memory_system.analyze_pattern()
    }

@app.get("/api/question")
async def get_current_question():
    """Get current guided question and options."""
    q_data = question_system.get_current_question_data()
    if q_data:
        return {"question": q_data}
    return {"question": None}

@app.post("/api/hint")
async def offer_hint():
    """Offer a hint based on current game state."""
    # Determine context from last mistake
    context = "default"
    if last_mistake_tag == "crashed_into_obstacle":
        context = "crash"
    elif last_mistake_tag == "fell_off_edge":
        context = "edge"
    elif last_mistake_tag == "missed_goal":
        context = "miss_goal"
    elif state.status == "success":
        context = "success"

    question = question_system.offer_hint(context)
    state.feedback = question.text
    state.suggestion = question.hint
    await broadcast_state()

    return {
        "message": "Hint offered",
        "question": question_system.get_current_question_data(),
        "context": context
    }

class HintResponse(BaseModel):
    wants_hint: bool

@app.post("/api/hint/respond")
async def respond_to_hint(response: HintResponse):
    """Process user's response to hint offer."""
    if not question_system.is_hint_mode():
        return {"error": "No hint was offered"}

    result = question_system.process_hint_response(response.wants_hint)
    response_time = result.get("response_time_sec", 0)
    response_confidence = result.get("response_confidence", "unknown")

    # Record hint interaction to memory
    memory_system.record(
        interaction_type="hint",
        is_correct=None,
        response_time_sec=response_time,
        confidence=response_confidence,
        context=last_mistake_tag or "general",
        used_hint=response.wants_hint
    )

    # Track hint usage for achievements
    if response.wants_hint:
        achievement_system.record_hint_used()
        # Use personality-adjusted hint response
        hint_msg = personality_system.get_response("hint_given", hint=result["feedback"])
        result["feedback"] = hint_msg
    else:
        # Use personality-based encouragement
        result["feedback"] = personality_system.get_response("encouragement")

    state.feedback = result["feedback"]
    state.suggestion = ""
    logger.log_interaction(f"[HINT] wants_hint={response.wants_hint}", {"type": "hint_response", "result": result})
    await broadcast_state()

    return {
        "speech": result["feedback"],
        "response_type": result["response_type"],
        "wants_hint": result["wants_hint"],
        "response_time_sec": response_time,
        "response_confidence": response_confidence,
        "memory": memory_system.analyze_pattern()
    }

@app.get("/api/achievements")
async def get_achievements():
    """Get player achievements and stats."""
    return {
        "stats": achievement_system.get_stats(),
        "badges": achievement_system.get_all_badges(),
        "pending": achievement_system.get_pending_badges()
    }

@app.get("/api/achievements/stats")
async def get_achievement_stats():
    """Get current player stats."""
    return achievement_system.get_stats()

@app.get("/api/memory")
async def get_memory():
    """Get interaction memory and pattern analysis."""
    return {
        "history": memory_system.get_history(),
        "analysis": memory_system.analyze_pattern(),
        "should_offer_hint": memory_system.should_offer_hint()
    }

@app.post("/api/memory/reset")
async def reset_memory():
    """Clear interaction memory."""
    memory_system.reset()
    return {"message": "Memory cleared"}

@app.get("/api/personality")
async def get_personality():
    """Get current personality mode and all options."""
    return {
        "current": personality_system.get_mode(),
        "personality": {
            "name": personality_system.get_personality().name,
            "emoji": personality_system.get_personality().emoji,
            "description": personality_system.get_personality().description
        },
        "modes": personality_system.get_all_modes()
    }

class PersonalityMode(BaseModel):
    mode: str

@app.post("/api/personality")
async def set_personality(data: PersonalityMode):
    """Set Lumi's personality mode."""
    if personality_system.set_mode(data.mode):
        p = personality_system.get_personality()
        greeting = personality_system.get_response("greeting")
        state.feedback = greeting
        await broadcast_state()
        return {
            "success": True,
            "mode": data.mode,
            "name": p.name,
            "emoji": p.emoji,
            "greeting": greeting
        }
    return {"success": False, "error": "Invalid mode"}

@app.post("/api/reset")
async def reset_state():
    return await load_demo()

# ============================================
# LEVEL SYSTEM ENDPOINTS
# ============================================

@app.get("/api/levels")
async def get_levels():
    """Get all levels with player progress."""
    levels_data = []
    for level in level_system.get_all_levels():
        level_dict = level.to_dict()
        level_dict["unlocked"] = level_system.is_level_unlocked(level.level_id)
        level_dict["completed"] = level.level_id in level_system.progress.completed_levels
        level_dict["stars"] = level_system.progress.stars_earned.get(level.level_id, 0)
        level_dict["best_solution"] = level_system.progress.best_solutions.get(level.level_id)
        level_dict["attempts"] = level_system.progress.attempts.get(level.level_id, 0)
        # Add chapter info
        if level.level_id <= 5:
            level_dict["chapter"] = 1
            level_dict["chapter_name"] = "Basics"
        elif level.level_id <= 10:
            level_dict["chapter"] = 2
            level_dict["chapter_name"] = "Obstacles"
        elif level.level_id <= 15:
            level_dict["chapter"] = 3
            level_dict["chapter_name"] = "Loops"
        else:
            level_dict["chapter"] = 4
            level_dict["chapter_name"] = "Mastery"
        levels_data.append(level_dict)

    return {
        "levels": levels_data,
        "progress": level_system.get_progress_summary()
    }

class LevelLoadRequest(BaseModel):
    level_id: int

@app.post("/api/levels/load")
async def load_level(request: LevelLoadRequest):
    """Load a specific level into the game state."""
    level = level_system.get_level(request.level_id)

    if not level:
        return {"success": False, "error": "Level not found"}

    if not level_system.is_level_unlocked(request.level_id):
        return {"success": False, "error": "Level is locked"}

    # Update game state with level configuration
    state.current_level_id = request.level_id
    state.grid_size = {"width": level.grid_size[0], "height": level.grid_size[1]}
    state.start_pos = {"x": level.start[0], "y": level.start[1]}
    state.robot_pos = {"x": level.start[0], "y": level.start[1]}
    state.goal = {"x": level.goal[0], "y": level.goal[1]}
    state.obstacles = [{"x": o[0], "y": o[1]} for o in level.obstacles]
    state.commands = []
    state.path = []
    state.status = "idle"
    state.feedback = f"Level {level.level_id}: {level.name}"
    state.suggestion = level.description

    # Start analytics session for this level
    logger.start_mission(f"Level_{level.level_id}_{level.name}")

    await broadcast_state()

    return {
        "success": True,
        "level": level.to_dict(),
        "allowed_commands": level.allowed_commands,
        "max_steps": level.max_steps,
        "time_limit": level.time_limit,
        "learning_goal": level.learning_goal
    }

@app.get("/api/levels/{level_id}")
async def get_level_detail(level_id: int):
    """Get detailed info for a specific level."""
    level = level_system.get_level(level_id)
    if not level:
        return {"error": "Level not found"}

    level_dict = level.to_dict()
    level_dict["unlocked"] = level_system.is_level_unlocked(level_id)
    level_dict["completed"] = level_id in level_system.progress.completed_levels
    level_dict["stars"] = level_system.progress.stars_earned.get(level_id, 0)
    level_dict["best_solution"] = level_system.progress.best_solutions.get(level_id)

    return level_dict

@app.get("/api/levels/{level_id}/hint")
async def get_level_hint(level_id: int, index: int = 0):
    """Get a hint for a specific level."""
    hint = level_system.get_hint(level_id, index)
    if not hint:
        return {"hint": None}

    return {
        "hint": hint,
        "index": index,
        "has_more": index < len(level_system.get_level(level_id).hints) - 1
    }

@app.post("/api/levels/progress/reset")
async def reset_level_progress():
    """Reset all level progress."""
    level_system.reset_progress()
    return {"success": True, "message": "Level progress reset"}

if __name__ == "__main__":
    print("\n" + "="*50)
    print("  LUMI SERVER RUNNING")
    print("="*50)
    print("\nOpen dashboard: http://localhost:5173")
    print("API docs: http://127.0.0.1:8000/docs")
    print("\nPress Ctrl+C to stop.\n")
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)
