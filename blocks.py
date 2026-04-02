# Mapping of physical block colors to logical robot commands
# and their metadata for the dashboard frontend.

BLOCKS = {
    'forward': {
        'color': 'green',
        'description': 'Move the robot one step forward matching its current direction.',
        'icon': 'ArrowUp'
    },
    'turn_right': {
        'color': 'blue',
        'description': 'Rotate the robot 90 degrees clockwise without moving.',
        'icon': 'CornerDownRight'
    },
    'turn_left': {
        'color': 'yellow',
        'description': 'Rotate the robot 90 degrees counter-clockwise without moving.',
        'icon': 'CornerDownLeft'
    },
    'loop': {
        'color': 'red',
        'description': 'Repeat the previous block 2 times to save space!',
        'icon': 'Repeat'
    },
    'loop_start': {
        'color': 'orange',
        'description': 'Start a loop section - everything until loop_end repeats!',
        'icon': 'PlayCircle',
        'advanced': True
    },
    'loop_end': {
        'color': 'purple',
        'description': 'End the loop section and repeat everything inside.',
        'icon': 'StopCircle',
        'advanced': True
    }
}

# Quick lookup for the color detector
COLOR_TO_COMMAND = {v['color']: k for k, v in BLOCKS.items()}
