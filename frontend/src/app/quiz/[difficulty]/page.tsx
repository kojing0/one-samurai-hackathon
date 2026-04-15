'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import {
  fetchQuizzes,
  startQuizSession,
  submitAnswers,
  type Quiz,
  type Difficulty,
} from '@/lib/api';
import QuizQuestion from '@/components/QuizQuestion';

type Phase = 'loading' | 'quiz' | 'result';

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  beginner: '初級',
  intermediate: '中級',
  advanced: '上級',
};

export default function QuizPage() {
  const router = useRouter();
  const params = useParams<{ difficulty: string }>();
  const difficulty = params.difficulty as Difficulty;

  const [phase, setPhase] = useState<Phase>('loading');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [sessionId, setSessionId] = useState<string>('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<{
    passed: boolean;
    stampGranted: boolean;
    txDigest?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/');
        return;
      }
      await initQuiz();
    });
    return () => unsubscribe();
  }, [difficulty]);

  async function initQuiz() {
    setPhase('loading');
    setError(null);
    try {
      const [quizzesData, sessionData] = await Promise.all([
        fetchQuizzes(difficulty),
        startQuizSession(difficulty),
      ]);
      setQuizzes(quizzesData.quizzes);
      setSessionId(sessionData.sessionId);
      setCurrentIndex(0);
      setAnswers([]);
      setPhase('quiz');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
      setPhase('loading');
    }
  }

  function handleAnswer(choiceIndex: number) {
    const nextAnswers = [...answers, choiceIndex];
    setAnswers(nextAnswers);

    if (currentIndex + 1 < quizzes.length) {
      setCurrentIndex((i) => i + 1);
    } else {
      handleSubmit(nextAnswers);
    }
  }

  async function handleSubmit(finalAnswers: number[]) {
    setPhase('loading');
    try {
      const data = await submitAnswers(sessionId, finalAnswers);
      setResult(data);
      setPhase('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : '送信に失敗しました');
      setPhase('quiz');
    }
  }

  if (phase === 'loading') {
    return (
      <div className="flex items-center justify-center py-32">
        <p className="text-gray-400">読み込み中...</p>
      </div>
    );
  }

  if (phase === 'result' && result) {
    return (
      <div className="flex flex-col items-center gap-8 py-16 text-center">
        {result.passed ? (
          <>
            <p className="text-6xl">🥋</p>
            <h2 className="text-3xl font-bold text-samurai-gold">全問正解！</h2>
            <p className="text-green-400 text-lg">
              {DIFFICULTY_LABEL[difficulty]}のスタンプを獲得しました
            </p>
            {result.txDigest && (
              <p className="text-gray-500 text-xs break-all">Tx: {result.txDigest}</p>
            )}
          </>
        ) : (
          <>
            <p className="text-6xl">💪</p>
            <h2 className="text-3xl font-bold text-white">惜しい！</h2>
            <p className="text-gray-300">もう一度挑戦してみましょう</p>
          </>
        )}

        <div className="flex gap-4">
          {!result.passed && (
            <button
              onClick={initQuiz}
              className="bg-samurai-red hover:bg-samurai-red/80 text-white font-bold px-6 py-3 rounded-xl transition-colors"
            >
              再挑戦する
            </button>
          )}
          <button
            onClick={() => router.push('/stamp-card')}
            className="border border-samurai-gold text-samurai-gold hover:bg-samurai-gold/10 font-bold px-6 py-3 rounded-xl transition-colors"
          >
            スタンプカードへ
          </button>
        </div>
      </div>
    );
  }

  const currentQuiz = quizzes[currentIndex];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <span className="text-samurai-gold font-bold">{DIFFICULTY_LABEL[difficulty]}</span>
        <span className="text-gray-400 text-sm">
          {currentIndex + 1} / {quizzes.length}
        </span>
      </div>

      <div className="w-full bg-white/10 rounded-full h-2">
        <div
          className="bg-samurai-gold rounded-full h-2 transition-all"
          style={{ width: `${((currentIndex + 1) / quizzes.length) * 100}%` }}
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {currentQuiz && (
        <QuizQuestion quiz={currentQuiz} onAnswer={handleAnswer} />
      )}
    </div>
  );
}
