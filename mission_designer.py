import tkinter as tk
from tkinter import messagebox, simpledialog
import json
import os

class MissionDesigner:
    def __init__(self, root, width=8, height=8):
        self.root = root
        self.root.title("Lumi Mission Designer 🧩")
        self.root.configure(bg="#f8fafc")
        
        self.width = width
        self.height = height
        
        self.mode = "START" # START, GOAL, OBSTACLE
        self.start_pos = None
        self.goal_pos = None
        self.obstacles = set()
        
        self.setup_ui()
        
    def setup_ui(self):
        # Header layout
        header = tk.Label(self.root, text="Design Your Own Robot Mission!", font=("Arial", 16, "bold"), bg="#f8fafc", fg="#333", pady=10)
        header.pack()

        # Tools panel
        tools_frame = tk.Frame(self.root, pady=10, bg="#f8fafc")
        tools_frame.pack()
        
        tk.Label(tools_frame, text="Select Tool:", font=("Arial", 12, "bold"), bg="#f8fafc").pack(side=tk.LEFT, padx=10)
        
        self.btn_start = tk.Button(tools_frame, text="🟢 Start", bg="#a7f3d0", font=("Arial", 12), command=lambda: self.set_mode("START"), width=10)
        self.btn_start.pack(side=tk.LEFT, padx=5)
        
        self.btn_goal = tk.Button(tools_frame, text="⭐ Goal", bg="#fef08a", font=("Arial", 12), command=lambda: self.set_mode("GOAL"), width=10)
        self.btn_goal.pack(side=tk.LEFT, padx=5)
        
        self.btn_obs = tk.Button(tools_frame, text="🪨 Obstacle", bg="#94a3b8", fg="white", font=("Arial", 12), command=lambda: self.set_mode("OBSTACLE"), width=10)
        self.btn_obs.pack(side=tk.LEFT, padx=5)
        
        self.lbl_mode = tk.Label(self.root, text="Click on the grid to place the Start position!", font=("Arial", 12, "italic"), fg="#16a34a", bg="#f8fafc", pady=10)
        self.lbl_mode.pack()
        
        # Grid panel
        self.grid_frame = tk.Frame(self.root, padx=20, pady=10, bg="#e2e8f0")
        self.grid_frame.pack()
        
        self.buttons = {}
        for y in range(self.height):
            for x in range(self.width):
                btn = tk.Button(self.grid_frame, width=4, height=2, bg="white", font=("Arial", 14),
                                command=lambda r=x, c=y: self.cell_clicked(r, c))
                btn.grid(row=y, column=x, padx=2, pady=2)
                self.buttons[(x, y)] = btn
                
        # Save Button
        save_btn = tk.Button(self.root, text="💾 Save Mission!", bg="#8b5cf6", fg="white", font=("Arial", 14, "bold"), pady=5, command=self.save_mission)
        save_btn.pack(pady=15)
        
    def set_mode(self, mode):
        self.mode = mode
        if mode == "START":
            self.lbl_mode.config(text="Mode: Place Start Block 🟢", fg="#16a34a")
        elif mode == "GOAL":
            self.lbl_mode.config(text="Mode: Place Goal Flag ⭐", fg="#ca8a04")
        else:
            self.lbl_mode.config(text="Mode: Place Rock Obstacles 🪨", fg="#475569")
        
    def cell_clicked(self, x, y):
        # Clear existing
        if self.mode == "START":
            if self.start_pos:
                self.buttons[self.start_pos].config(bg="white", text="")
            self.start_pos = (x, y)
            self.buttons[(x, y)].config(bg="#4ade80", text="🤖")
            if (x, y) in self.obstacles: self.obstacles.remove((x, y))
            
        elif self.mode == "GOAL":
            if self.goal_pos:
                self.buttons[self.goal_pos].config(bg="white", text="")
            self.goal_pos = (x, y)
            self.buttons[(x, y)].config(bg="#fde047", text="🏁")
            if (x, y) in self.obstacles: self.obstacles.remove((x, y))
            
        elif self.mode == "OBSTACLE":
            if (x, y) == self.start_pos: self.start_pos = None
            if (x, y) == self.goal_pos: self.goal_pos = None
            
            if (x, y) in self.obstacles:
                self.obstacles.remove((x, y))
                self.buttons[(x, y)].config(bg="white", text="")
            else:
                self.obstacles.add((x, y))
                self.buttons[(x, y)].config(bg="#94a3b8", text="🪨")
                
    def generate_hint(self):
        """Analyzes the obstacle grid logic to auto-generate a coding hint for the kids."""
        sx, sy = self.start_pos
        gx, gy = self.goal_pos
        dist = abs(sx - gx) + abs(sy - gy)
        
        # Check if obstacles block direct line
        direct_blocked = False
        for ox, oy in self.obstacles:
            if (min(sx, gx) <= ox <= max(sx, gx)) and (min(sy, gy) <= oy <= max(sy, gy)):
                direct_blocked = True
                
        if len(self.obstacles) > (self.width * self.height) * 0.3:
            return "Wow, that's a crowded maze! Watch out for tight corners and use 'Turn' blocks wisely!"
        elif direct_blocked:
            return "There are rocks blocking the quickest route. You'll definitely need to use Turn blocks to detour around them!"
        elif dist > 7:
            return "It's a really long journey! Try using the 'Loop' block so you don't have to write so many Forward blocks."
            
        return "Looks like a safe open path! Use Forward blocks to speed straight to the flag."
        
    def save_mission(self):
        if not self.start_pos or not self.goal_pos:
            messagebox.showwarning("Incomplete Mission", "Wait! You must place both a 🤖 Start and a 🏁 Goal!")
            return
            
        name = simpledialog.askstring("Mission Name", "What do you want to call your awesome mission?", initialvalue="My Awesome Mission")
        if not name: return # User cancelled
        
        hint = self.generate_hint()
        mission_id = name.lower().replace(" ", "_")
        
        # Construct JSON 
        data = {
            "id": mission_id,
            "name": name,
            "description": f"A custom mission designed by you! TIP: {hint}",
            "learning_objective": "Custom Mission Sandbox Execution",
            "grid_size": {"width": self.width, "height": self.height},
            "start": {"x": self.start_pos[0], "y": self.start_pos[1], "direction": "EAST"},
            "goal": {"x": self.goal_pos[0], "y": self.goal_pos[1]},
            "obstacles": [{"x": ox, "y": oy} for ox, oy in self.obstacles],
            "tools_allowed": ["forward", "turn_right", "turn_left", "loop_start", "loop_end"]
        }
        
        filename = "custom_mission.json"
        
        try:
            with open(filename, 'w', encoding="utf-8") as f:
                json.dump({"missions": [data]}, f, indent=4)
            messagebox.showinfo("Mission Saved!", f"Your custom mission '{name}' is ready to be played!\n\nAuto-Generated Hint for your friends:\n{hint}")
        except Exception as e:
            messagebox.showerror("System Error", f"Failed to save your mission: {e}")

if __name__ == "__main__":
    root = tk.Tk()
    app = MissionDesigner(root)
    # Lock the window size for a stable rigid grid visual
    root.resizable(False, False)
    root.mainloop()
