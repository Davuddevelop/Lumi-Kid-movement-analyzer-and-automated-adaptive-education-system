"""
Lumi Guided Question System
- Predefined questions with expected answers
- Fuzzy matching for speech recognition
- Fallback buttons for reliability
"""
import re
import random
import time
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass

@dataclass
class Answer:
    id: str
    label: str           # Button label / display text
    keywords: List[str]  # Words that match this answer
    is_correct: bool
    feedback: str        # Lumi's response if selected
    emoji: str = "❓"    # Visual emoji for buttons

@dataclass
class Question:
    id: str
    text: str            # What Lumi asks
    context: str         # When to ask (crash, miss_goal, success, etc.)
    answers: List[Answer]
    hint: str            # Help text

# ============================================
# QUESTION BANK
# ============================================

QUESTIONS = {
    # --- CRASH SCENARIOS ---
    "crash_why": Question(
        id="crash_why",
        text="Oh no, we crashed! Why did that happen?",
        context="crash",
        answers=[
            Answer("rock", "Hit a rock",
                   ["rock", "obstacle", "hit", "crash", "block", "wall", "thing"],
                   is_correct=True,
                   feedback="Exactly! We hit a rock. Let's go around it!",
                   emoji="🪨"),
            Answer("edge", "Went off edge",
                   ["edge", "off", "fell", "side", "boundary", "out"],
                   is_correct=False,
                   feedback="Not quite - we actually hit a rock, not the edge.",
                   emoji="💨"),
            Answer("dunno", "I don't know",
                   ["don't know", "dont know", "idk", "not sure", "no idea", "dunno"],
                   is_correct=False,
                   feedback="That's okay! Look at where the robot stopped - it hit a rock!",
                   emoji="🤷"),
        ],
        hint="Look at where the robot stopped on the grid."
    ),

    "crash_fix": Question(
        id="crash_fix",
        text="How can we avoid the rock next time?",
        context="crash",
        answers=[
            Answer("turn", "Turn around it",
                   ["turn", "around", "avoid", "left", "right", "direction", "rotate"],
                   is_correct=True,
                   feedback="Perfect! We need to turn to go around the obstacle!",
                   emoji="↩️"),
            Answer("more", "Add more forward",
                   ["more", "forward", "straight", "keep going", "extra"],
                   is_correct=False,
                   feedback="Hmm, going straight will still hit the rock. Try turning!",
                   emoji="⬆️"),
            Answer("remove", "Remove the rock",
                   ["remove", "move", "delete", "take away"],
                   is_correct=False,
                   feedback="Ha! We can't move rocks, but we can go around them!",
                   emoji="🚫"),
        ],
        hint="Think about which direction to move."
    ),

    # --- EDGE/BOUNDARY SCENARIOS ---
    "edge_why": Question(
        id="edge_why",
        text="Oops! The robot fell off! What happened?",
        context="edge",
        answers=[
            Answer("toomany", "Too many steps",
                   ["too many", "many", "far", "long", "steps", "forward", "much"],
                   is_correct=True,
                   feedback="Right! Too many forward blocks made us go off the edge!",
                   emoji="👣"),
            Answer("wrong_way", "Wrong direction",
                   ["wrong", "direction", "way", "turn", "facing"],
                   is_correct=True,
                   feedback="Yes! We were facing the wrong direction!",
                   emoji="🧭"),
            Answer("dunno", "I don't know",
                   ["don't know", "dont know", "idk", "not sure"],
                   is_correct=False,
                   feedback="Look at the path - we went too far off the grid!",
                   emoji="🤷"),
        ],
        hint="Count how many squares the robot moved."
    ),

    # --- MISSED GOAL SCENARIOS ---
    "miss_why": Question(
        id="miss_why",
        text="We didn't reach the flag! What's missing?",
        context="miss_goal",
        answers=[
            Answer("more_steps", "More steps needed",
                   ["more", "steps", "forward", "short", "not enough", "few"],
                   is_correct=True,
                   feedback="Exactly! We need more forward blocks to reach the goal!",
                   emoji="⬆️"),
            Answer("wrong_turn", "Wrong turn",
                   ["wrong", "turn", "direction", "left", "right"],
                   is_correct=True,
                   feedback="Good thinking! Maybe we turned the wrong way!",
                   emoji="↩️"),
            Answer("dunno", "I don't know",
                   ["don't know", "dont know", "idk"],
                   is_correct=False,
                   feedback="Count the squares between the robot and the flag!",
                   emoji="🤷"),
        ],
        hint="Look at where the robot ended up."
    ),

    # --- SUCCESS SCENARIOS ---
    "success_how": Question(
        id="success_how",
        text="Amazing! You did it! What helped you succeed?",
        context="success",
        answers=[
            Answer("counted", "Counted the steps",
                   ["count", "counted", "steps", "squares", "number"],
                   is_correct=True,
                   feedback="Smart! Counting steps is a great strategy!",
                   emoji="🔢"),
            Answer("turned", "Turned at right time",
                   ["turn", "turned", "around", "direction"],
                   is_correct=True,
                   feedback="Yes! Knowing when to turn is super important!",
                   emoji="↪️"),
            Answer("tried", "Kept trying",
                   ["try", "tried", "again", "practice", "retry"],
                   is_correct=True,
                   feedback="That's the spirit! Practice makes perfect!",
                   emoji="💪"),
        ],
        hint="Think about your strategy."
    ),

    # --- GENERAL/TEACHING MOMENTS ---
    "teach_forward": Question(
        id="teach_forward",
        text="What does the green block do?",
        context="teaching",
        answers=[
            Answer("move", "Move forward",
                   ["move", "forward", "go", "ahead", "straight", "step"],
                   is_correct=True,
                   feedback="Perfect! Green means move forward one step!",
                   emoji="✅"),
            Answer("turn", "Turn around",
                   ["turn", "rotate", "spin"],
                   is_correct=False,
                   feedback="Close! Green is forward. Blue and yellow are for turning!",
                   emoji="↩️"),
            Answer("stop", "Stop",
                   ["stop", "wait", "pause"],
                   is_correct=False,
                   feedback="Nope! Green makes the robot GO forward!",
                   emoji="🚫"),
        ],
        hint="Think about the color green - like a traffic light!"
    ),

    "teach_loop": Question(
        id="teach_loop",
        text="What does the red loop block do?",
        context="teaching",
        answers=[
            Answer("repeat", "Repeat the last block",
                   ["repeat", "again", "same", "twice", "loop", "redo"],
                   is_correct=True,
                   feedback="Exactly! Loop repeats what came before it!",
                   emoji="✅"),
            Answer("stop", "Stop the robot",
                   ["stop", "end", "finish"],
                   is_correct=False,
                   feedback="Nope! Red loop means repeat, not stop!",
                   emoji="🚫"),
            Answer("reverse", "Go backwards",
                   ["back", "backward", "reverse", "behind"],
                   is_correct=False,
                   feedback="Not quite! Loop repeats the previous action!",
                   emoji="🧭"),
        ],
        hint="Loop means doing something again!"
    ),
}

