def get_kid_feedback(commands, result):
    """
    Generates kid-friendly, encouraging feedback under 100 characters.
    
    Args:
        commands (list): e.g. ['forward', 'turn_right']
        result (str): 'success', 'partial', or 'fail'
        
    Returns:
        str: Feedback message (len < 100)
    """
    if result == 'success':
        return "Great job! You reached the goal efficiently! 🌟"
        
    if not commands:
        return "Oops! Put some blocks down to make the robot move! 🤖"
        
    if result == 'partial':
        if len(commands) < 3:
            return "You're on the right track! Try adding one more step forward! 🚀"
        if "turn_right" not in commands and "turn_left" not in commands:
            return "Good start! But maybe we need to turn to reach the goal? 🔄"
        return "Almost there! Keep trying, you're super close! 🧩"
        
    if result == 'fail':
        # Check for immediate spin cancels
        for i in range(len(commands)-1):
            if (commands[i] == 'turn_right' and commands[i+1] == 'turn_left') or \
               (commands[i] == 'turn_left' and commands[i+1] == 'turn_right'):
                return "Watch out for extra turns! Right then left just makes us dizzy! 😵"
                
        if 'forward' not in commands:
            return "Don't forget to use the green Forward block to move! 🟢"
            
        return "Oops, we hit a snag! Let's adjust the blocks and try again! 💪"
        
    return "Keep coding! You can do it! ✨"

if __name__ == "__main__":
    def print_test(cmds, res):
        feedback = get_kid_feedback(cmds, res)
        print(f"[{res.upper()}] {cmds} -> \"{feedback}\" (Len: {len(feedback)})")

    print_test(['forward', 'turn_right'], 'success')
    print_test(['forward'], 'partial')
    print_test(['turn_right', 'turn_left'], 'fail')
    print_test(['turn_right', 'turn_right'], 'fail')
    print_test(['forward', 'forward', 'turn_right', 'forward'], 'partial')
