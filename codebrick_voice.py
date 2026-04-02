import time
import sys
import re

# Offline TTS Engine
try:
    import pyttsx3
except ImportError:
    print("Warning: pyttsx3 not installed. TTS will be simulated in console.")
    pyttsx3 = None

# Speech Recognition Engine
try:
    import speech_recognition as sr
except ImportError:
    print("Warning: SpeechRecognition not installed. STT will use fallback immediately.")
    sr = None

class CodeBrickVoice:
    def __init__(self):
        # Initialize TTS
        if pyttsx3:
            try:
                self.tts_engine = pyttsx3.init()
                self.tts_engine.setProperty('rate', 150)    # Moderate speed
                self.tts_engine.setProperty('volume', 1.0) # Full volume
                
                # Try to set a female voice (driver dependent)
                voices = self.tts_engine.getProperty('voices')
                for voice in voices:
                    if "female" in voice.name.lower() or "zira" in voice.name.lower():
                        self.tts_engine.setProperty('voice', voice.id)
                        break
            except Exception as e:
                print(f"TTS Initialization Error: {e}")
                self.tts_engine = None
        else:
            self.tts_engine = None

        # Initialize STT
        if sr:
            self.recognizer = sr.Recognizer()
            self.recognizer.energy_threshold = 300
            self.mic = sr.Microphone()
        else:
            self.recognizer = None

    def speak(self, text):
        """Offline TTS synthesis."""
        print(f"🤖 Lumi says: \"{text}\"")
        if self.tts_engine:
            self.tts_engine.say(text)
            self.tts_engine.runAndWait()
        else:
            # Console simulation
            time.sleep(1)

    def listen(self, timeout=5):
        """Offline Speech Recognition with timeout."""
        if not self.recognizer:
            return self.fallback_input()

        print("🎙 Listening... (Talk now)")
        try:
            with self.mic as source:
                self.recognizer.adjust_for_ambient_noise(source, duration=0.5)
                audio = self.recognizer.listen(source, timeout=timeout, phrase_time_limit=3)
            
            # Using Google Web Speech as 'mostly offline' fallback, 
            # for true offline use pocketsphinx: self.recognizer.recognize_sphinx(audio)
            text = self.recognizer.recognize_google(audio)
            print(f"👤 You said: \"{text}\"")
            return text
        except (sr.UnknownValueError, sr.WaitTimeoutError):
            print("❓ I didn't catch that.")
            return None
        except Exception as e:
            print(f"⚠️ Mic Error: {e}")
            return self.fallback_input()

    def analyze_answer(self, text):
        """Rule-based NLP analysis for kid responses."""
        if not text:
            return {"classification": "incorrect", "confidence": 0, "reason": "No input detected"}

        clean_text = re.sub(r'[^\w\s]', '', text.lower())
        keywords = clean_text.split()

        # Logic categories
        correct_keys = {"more", "forward", "steps", "blocks", "go", "move"}
        partial_keys = {"turn", "direction", "wrong", "left", "right"}
        incorrect_keys = {"no", "dont", "know", "idk", "stuck", "help"}

        if any(w in correct_keys for w in keywords):
            return {"classification": "correct", "confidence": 90, "reason": "Mentions movement/steps"}
        
        if any(w in partial_keys for w in keywords):
            return {"classification": "partial", "confidence": 70, "reason": "Mentions turning/direction"}
            
        if any(w in incorrect_keys for w in keywords):
            return {"classification": "incorrect", "confidence": 100, "reason": "Explicitly lacks answer"}

        return {"classification": "partial", "confidence": 50, "reason": "Unrecognized context"}

    def generate_response(self, classification):
        """Generates short, encouraging feedback (<10 words)."""
        responses = {
            "correct": [
                "Exactly! You needed more steps.",
                "Spot on! The robot moved forward.",
                "Perfect! Your brain is sharp!"
            ],
            "partial": [
                "Close! Think about the distance.",
                "Good start! But look at the grid.",
                "Almost there! Try one more forward."
            ],
            "incorrect": [
                "Try again! Think about the steps.",
                "Don't worry! Let's check the green blocks.",
                "It's okay! We can solve this together."
            ]
        }
        import random
        return random.choice(responses.get(classification, responses["incorrect"]))

    def fallback_input(self):
        """Keyboard fallback for demo safety."""
        print("\n[FALLBACK MODE] Choose an answer:")
        print("1. More Steps  2. Turning  3. I don't know")
        choice = input("Enter 1, 2, or 3 (or type answer): ").strip()
        
        mapping = {"1": "more steps", "2": "turn", "3": "don't know"}
        return mapping.get(choice, choice)

    def run_cycle(self, question="Why didn't the robot reach the goal?"):
        """Full interaction cycle: Question -> Listen -> Analyze -> Respond."""
        self.speak(question)
        time.sleep(0.5)
        
        answer = self.listen()
        
        # Retry once if silence
        if not answer:
            self.speak("I didn't hear you, try again.")
            answer = self.listen()

        if not answer:
            answer = self.fallback_input()

        analysis = self.analyze_answer(answer)
        response = self.generate_response(analysis["classification"])
        
        print(f"\n--- Analysis: {analysis['classification']} ({analysis['confidence']}%) ---")
        self.speak(response)

if __name__ == "__main__":
    # Demo Run
    cb = CodeBrickVoice()
    cb.run_cycle("Why didn't the robot reach the flag?")