# Question flow based on game state
QUESTION_FLOW = {
    "crash": ["crash_why", "crash_fix"],
    "edge": ["edge_why"],
    "miss_goal": ["miss_why"],
    "success": ["success_how"],
    "idle": ["teach_forward", "teach_loop"],
}

# Hint system - partial solutions and encouragement
HINTS = {
    "crash": {
        "partial_solution": "Try adding a TURN block before the rock. Which way should you turn?",
        "encouragement": "You've got this! Look at where the rock is and think about going around it."
    },
    "edge": {
        "partial_solution": "You're using too many FORWARD blocks. Try counting: how many squares to the edge?",
        "encouragement": "Almost there! Count the squares carefully before you add more blocks."
    },
    "miss_goal": {
        "partial_solution": "You need more steps! Count: how many squares between you and the flag?",
        "encouragement": "So close! Just adjust your path a little bit. You can do it!"
    },
    "success": {
        "partial_solution": "Great job! Want to try a harder level?",
        "encouragement": "Amazing work! You're becoming a coding expert!"
    },
    "default": {
        "partial_solution": "Think about what each colored block does. Green = forward, Blue = turn right, Yellow = turn left.",
        "encouragement": "Take your time! Programming is about trying and learning."
    }
}

# Hint offer question
HINT_QUESTION = Question(
    id="offer_hint",
    text="Would you like a hint?",
    context="hint_offer",
    answers=[
        Answer("yes", "Yes, help me!",
               ["yes", "yeah", "yep", "sure", "okay", "ok", "help", "please", "hint"],
               is_correct=True,
               feedback=""),  # Feedback set dynamically
        Answer("no", "No, I'll try again!",
               ["no", "nope", "nah", "try", "again", "myself", "alone", "retry"],
               is_correct=True,
               feedback=""),  # Feedback set dynamically
    ],
    hint="It's okay to ask for help!"
)


