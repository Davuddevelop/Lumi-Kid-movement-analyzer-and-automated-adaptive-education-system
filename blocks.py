# Mapping of physical block colors to logical robot commands
# and their metadata for the dashboard frontend.
#
# Presentation setup (2 block types only):
#   BLACK block = forward  (move robot one cell ahead)
#   RED block   = backward (move robot one cell back)

BLOCKS = {
    'forward': {
        'color': 'black',
        'description': 'Move the robot one step forward.',
        'icon': 'ArrowUp'
    },
    'backward': {
        'color': 'red',
        'description': 'Move the robot one step backward.',
        'icon': 'ArrowDown'
    },
}

# Quick lookup: color name → command string
COLOR_TO_COMMAND = {v['color']: k for k, v in BLOCKS.items()}
