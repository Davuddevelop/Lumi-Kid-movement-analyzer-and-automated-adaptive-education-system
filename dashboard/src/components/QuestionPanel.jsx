import { useEffect, useState } from 'react';
import LumiAvatar from './LumiAvatar';

/**
 * QuestionPanel — guided question overlay.
 * Props:
 *   question: { id, text, hint, answers: [{id, label, emoji}] }
 *   onAnswer: (answerId: string) => void
 *   lumiEmotion: string
 */
const QuestionPanel = ({ question, onAnswer, lumiEmotion = 'surprised' }) => {
  const [selected, setSelected] = useState(null);

  // Speak the question on mount
  useEffect(() => {
    if (!question?.text) return;
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(question.text);
      u.pitch = 1.4;
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    }
  }, [question]);

  if (!question) return null;

  const handleSelect = (answerId) => {
    if (selected) return; // prevent double-tap
    setSelected(answerId);

    // Brief visual feedback before dismissing
    setTimeout(() => {
      onAnswer?.(answerId);
    }, 600);
  };

  return (
    <div
      className="question-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Question"
    >
      <div className="question-card">
        {/* Lumi avatar at top */}
        <LumiAvatar emotion={lumiEmotion} size={80} speaking={!selected} />

        {/* Question text */}
        <p className="question-text">{question.text}</p>

        {/* Optional hint */}
        {question.hint && (
          <p className="question-hint">💡 {question.hint}</p>
        )}

        {/* Answer cards — emoji only for young children */}
        <div className="answer-cards-row" role="list">
          {question.answers?.map((answer) => (
            <button
              key={answer.id}
              className={`answer-card${selected === answer.id ? ' selected' : ''}`}
              onClick={() => handleSelect(answer.id)}
              aria-label={answer.label}
              role="listitem"
              disabled={!!selected}
            >
              <span aria-hidden="true">{answer.emoji}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuestionPanel;