class GuidedQuestionSystem:
    """Manages guided Q&A interactions with the child."""

    def __init__(self):
        self.current_question: Optional[Question] = None
        self.question_history: List[str] = []
        self.score = 0
        self.total_asked = 0
        self.question_start_time: Optional[float] = None  # Track when question was asked
        self.hint_mode: bool = False  # Track if we're offering a hint
        self.hint_context: str = "default"  # What context the hint is for

    def get_question_for_state(self, game_status: str, mistake_tag: str = None) -> Optional[Question]:
        """Select appropriate question based on game state."""

        # Determine context
        if game_status == "error":
            if mistake_tag == "fell_off_edge":
                context = "edge"
            else:
                context = "crash"
        elif game_status == "success":
            context = "success"
        elif "partial" in game_status:
            context = "miss_goal"
        else:
            context = "idle"

        # Get question IDs for this context
        question_ids = QUESTION_FLOW.get(context, [])
        if not question_ids:
            return None

        # Pick a question we haven't asked recently
        for qid in question_ids:
            if qid not in self.question_history[-3:]:  # Avoid last 3 questions
                self.current_question = QUESTIONS.get(qid)
                self.question_history.append(qid)
                self.question_start_time = time.time()  # Start timing
                return self.current_question

        # Fallback: pick random from context
        qid = random.choice(question_ids)
        self.current_question = QUESTIONS.get(qid)
        self.question_history.append(qid)
        self.question_start_time = time.time()  # Start timing
        return self.current_question

    def calculate_response_time(self) -> Dict:
        """
        Calculate response time and confidence level.
        Rules:
        - <2s -> confident
        - 2-4s -> medium
        - >4s -> unsure
        """
        if not self.question_start_time:
            return {"response_time_sec": 0, "response_confidence": "unknown"}

        elapsed = time.time() - self.question_start_time

        if elapsed < 2.0:
            confidence = "confident"
        elif elapsed <= 4.0:
            confidence = "medium"
        else:
            confidence = "unsure"

        return {
            "response_time_sec": round(elapsed, 2),
            "response_confidence": confidence
        }

    def analyze_explanation(self, spoken_text: str) -> Dict:
        """
        Analyze the quality of a spoken explanation.
        Rules:
        - Check if answer has at least 2 keywords
        - Check length > 3 words
        - Classify as: good_explanation / weak_explanation
        """
        if not spoken_text or not self.current_question:
            return {
                "explanation_quality": "weak_explanation",
                "word_count": 0,
                "keyword_count": 0,
                "reason": "No response provided"
            }

        normalized = self.normalize_text(spoken_text)
        words = normalized.split()
        word_count = len(words)

        # Collect all keywords from all possible answers
        all_keywords = []
        for answer in self.current_question.answers:
            all_keywords.extend(answer.keywords)

        # Count keyword matches
        keyword_count = 0
        matched_keywords = []
        for keyword in all_keywords:
            if keyword in normalized:
                keyword_count += 1
                matched_keywords.append(keyword)

        # Classification rules
        has_enough_keywords = keyword_count >= 2
        has_enough_words = word_count > 3

        if has_enough_keywords and has_enough_words:
            quality = "good_explanation"
            reason = "Clear explanation with relevant details"
        elif has_enough_keywords:
            quality = "weak_explanation"
            reason = "Try using more words to explain"
        elif has_enough_words:
            quality = "weak_explanation"
            reason = "Try using words like: " + ", ".join(all_keywords[:3])
        else:
            quality = "weak_explanation"
            reason = "Can you tell me more?"

        return {
            "explanation_quality": quality,
            "word_count": word_count,
            "keyword_count": keyword_count,
            "matched_keywords": matched_keywords,
            "reason": reason
        }

    def normalize_text(self, text: str) -> str:
        """Clean up speech input."""
        if not text:
            return ""
        text = text.lower().strip()
        text = re.sub(r"[^\w\s']", "", text)
        text = re.sub(r"\s+", " ", text)
        return text

    def match_answer(self, spoken_text: str) -> Tuple[Optional[Answer], int]:
        """
        Match spoken text to an answer option.
        Returns (matched_answer, confidence_score).
        """
        if not self.current_question or not spoken_text:
            return None, 0

        normalized = self.normalize_text(spoken_text)
        words = set(normalized.split())

        best_match: Optional[Answer] = None
        best_score = 0

        for answer in self.current_question.answers:
            score = 0
            for keyword in answer.keywords:
                # Check for keyword in text
                if keyword in normalized:
                    score += 10
                # Check individual words
                keyword_words = set(keyword.split())
                matching_words = words & keyword_words
                score += len(matching_words) * 5

            if score > best_score:
                best_score = score
                best_match = answer

        # Minimum threshold
        if best_score < 5:
            return None, 0

        # Convert to confidence percentage
        confidence = min(100, best_score * 5)
        return best_match, confidence

    def process_answer(self, spoken_text: str = None, button_id: str = None) -> Dict:
        """
        Process child's answer (voice or button).
        Returns result with feedback.
        """
        if not self.current_question:
            return {
                "success": False,
                "feedback": "No question was asked!",
                "answer": None
            }

        # Handle hint mode specially
        if self.hint_mode:
            wants_hint = False

            # Check button press
            if button_id == "yes":
                wants_hint = True
            elif button_id == "no":
                wants_hint = False
            # Check voice input
            elif spoken_text:
                normalized = self.normalize_text(spoken_text)
                yes_words = ["yes", "yeah", "yep", "sure", "okay", "ok", "help", "please", "hint"]
                no_words = ["no", "nope", "nah", "try", "again", "myself", "alone", "retry"]

                yes_score = sum(1 for w in yes_words if w in normalized)
                no_score = sum(1 for w in no_words if w in normalized)

                wants_hint = yes_score > no_score

            return self.process_hint_response(wants_hint)

        self.total_asked += 1
        matched_answer = None
        confidence = 100  # Buttons are 100% confident

        # Button press
        if button_id:
            for ans in self.current_question.answers:
                if ans.id == button_id:
                    matched_answer = ans
                    break
        # Voice input
        elif spoken_text:
            matched_answer, confidence = self.match_answer(spoken_text)

        # No match found
        if not matched_answer:
            # Still analyze what they said
            explanation_analysis = {}
            if spoken_text:
                explanation_analysis = self.analyze_explanation(spoken_text)

            return {
                "success": False,
                "feedback": "I didn't understand. Try the buttons!",
                "answer": None,
                "confidence": 0,
                "show_buttons": True,
                "explanation_quality": explanation_analysis.get("explanation_quality", "n/a"),
                "explanation_details": explanation_analysis
            }

        # Track score
        if matched_answer.is_correct:
            self.score += 1

        # Calculate response time analysis
        time_analysis = self.calculate_response_time()

        # Analyze explanation quality (only for voice input)
        explanation_analysis = {}
        if spoken_text:
            explanation_analysis = self.analyze_explanation(spoken_text)

        # Reset timer after processing
        self.question_start_time = None

        return {
            "success": True,
            "feedback": matched_answer.feedback,
            "answer": {
                "id": matched_answer.id,
                "label": matched_answer.label,
                "is_correct": matched_answer.is_correct
            },
            "confidence": confidence,
            "score": self.score,
            "total": self.total_asked,
            "response_time_sec": time_analysis["response_time_sec"],
            "response_confidence": time_analysis["response_confidence"],
            "explanation_quality": explanation_analysis.get("explanation_quality", "n/a"),
            "explanation_details": explanation_analysis
        }

    def get_current_question_data(self) -> Optional[Dict]:
        """Get current question as dict for frontend."""
        if not self.current_question:
            return None

        return {
            "id": self.current_question.id,
            "text": self.current_question.text,
            "hint": self.current_question.hint,
            "answers": [
                {"id": a.id, "label": a.label, "emoji": a.emoji}
                for a in self.current_question.answers
            ]
        }

    def offer_hint(self, context: str = "default") -> Question:
        """
        Offer a hint to the user.
        Returns the hint offer question.
        """
        self.hint_mode = True
        self.hint_context = context
        self.current_question = HINT_QUESTION
        self.question_start_time = time.time()
        return HINT_QUESTION

    def process_hint_response(self, wants_hint: bool) -> Dict:
        """
        Process the user's response to hint offer.
        Returns appropriate partial solution or encouragement.
        """
        hints = HINTS.get(self.hint_context, HINTS["default"])

        if wants_hint:
            response = hints["partial_solution"]
            response_type = "hint_given"
        else:
            response = hints["encouragement"]
            response_type = "encouragement"

        # Calculate response time
        time_analysis = self.calculate_response_time()

        # Reset hint mode
        self.hint_mode = False
        self.current_question = None
        self.question_start_time = None

        return {
            "success": True,
            "feedback": response,
            "response_type": response_type,
            "wants_hint": wants_hint,
            "context": self.hint_context,
            "response_time_sec": time_analysis["response_time_sec"],
            "response_confidence": time_analysis["response_confidence"]
        }

    def is_hint_mode(self) -> bool:
        """Check if we're currently offering a hint."""
        return self.hint_mode

    def reset(self):
        """Reset for new session."""
        self.current_question = None
        self.question_history = []
        self.score = 0
        self.total_asked = 0
        self.question_start_time = None
        self.hint_mode = False
        self.hint_context = "default"


