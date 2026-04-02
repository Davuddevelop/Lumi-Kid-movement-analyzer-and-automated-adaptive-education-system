import re

class MindAnalyzer:
    """
    Analyzes child speech for emotional and cognitive states.
    """
    
    KEYWORDS = {
        "joy": [r"yes", r"yay", r"wow", r"fun", r"cool", r"awesome", r"did it", r"easy", r"happy", r"love"],
        "frustration": [r"hard", r"difficult", r"sucks", r"bad", r"can't", r"unable", r"not working", r"again", r"hate", r"stupid"],
        "confusion": [r"how", r"why", r"what", r"where", r"don't know", r"help", r"confus", r"stuck"],
        "curiosity": [r"what happens", r"if I", r"maybe", r"try", r"wonder", r"could I", r"how about"]
    }

    def __init__(self):
        pass

    def analyze(self, text: str):
        """
        Returns a dictionary with sentiment and cognitive states.
        """
        text = text.lower()
        results = {
            "sentiment": "neutral",
            "states": [],
            "intensity": 0
        }
        
        matches = {}
        for category, patterns in self.KEYWORDS.items():
            count = 0
            for pattern in patterns:
                count += len(re.findall(pattern, text))
            if count > 0:
                matches[category] = count
        
        if not matches:
            return results

        # Determine primary state
        primary = max(matches, key=matches.get)
        results["sentiment"] = primary
        results["states"] = list(matches.keys())
        results["intensity"] = matches[primary]
        
        return results

    def get_lumi_response(self, analysis: dict, mission_state: dict):
        """
        Generates a verbal response for Lumi based on the mind state.
        """
        sentiment = analysis["sentiment"]
        
        responses = {
            "joy": [
                "I love that energy! You're a coding superstar!",
                "Great job! Your brain is working so fast!",
                "Isn't coding fun? Let's keep it up!"
            ],
            "frustration": [
                "Coding can be tricky sometimes, but I know you can do it!",
                "Don't worry about mistakes - they help us learn!",
                "Take a deep breath. Let's try one block at a time."
            ],
            "confusion": [
                "It's okay to be stuck! Maybe try checking the 'Forward' blocks?",
                "I can help! What if you tried a different turn?",
                "Think of it like a puzzle. Which way should we face first?"
            ],
            "curiosity": [
                "That's a great question! Let's experiment and see!",
                "I love how you're thinking! Give it a try!",
                "Being curious makes the best scientists! Go for it!"
            ],
            "neutral": [
                "I'm listening! Tell me more.",
                "Okay! What's our next move?",
                "I'm ready when you are!"
            ]
        }
        
        import random
        return random.choice(responses.get(sentiment, responses["neutral"]))

# Quick test
if __name__ == "__main__":
    analyzer = MindAnalyzer()
    print(analyzer.analyze("Yay! This is so fun! I did it!"))
    print(analyzer.analyze("I'm so confused, how do I move? help!"))
    print(analyzer.analyze("This is too hard, it sucks."))
