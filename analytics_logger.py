import json
import os
from collections import Counter
from datetime import datetime

LOG_FILE = "lumi_mission_logs.json"

class MissionLogger:
    def __init__(self, log_file=LOG_FILE):
        self.log_file = log_file
        if not os.path.exists(self.log_file):
            with open(self.log_file, 'w') as f:
                json.dump({"sessions": []}, f)
                
        self.current_session = None

    def start_mission(self, mission_id, kid_name="Player 1"):
        """Initializes a new recording session."""
        self.current_session = {
            "mission_id": mission_id,
            "kid_name": kid_name,
            "start_time": datetime.now().isoformat(),
            "attempts": []
        }
        
    def log_attempt(self, commands, result, duration_seconds, mistake_tag=None):
        """
        Logs a single run.
        result: 'success', 'fail', 'partial'
        mistake_tag: Optional categorization of the error (e.g. 'crashed', 'redundant_turns')
        """
        if not self.current_session:
            print("Warning: Please run start_mission() before logging attempts!")
            return
            
        # Auto-tag pedagogical mistakes if the run failed and no tag was explicitly provided
        if result == 'fail' and not mistake_tag:
            mistake_tag = self._analyze_mistake(commands)
            
        attempt = {
            "timestamp": datetime.now().isoformat(),
            "commands": commands,
            "result": result,
            "duration_seconds": duration_seconds,
            "mistake_tag": mistake_tag
        }
        
        self.current_session["attempts"].append(attempt)
        
        # If they finally beat it, auto-save and close the session tracker
        if result == 'success':
            self.save_session()
            
    def _analyze_mistake(self, commands):
        """Analyzes the array of physical blocks to figure out what cognitive mistake the kid made."""
        if not commands:
            return "empty_sequence"
        if "forward" not in commands:
            return "forgot_forward"
        for i in range(len(commands)-1):
            if (commands[i] == 'turn_right' and commands[i+1] == 'turn_left') or \
               (commands[i] == 'turn_left' and commands[i+1] == 'turn_right'):
                return "redundant_turns"
        return "crashed_into_obstacle"

    def log_interaction(self, text, analysis):
        """Logs a verbal interaction between the kid and Lumi."""
        if not self.current_session:
            return
            
        if "interactions" not in self.current_session:
            self.current_session["interactions"] = []
            
        interaction = {
            "timestamp": datetime.now().isoformat(),
            "speech": text,
            "analysis": analysis
        }
        self.current_session["interactions"].append(interaction)
        # Periodic save if interaction occurs
        self._temp_save()

    def _temp_save(self):
        """Quick save without closing session."""
        if not self.current_session: return
        try:
            with open(self.log_file, 'r') as f:
                data = json.load(f)
        except:
            data = {"sessions": []}
            
        # Update current session in data if it exists, else append
        found = False
        for i, s in enumerate(data.get("sessions", [])):
            if s.get("start_time") == self.current_session["start_time"]:
                data["sessions"][i] = self.current_session
                found = True
                break
        if not found:
            # We don't want to double append, but for live logging we might
            pass 
            
        with open(self.log_file, 'w') as f:
            json.dump(data, f, indent=4)

    def save_session(self):
        """Saves all the retry attempts to the central JSON database."""
        if not self.current_session: return
        
        try:
            with open(self.log_file, 'r') as f:
                data = json.load(f)
        except Exception:
            data = {"sessions": []}
            
        self.current_session["end_time"] = datetime.now().isoformat()
        self.current_session["total_retries"] = len(self.current_session["attempts"]) - 1
        data["sessions"].append(self.current_session)
        
        with open(self.log_file, 'w') as f:
            json.dump(data, f, indent=4)
            
        self.current_session = None