# ============================================
# TEST
# ============================================
if __name__ == "__main__":
    system = GuidedQuestionSystem()

    print("=" * 50)
    print("  GUIDED QUESTION SYSTEM TEST")
    print("=" * 50)

    # Simulate crash scenario
    q = system.get_question_for_state("error", "crashed_into_obstacle")
    print(f"\nQuestion: {q.text}")
    print(f"Options: {[a.label for a in q.answers]}")

    # Test response time (simulate fast answer <2s)
    print("\n--- Response Time Test (fast answer <2s) ---")
    time.sleep(0.5)  # Simulate 0.5s response
    result = system.process_answer(spoken_text="I hit a rock")
    print(f"Response time: {result['response_time_sec']}s => {result['response_confidence']}")

    # Test medium response (2-4s)
    print("\n--- Response Time Test (medium 2-4s) ---")
    q = system.get_question_for_state("error", "crashed_into_obstacle")
    print(f"Question: {q.text}")
    print(f"Answer options: {[a.id for a in q.answers]}")
    time.sleep(2.5)  # Simulate 2.5s response
    # Use correct button_id for crash_fix question
    result = system.process_answer(button_id="turn")
    print(f"Response time: {result['response_time_sec']}s => {result['response_confidence']}")

    # Test slow response (>4s)
    print("\n--- Response Time Test (slow >4s) ---")
    q = system.get_question_for_state("success")
    print(f"Question: {q.text}")
    time.sleep(4.5)  # Simulate 4.5s response
    result = system.process_answer(spoken_text="I counted the steps")
    print(f"Response time: {result['response_time_sec']}s => {result['response_confidence']}")

    print("\n--- Explanation Analysis Test ---")
    system.reset()
    q = system.get_question_for_state("error", "crashed_into_obstacle")
    print(f"Question: {q.text}")

    # Test weak explanation (short, few keywords)
    print("\n[Weak] 'rock'")
    result = system.process_answer(spoken_text="rock")
    print(f"  Quality: {result['explanation_quality']}")
    print(f"  Details: words={result['explanation_details'].get('word_count')}, keywords={result['explanation_details'].get('keyword_count')}")
    print(f"  Reason: {result['explanation_details'].get('reason')}")

    # Reset and test good explanation (long, multiple keywords)
    system.reset()
    q = system.get_question_for_state("error", "crashed_into_obstacle")
    print(f"\nQuestion: {q.text}")
    print("\n[Good] 'I think we hit a rock and crashed into the obstacle'")
    result = system.process_answer(spoken_text="I think we hit a rock and crashed into the obstacle")
    print(f"  Quality: {result['explanation_quality']}")
    print(f"  Details: words={result['explanation_details'].get('word_count')}, keywords={result['explanation_details'].get('keyword_count')}")
    print(f"  Matched: {result['explanation_details'].get('matched_keywords')}")

    print("\n--- Full Result Example ---")
    system.reset()
    q = system.get_question_for_state("error")
    time.sleep(0.5)
    result = system.process_answer(spoken_text="we crashed into a big rock obstacle")
    print(f"Result: {result}")

    # ============================================
    # HINT SYSTEM TEST
    # ============================================
    print("\n" + "=" * 50)
    print("  HINT SYSTEM TEST")
    print("=" * 50)

    # Test hint offer for crash context
    system.reset()
    print("\n--- Offering hint (crash context) ---")
    q = system.offer_hint("crash")
    print(f"Question: {q.text}")
    print(f"Options: {[a.label for a in q.answers]}")
    print(f"Is hint mode: {system.is_hint_mode()}")

    # Test "yes" response via button
    print("\n--- User clicks 'Yes' button ---")
    result = system.process_answer(button_id="yes")
    print(f"Response type: {result['response_type']}")
    print(f"Feedback: {result['feedback']}")

    # Test hint offer for edge context
    print("\n--- Offering hint (edge context) ---")
    q = system.offer_hint("edge")
    print(f"Question: {q.text}")

    # Test "no" response via voice
    print("\n--- User says 'No I want to try again' ---")
    result = system.process_answer(spoken_text="No I want to try again myself")
    print(f"Response type: {result['response_type']}")
    print(f"Feedback: {result['feedback']}")

    # Test hint offer for miss_goal context
    print("\n--- Offering hint (miss_goal context) ---")
    q = system.offer_hint("miss_goal")

    # Test "yes" response via voice
    print("\n--- User says 'Yes please help me' ---")
    result = system.process_answer(spoken_text="Yes please help me")
    print(f"Response type: {result['response_type']}")
    print(f"Feedback: {result['feedback']}")
