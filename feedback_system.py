def generate_feedback(commands, is_success):
    """
    Generates short, positive rule-based feedback for a kids coding robot.
    
    Args:
        commands (list): List of command strings (e.g., ['forward', 'turn_right']).
        is_success (bool): Whether the robot reached the goal.
        
    Returns:
        str: A friendly, easy to understand feedback message.
    """
    # 1. Success case
    if is_success:
        # You could also randomize this to say "Awesome! You did it!" etc.
        return "Great job! Efficient solution!"
        
    # 2. Failure cases (analyzing the logic)
    
    # Did they put any blocks down?
    if not commands:
        return "Try adding some blocks to move the robot!"
        
    # Did they only use turns without moving?
    if "forward" not in commands:
        return "Don't forget to use 'forward' to actually move towards the goal!"
        
    # Check for unnecessary cancelling turns (turning right then immediately left)
    for i in range(len(commands) - 1):
        if (commands[i] == "turn_right" and commands[i+1] == "turn_left") or \
           (commands[i] == "turn_left" and commands[i+1] == "turn_right"):
            return "You can make this path shorter! Watch out for extra turns."
            
    # Check for "spinning" (3 or more turns in a row which could just be 1 turn)
    consecutive_turns = 0
    for cmd in commands:
        if cmd in ["turn_right", "turn_left"]:
            consecutive_turns += 1
            if consecutive_turns >= 3:
                return "You're spinning a lot! Can you find a shorter way to turn?"
        else:
            consecutive_turns = 0
            
    # Check for too few steps (assuming a short sequence that failed needs more length)
    if len(commands) <= 3:
        return "Try adding a few more forward steps!"
        
    # General fallback for a path that failed but doesn't hit any obvious bad patterns
    return "Oops, not quite there! Check your steps and try again."


if __name__ == "__main__":
    # --- Tests based on your examples ---
    
    # Unnecessary turns
    print(f"Test 1: {generate_feedback(['forward', 'turn_right', 'turn_left', 'forward'], False)}")
    
    # Too few steps
    print(f"Test 2: {generate_feedback(['forward'], False)}")
    
    # Forgetting to move
    print(f"Test 3: {generate_feedback(['turn_right', 'turn_right'], False)}")
    
    # Success
    print(f"Test 4: {generate_feedback(['forward', 'forward', 'turn_right', 'forward'], True)}")
