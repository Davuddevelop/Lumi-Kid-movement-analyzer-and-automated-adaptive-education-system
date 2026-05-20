"""Story mode content — narrative text per chapter/level."""

CHAPTER_STORIES = {
    1: {
        "name": "Space Station",
        "emoji": "🚀",
        "theme_color": "#7c5cfc",
        "intro": "Lumi's rocket got lost in deep space! Help guide it back to the Space Station by placing the right blocks in order.",
        "levels": {
            1: "Your first mission! Guide Lumi straight to the landing pad. 🛸",
            2: "The path is a little longer now. How many steps does Lumi need?",
            3: "There's a turn ahead! Which way should Lumi go?",
            4: "Left or right? You decide which path leads home!",
            5: "Final test of the Space Station! Can you find the perfect route?",
        }
    },
    2: {
        "name": "Crystal Caves",
        "emoji": "💎",
        "theme_color": "#4ecdc4",
        "intro": "Deep inside the Crystal Caves, a magical gem is waiting! But the path is full of rocks. Program Lumi to dodge them all!",
        "levels": {
            6:  "Your first obstacle! Can you steer around the crystal boulder?",
            7:  "Two paths through the cave — only one leads to the gem!",
            8:  "The rocks are tricky this time. Think before you place!",
            9:  "Almost at the gem! One wrong turn and Lumi crashes.",
            10: "The Grand Crystal awaits! Navigate the toughest cave yet!",
        }
    },
    3: {
        "name": "Robot City",
        "emoji": "🤖",
        "theme_color": "#ff9f43",
        "intro": "Robot City's robots are confused! They need a programmer to teach them loops. Use the red repeat block to help them work smarter!",
        "levels": {
            11: "Your first loop! The red block makes the last move happen twice.",
            12: "Loops save time — can you use fewer blocks to go farther?",
            13: "The robots love efficiency. Use loops wherever you can!",
            14: "Advanced loop challenge! Combine loops with turns.",
            15: "Master of loops! Solve this city-wide programming puzzle!",
        }
    },
    4: {
        "name": "Star Temple",
        "emoji": "⭐",
        "theme_color": "#ffd166",
        "intro": "The ancient Star Temple only opens for the greatest programmers! These are the hardest challenges Lumi has ever faced. Do you have what it takes?",
        "levels": {
            16: "The temple awakens! A complex maze blocks the sacred star.",
            17: "Ancient traps everywhere — one wrong move and it's over!",
            18: "The temple guardian challenges you to a perfect solution.",
            19: "Only three moves allowed — use them wisely!",
            20: "FINAL CHALLENGE: The Grand Star awaits the ultimate programmer! ⭐👑",
        }
    }
}

def get_chapter_for_level(level_id: int) -> int:
    if level_id <= 5:  return 1
    if level_id <= 10: return 2
    if level_id <= 15: return 3
    return 4

def get_story_for_level(level_id: int) -> dict:
    chapter = get_chapter_for_level(level_id)
    chapter_data = CHAPTER_STORIES.get(chapter, CHAPTER_STORIES[1])
    level_story = chapter_data["levels"].get(level_id, "A new challenge awaits!")
    return {
        "chapter": chapter,
        "chapter_name": chapter_data["name"],
        "chapter_emoji": chapter_data["emoji"],
        "theme_color": chapter_data["theme_color"],
        "chapter_intro": chapter_data["intro"],
        "level_story": level_story,
    }

def get_all_chapters() -> list:
    return [
        {
            "chapter": ch,
            "name": data["name"],
            "emoji": data["emoji"],
            "theme_color": data["theme_color"],
            "intro": data["intro"],
            "level_range": [min(data["levels"].keys()), max(data["levels"].keys())],
        }
        for ch, data in CHAPTER_STORIES.items()
    ]
