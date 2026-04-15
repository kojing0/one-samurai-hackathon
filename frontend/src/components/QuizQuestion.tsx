'use client';

import { useState } from 'react';
import { type Quiz } from '@/lib/api';

interface Props {
  quiz: Quiz;
  onAnswer: (choiceIndex: number) => void;
}

export default function QuizQuestion({ quiz, onAnswer }: Props) {
  const [selected, setSelected] = useState<number | null>(null);

  function handleSelect(index: number) {
    if (selected !== null) return;
    setSelected(index);
    setTimeout(() => {
      onAnswer(index);
      setSelected(null);
    }, 400);
  }

  return (
    <div className="space-y-6">
      <div className="bg-samurai-navy rounded-2xl p-6">
        <p className="text-white text-lg font-medium leading-relaxed">{quiz.question}</p>
      </div>

      <div className="space-y-3">
        {quiz.choices.map((choice, index) => (
          <button
            key={index}
            onClick={() => handleSelect(index)}
            disabled={selected !== null}
            className={`w-full text-left rounded-xl px-5 py-4 border-2 transition-all font-medium ${
              selected === index
                ? 'border-samurai-gold bg-samurai-gold/20 text-samurai-gold'
                : 'border-white/10 bg-samurai-navy hover:border-samurai-gold/50 hover:bg-samurai-gold/5 text-white'
            } disabled:cursor-default`}
          >
            <span className="text-samurai-gold mr-3 font-bold">
              {String.fromCharCode(65 + index)}.
            </span>
            {choice}
          </button>
        ))}
      </div>
    </div>
  );
}
