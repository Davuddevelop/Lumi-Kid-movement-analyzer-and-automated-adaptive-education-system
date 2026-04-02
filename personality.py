"""
Lumi Personality System
Adjusts response tone based on mode:
- coach: supportive, encouraging
- challenger: pushes harder, more demanding
- friendly: casual, fun tone
"""
from typing import Dict, List
from dataclasses import dataclass
import random

@dataclass
class Personality:
    id: str
    name: str
    description: str
    emoji: str


PERSONALITIES = {
    "coach": Personality(
        "coach", "Coach Lumi",
        "Supportive and encouraging, celebrates every step",
        "🏅"
    ),
    "challenger": Personality(
        "challenger", "Challenger Lumi",
        "Pushes you to do better, expects excellence",
        "🔥"
    ),
    "friendly": Personality(
        "friendly", "Buddy Lumi",
        "Casual and fun, like talking to a friend",
        "😄"
    ),
}

# Response templates by category and personality
RESPONSES = {
    # === SUCCESS RESPONSES ===
    "success": {
        "coach": [
            "Excellent work! I knew you could do it!",
            "You nailed it! That's the kind of thinking I love to see!",
            "Brilliant! Your hard work is paying off!",
            "Outstanding! You should be so proud of yourself!",
            "Yes! That's exactly right! Great job!",
        ],
        "challenger": [
            "Good. You got it. Ready for something harder?",
            "Correct. But can you do it faster next time?",
            "That's right. Now let's see if you can keep it up.",
            "You solved it. Don't get comfortable though!",
            "Finally! Now that's what I expected from you.",
        ],
        "friendly": [
            "Woohoo! You totally crushed it!",
            "Yay! High five! That was awesome!",
            "Boom! You got it! You're on fire today!",
            "Nice one! See, I told you you could do it!",
            "Heck yeah! That's what I'm talking about!",
        ],
    },

    # === FAILURE RESPONSES ===
    "failure": {
        "coach": [
            "That's okay! Every mistake is a chance to learn.",
            "Don't worry, you're getting closer! Let's try again.",
            "I believe in you! Take your time and think it through.",
            "Mistakes help us grow! You've got this!",
            "It's alright! Learning takes practice.",
        ],
        "challenger": [
            "Nope. Think harder. You can do better than that.",
            "Wrong. Come on, focus! What did you miss?",
            "Not quite. I know you're smarter than this.",
            "Try again. Don't give up so easily!",
            "Incorrect. But I won't let you quit. Try again!",
        ],
        "friendly": [
            "Oops! No worries, let's give it another shot!",
            "Aww, so close! Wanna try again?",
            "Hmm, not quite! But hey, that's how we learn!",
            "Whoopsie! Let's figure this out together!",
            "Nah, that's not it. But no biggie, try again!",
        ],
    },

    # === HINT OFFER ===
    "hint_offer": {
        "coach": [
            "Would you like me to give you a helpful hint?",
            "I can give you a little guidance if you'd like. Want a hint?",
            "Need some support? I'm here to help!",
        ],
        "challenger": [
            "Stuck? Fine, I can give you ONE hint. Want it?",
            "Need help? Think carefully before you ask.",
            "I can give you a hint, but try harder first. Still want it?",
        ],
        "friendly": [
            "Hey, want a little hint? No judgment!",
            "Psst... need a clue? I got you!",
            "Want me to spill a secret hint?",
        ],
    },

    # === HINT GIVEN ===
    "hint_given": {
        "coach": [
            "Here's a helpful tip: {hint}",
            "Let me guide you: {hint}",
            "Great question! Here's what to think about: {hint}",
        ],
        "challenger": [
            "Alright, here's your hint: {hint} Now figure it out!",
            "Fine. {hint} Don't ask again!",
            "Here: {hint} Now prove you can use it!",
        ],
        "friendly": [
            "Okay okay, here's the scoop: {hint}",
            "Between you and me: {hint}",
            "Here's a little secret: {hint}",
        ],
    },

    # === ENCOURAGEMENT (declined hint) ===
    "encouragement": {
        "coach": [
            "I love that attitude! You've got this!",
            "That's the spirit! I believe in you!",
            "Great choice! Trust yourself!",
        ],
        "challenger": [
            "Good. Prove you don't need help.",
            "That's what I like to hear. Now show me what you've got.",
            "No hints? Respect. Now deliver.",
        ],
        "friendly": [
            "Ooh, going solo! I like it! You got this!",
            "Brave! I'm rooting for you!",
            "No hints needed, huh? Alright superstar, show me!",
        ],
    },

    # === SPEED PRAISE ===
    "fast_answer": {
        "coach": [
            "Wow, that was quick! Great reflexes!",
            "Fast AND correct! You're really getting this!",
            "Speed and accuracy! Impressive!",
        ],
        "challenger": [
            "Quick. Good. Keep that pace up.",
            "Fast answer. Can you maintain that speed?",
            "Not bad. But can you go even faster?",
        ],
        "friendly": [
            "Whoa, speedy! You're like a coding ninja!",
            "Zoom! That was lightning fast!",
            "Holy moly, that was quick! Nice!",
        ],
    },

    # === SLOW ANSWER ===
    "slow_answer": {
        "coach": [
            "Take your time - thinking carefully is important!",
            "Good thinking! It's okay to be thorough.",
            "Careful thought leads to great answers!",
        ],
        "challenger": [
            "That took a while. Work on your speed.",
            "Slow. You need to think faster.",
            "You got it, but next time be quicker.",
        ],
        "friendly": [
            "No rush! Good things take time!",
            "Hey, slow and steady wins the race!",
            "Taking your time? That's totally cool!",
        ],
    },

    # === STREAK MESSAGES ===
    "streak": {
        "coach": [
            "Amazing streak! You're on a roll!",
            "Keep it going! You're doing fantastic!",
            "{count} in a row! I'm so proud of you!",
        ],
        "challenger": [
            "{count} streak. Don't break it now.",
            "Good run. But the real test is consistency.",
            "{count} correct. Impressive. Keep proving yourself.",
        ],
        "friendly": [
            "Dude, {count} in a row?! You're crushing it!",
            "Hot streak alert! {count} correct! Wooo!",
            "You're on FIRE! {count} straight!",
        ],
    },

    # === GREETING ===
    "greeting": {
        "coach": [
            "Hello! Ready to learn and grow today?",
            "Welcome back! Let's achieve great things together!",
            "Hi there! I'm excited to help you succeed!",
        ],
        "challenger": [
            "You're here. Good. Let's get to work.",
            "Ready for a challenge? Let's begin.",
            "Time to prove yourself. Let's go.",
        ],
        "friendly": [
            "Hey hey! What's up? Ready to have some fun?",
            "Yo! Great to see you! Let's do this!",
            "Hiya! Ready to code and have a blast?",
        ],
    },
}


