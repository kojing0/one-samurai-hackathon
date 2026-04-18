'use client';

import { useState } from 'react';
import { type Quiz } from '@/lib/api';

interface Props {
  quiz: Quiz;
  onAnswer: (choiceIndex: number) => void;
}

const CHOICE_LABELS = ['A', 'B', 'C', 'D'];

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
    <div className="space-y-4">
      {/* 問題文 */}
      <div
        className="px-5 py-5 rounded-sm"
        style={{
          backgroundColor: 'rgba(20, 20, 20, 0.95)',
          borderLeft: '3px solid var(--one-red)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
        }}
      >
        <p className="text-white text-[15px] font-semibold leading-relaxed">{quiz.question}</p>
      </div>

      {/* 選択肢 */}
      <div className="space-y-2.5">
        {quiz.choices.map((choice, index) => {
          const isSelected = selected === index;
          return (
            <button
              key={index}
              onClick={() => handleSelect(index)}
              disabled={selected !== null}
              className="w-full text-left flex items-center gap-4 px-4 py-4 rounded-sm transition-all disabled:cursor-default"
              style={{
                backgroundColor: isSelected ? 'rgba(227, 25, 55, 0.2)' : 'rgba(28, 28, 28, 0.95)',
                border: `1px solid ${isSelected ? 'var(--one-red)' : 'rgba(255,255,255,0.22)'}`,
                boxShadow: isSelected ? '0 0 0 1px var(--one-red)' : '0 1px 4px rgba(0,0,0,0.4)',
              }}
            >
              <span
                className="text-[11px] font-black w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: isSelected ? 'var(--one-red)' : 'rgba(255,255,255,0.12)',
                  color: isSelected ? '#fff' : 'rgba(255,255,255,0.75)',
                }}
              >
                {CHOICE_LABELS[index]}
              </span>
              <span className="text-[14px] text-white/90 leading-snug">{choice}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
