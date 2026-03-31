def validate_lego_sequence(commands, iterations=2):
    """
    Validates a kid's physical block sequence containing LEGO-style loop wrappers
    ('loop_start' and 'loop_end').
    
    Args:
        commands (list): Raw list of detected blocks e.g. ['forward', 'loop_start', 'turn_right', 'forward', 'loop_end']
        iterations (int): How many times the loop should repeat if valid (default 2 based on your previous logic).
        
    Returns:
        dict: Information regarding the sequence health, warnings, and the unrolled executable path.
    """
    warnings = []
    is_valid = True
    
    # 1. Catch Mismatched Block Counts
    start_count = commands.count('loop_start')
    end_count = commands.count('loop_end')
    
    if start_count != end_count:
        warnings.append(f"Mismatched loops! Found {start_count} 'loop_start' blocks but {end_count} 'loop_end' blocks.")
        is_valid = False

    suggested_correction = []
    ready_sequence = []
    
    in_loop = False
    loop_body = []
    
    for cmd in commands:
        if cmd == 'loop_start':
            if in_loop:
                warnings.append("⚠️ Nested loops detected. Simplifying by ignoring inner 'loop_start'.")
                is_valid = False
            else:
                in_loop = True
                loop_body = []
                
        elif cmd == 'loop_end':
            if not in_loop:
                warnings.append("⚠️ Found a 'loop_end' but no loop was started! Removing the extra block.")
                is_valid = False
            else:
                in_loop = False
                # 2. Check if loop is too short or empty
                if len(loop_body) == 0:
                    warnings.append("⚠️ Empty loop detected! A loop must contain commands. Removing it.")
                    is_valid = False
                elif len(loop_body) == 1:
                    warnings.append(f"⚠️ Redundant loop! Looping a single '{loop_body[0]}' block is unnecessary.")
                    is_valid = False
                    
                    # Correction: just place the block normally multiple times instead of using wrapping loops
                    suggested_correction.extend([loop_body[0]] * iterations)
                    ready_sequence.extend([loop_body[0]] * iterations)
                else:
                    # Valid loop with >= 2 commands!
                    suggested_correction.append('loop_start')
                    suggested_correction.extend(loop_body)
                    suggested_correction.append('loop_end')
                    
                    # Compute the actual linear path for the physical robot compiler
                    for _ in range(iterations):
                        ready_sequence.extend(loop_body)
                        
        else: # Standard commands like 'forward', 'turn_right'
            if in_loop:
                loop_body.append(cmd)
            else:
                suggested_correction.append(cmd)
                ready_sequence.append(cmd)
                
    # 3. Check if loop was never closed (End of sequence reached)
    if in_loop:
        warnings.append("⚠️ You forgot to place a 'loop_end' block! Auto-closing it.")
        is_valid = False
        if len(loop_body) >= 2:
            suggested_correction.append('loop_start')
            suggested_correction.extend(loop_body)
            suggested_correction.append('loop_end')
            
            for _ in range(iterations):
                ready_sequence.extend(loop_body)
                
        elif len(loop_body) == 1:
            suggested_correction.extend([loop_body[0]] * iterations)
            ready_sequence.extend([loop_body[0]] * iterations)

    return {
        "is_valid": is_valid,
        "warnings": warnings,
        "suggested_correction": suggested_correction,
        "ready_to_run_sequence": ready_sequence
    }

if __name__ == "__main__":
    def print_report(title, test_seq):
        print(f"\n=== {title} ===")
        print(f"Input: {test_seq}")
        res = validate_lego_sequence(test_seq)
        for w in res['warnings']:
            print(w)
        print(f"Suggested Physical Fix: {res['suggested_correction']}")
        print(f"Robot Executable Path: {res['ready_to_run_sequence']}")

    # Test 1: Valid sequence
    print_report("Test 1: Perfect Loop", 
                 ['forward', 'loop_start', 'turn_right', 'forward', 'loop_end'])
                 
    # Test 2: Only 1 command inside loop
    print_report("Test 2: Short Redundant Loop", 
                 ['loop_start', 'forward', 'loop_end', 'turn_left'])
                 
    # Test 3: Forgot to close the loop
    print_report("Test 3: Unclosed Loop", 
                 ['turn_left', 'loop_start', 'forward', 'turn_right'])
                 
    # Test 4: Empty Loop
    print_report("Test 4: Empty Loop", 
                 ['forward', 'loop_start', 'loop_end'])