class PersonalitySystem:
    """Manages Lumi's personality and response tone."""

    def __init__(self, default_mode: str = "coach"):
        self.current_mode = default_mode if default_mode in PERSONALITIES else "coach"

    def set_mode(self, mode: str) -> bool:
        """Set the personality mode."""
        if mode in PERSONALITIES:
            self.current_mode = mode
            return True
        return False

    def get_mode(self) -> str:
        """Get current personality mode."""
        return self.current_mode

    def get_personality(self) -> Personality:
        """Get current personality info."""
        return PERSONALITIES[self.current_mode]

    def get_response(self, category: str, **kwargs) -> str:
        """
        Get a response for the given category in current personality.
        Supports template variables via kwargs.
        """
        if category not in RESPONSES:
            return "..."

        mode_responses = RESPONSES[category].get(self.current_mode)
        if not mode_responses:
            mode_responses = RESPONSES[category].get("coach", ["..."])

        response = random.choice(mode_responses)

        # Apply template variables
        for key, value in kwargs.items():
            response = response.replace(f"{{{key}}}", str(value))

        return response

    def adjust_feedback(self, base_feedback: str, context: str = "neutral") -> str:
        """
        Adjust existing feedback text based on personality.
        Adds personality-appropriate prefix/suffix.
        """
        personality = PERSONALITIES[self.current_mode]

        prefixes = {
            "coach": ["Great effort! ", "Keep going! ", "You're doing well! "],
            "challenger": ["Listen up: ", "Pay attention: ", "Focus: "],
            "friendly": ["Hey! ", "So like, ", "Okay so "],
        }

        # For success context, don't add prefix
        if context in ["success", "correct"]:
            return base_feedback

        # Add personality prefix occasionally
        if random.random() < 0.3:
            prefix = random.choice(prefixes.get(self.current_mode, [""]))
            return prefix + base_feedback

        return base_feedback

    def get_all_modes(self) -> Dict:
        """Get all available personality modes."""
        return {
            pid: {
                "name": p.name,
                "description": p.description,
                "emoji": p.emoji,
                "active": pid == self.current_mode
            }
            for pid, p in PERSONALITIES.items()
        }


# ============================================
# TEST
# ============================================
if __name__ == "__main__":
    system = PersonalitySystem()

    print("=" * 50)
    print("  PERSONALITY SYSTEM TEST")
    print("=" * 50)

    for mode in ["coach", "challenger", "friendly"]:
        system.set_mode(mode)
        personality = system.get_personality()

        print(f"\n--- [{mode.upper()}] {personality.name} ---")
        print(f"Description: {personality.description}")

        print("\n  Success:")
        print(f"    {system.get_response('success')}")

        print("  Failure:")
        print(f"    {system.get_response('failure')}")

        print("  Hint offer:")
        print(f"    {system.get_response('hint_offer')}")

        print("  Fast answer:")
        print(f"    {system.get_response('fast_answer')}")

        print("  Streak (5):")
        print(f"    {system.get_response('streak', count=5)}")

        print("  Greeting:")
        print(f"    {system.get_response('greeting')}")
