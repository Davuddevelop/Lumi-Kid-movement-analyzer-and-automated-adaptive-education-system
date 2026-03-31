def get_suggestion(status, path, commands, grid_size=8):
    """
    Analyzes robot performance and returns a short tip (max 12 words).
    """
    if not status or status == 'idle':
        # Analyze commands even if idle to give pre-emptive tips
        if len(commands) >= 3:
            # 1. Detect 3 same turns (Redundant)
            for i in range(len(commands)-2):
                if commands[i:i+3] == ['turn_left', 'turn_left', 'turn_left']:
                    return "Psst! Three left turns is just one right turn!"
                if commands[i:i+3] == ['turn_right', 'turn_right', 'turn_right']:
                    return "Smart tip: Three right turns is just one left turn!"
            
            # 2. Detect back-and-forth (Spinning)
            for i in range(len(commands)-1):
                if (commands[i] == 'turn_left' and commands[i+1] == 'turn_right') or \
                   (commands[i] == 'turn_right' and commands[i+1] == 'turn_left'):
                    return "Careful! Turning left then right puts you back where you started."

            # 3. Detect repetitive forward (Loop Suggestion)
            forward_count = 0
            for cmd in commands:
                if cmd == 'forward': forward_count += 1
                else: forward_count = 0
                if forward_count >= 3:
                    return "You're moving a lot! A 'Loop' block could save you some work."

        return ""
    
    # 4. Detect Collision (Fail/Error)
    if status in ['error', 'fail']:
        return "Watch out! Try turning earlier to avoid that block."
    
    # 5. Detect Success & Path Length
    if status == 'success':
        if len(path) > grid_size * 1.5:
            return "Goal reached! Can you find a shorter path next time?"
        
        return "Amazing! You're becoming a pro coder!"
    
    return ""