def generate_analytics_report(log_file=LOG_FILE):
    """
    Parses the JSON database to generate a highly customized teacher's educational progress report.
    """
    if not os.path.exists(log_file):
        print("No logs found to generate an analytics report.")
        return
        
    with open(log_file, 'r') as f:
        data = json.load(f)
        
    sessions = data.get("sessions", [])
    if not sessions:
        print("No completed mission data found in the database.")
        return
        
    total_attempts = 0
    successful_attempts = 0
    total_time = 0
    total_retries = 0
    mistakes = []
    
    for session in sessions:
        total_retries += session.get("total_retries", 0)
        for att in session["attempts"]:
            total_attempts += 1
            total_time += att.get("duration_seconds", 0)
            if att["result"] == "success":
                successful_attempts += 1
            if att.get("mistake_tag"):
                mistakes.append(att["mistake_tag"])
                
    success_rate = (successful_attempts / total_attempts) * 100 if total_attempts > 0 else 0
    avg_time = total_time / len(sessions) if sessions else 0
    avg_retries = total_retries / len(sessions) if sessions else 0
    
    print("\n" + "="*45)
    print(" 📈 LUMI TEACHER ANALYTICS REPORT 📈")
    print("="*45)
    print(f"Total Missions Played  : {len(sessions)}")
    print(f"Total Robot Runs       : {total_attempts}")
    print(f"Average Retries Needed : {avg_retries:.1f} retries per mission")
    print(f"Overall Success Rate   : {success_rate:.1f}%")
    print(f"Avg Time Per Mission   : {avg_time:.1f} seconds")
    
    if mistakes:
        counter = Counter(mistakes)
        most_common = counter.most_common(1)[0][0]
        print(f"\n=> Most Common Cognitive Mistake: '{most_common}'")
        
        print("\n=> Suggested Pedagogical Improvements:")
        if most_common == "redundant_turns":
            print("  - The children are struggling with spatial orientation.")
            print("  - FIX: Provide a physical 3D grid toy for them to practice left/right turning without canceling themselves out.")
        elif most_common == "forgot_forward":
            print("  - The children keep placing turn blocks but don't place green forward blocks.")
            print("  - FIX: Remind them that turning happens locally in place, they still need gas to drive!")
        elif most_common == "crashed_into_obstacle":
            print("  - They are driving into the rocks frequently.")
            print("  - FIX: Slow down the missions. Break the maze into smaller intermediate checkpoints.")
        elif most_common == "empty_sequence":
            print("  - Empty block sequences are heavily being fired.")
            print("  - FIX: Check your webcam! The color detector might be missing the physical blocks due to glare.")
        else:
            print(f"  - Plan an adaptive lesson focusing on concepts related to '{most_common}'.")
    else:
        print("\n=> Suggested Pedagogical Improvements:")
        print("  - Perfect 100% run history! The kids are completely mastering the mechanical content.")
        print("  - FIX: Time to scale up the difficulty by unlocking the 'Loop' blocks and larger mazes!")
        
    print("="*45 + "\n")

if __name__ == "__main__":
    # --- DEMONSTRATION RECORDING ---
    test_db = "demo_logs.json"
    if os.path.exists(test_db):
        os.remove(test_db)
        
    logger = MissionLogger(test_db)
    
    logger.start_mission("m1_obstacle_avoidance", kid_name="Timmy")
    # Attempt 1: Spun in circles
    logger.log_attempt(['turn_right', 'turn_left'], 'fail', duration_seconds=12) 
    # Attempt 2: Crashed into Rock
    logger.log_attempt(['forward', 'turn_right', 'forward'], 'fail', duration_seconds=15) 
    # Attempt 3: Won it!
    logger.log_attempt(['forward', 'turn_left', 'forward', 'turn_right', 'forward'], 'success', duration_seconds=22) 
    
    logger.start_mission("m1_obstacle_avoidance", kid_name="Sarah")
    # Sarah finishes in 1 try
    logger.log_attempt(['forward', 'turn_left', 'forward', 'turn_right', 'forward'], 'success', duration_seconds=18)
    
    # Generate the actual report!
    generate_analytics_report(test_db)
