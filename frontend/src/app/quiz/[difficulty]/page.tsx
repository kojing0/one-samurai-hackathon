'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { jwtToAddress } from '@mysten/zklogin';
import { auth, googleProvider } from '@/lib/firebase';
import { fetchQuizzes, startQuizSession, submitAnswers, verifyUser, type Quiz, type Difficulty } from '@/lib/api';
import QuizQuestion from '@/components/QuizQuestion';

const ZKLOGIN_SALT = BigInt(0);

type Phase = 'loading' | 'quiz' | 'result';

const DIFFICULTY_META: Record<Difficulty, { ja: string; en: string; color: string }> = {
  beginner:     { ja: 'フライ級',   en: 'FLYWEIGHT',    color: '#3B82F6' },
  intermediate: { ja: 'バンタム級', en: 'BANTAMWEIGHT', color: '#22C55E' },
  advanced:     { ja: 'フェザー級', en: 'FEATHERWEIGHT', color: '#E31937' },
};

function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  );
}

export default function QuizPage() {
  const router = useRouter();
  const params = useParams<{ difficulty: string }>();
  const difficulty = params.difficulty as Difficulty;
  const meta = DIFFICULTY_META[difficulty] ?? { ja: difficulty, en: difficulty.toUpperCase(), color: '#E31937' };

  const [phase, setPhase] = useState<Phase>('loading');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [sessionId, setSessionId] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<{ passed: boolean; stampGranted: boolean; txDigest?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginVerifying, setLoginVerifying] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    initQuiz();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  async function handleLoginForStamp() {
    setLoginError(null);
    setLoginVerifying(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const googleIdToken = credential?.idToken;
      if (!googleIdToken) throw new Error('IDトークンの取得に失敗しました');
      const suiAddress = jwtToAddress(googleIdToken, ZKLOGIN_SALT);
      await verifyUser(suiAddress);
      router.push('/stamp-card');
    } catch (err) {
      console.error(err);
      setLoginError('ログインに失敗しました。もう一度お試しください。');
      setLoginVerifying(false);
    }
  }

  if (phase === 'loading') return <Spinner />;

  if (phase === 'result' && result) {
    const accentColor = result.passed ? '#FFD700' : '#E31937';
    return (
      <div
        className="rounded-sm px-6 py-10 flex flex-col items-center gap-6 text-center"
        style={{
          backgroundColor: 'rgba(14, 14, 14, 0.96)',
          border: `1px solid ${accentColor}30`,
          boxShadow: `0 0 40px ${accentColor}18`,
        }}
      >
        {/* 結果アイコン */}
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center"
          style={{
            border: `2px solid ${accentColor}`,
            backgroundColor: `${accentColor}22`,
            boxShadow: `0 0 20px ${accentColor}30`,
          }}
        >
          {result.passed ? (
            <svg viewBox="0 0 24 24" className="w-12 h-12" fill="#FFD700">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="w-12 h-12" fill="#E31937">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          )}
        </div>

        {/* 結果テキスト */}
        <div>
          <p
            className="text-[12px] font-black uppercase tracking-[0.3em] mb-2"
            style={{ color: accentColor }}
          >
            {result.passed ? 'Champion' : 'Try Again'}
          </p>
          <h2 className="text-5xl font-black uppercase tracking-tight text-white">
            {result.passed ? 'Perfect!' : '惜しい！'}
          </h2>
          <p className="text-white/75 text-sm mt-3 leading-relaxed">
            {result.passed && result.stampGranted
              ? `${meta.ja}のスタンプを獲得しました`
              : result.passed && !result.stampGranted
              ? 'クリア！ログインしてスタンプを獲得しよう'
              : 'もう一度挑戦してみましょう'}
          </p>
        </div>

        {result.txDigest && (
          <div
            className="w-full px-4 py-2.5 rounded-sm"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            <p className="text-white/45 text-[10px] font-mono break-all">Tx: {result.txDigest}</p>
          </div>
        )}

        {/* ゲストがクリアした場合: ログインCTA */}
        {result.passed && !result.stampGranted && !isLoggedIn && (
          <div
            className="w-full px-5 py-4 rounded-sm space-y-3"
            style={{ backgroundColor: 'rgba(227,25,55,0.1)', border: '1px solid rgba(227,25,55,0.35)' }}
          >
            <p className="text-white/80 text-xs leading-relaxed">
              Googleでログインすると、Suiブロックチェーン上のスタンプカードにスタンプが記録されます
            </p>
            {loginVerifying ? (
              <div className="flex items-center gap-2 justify-center py-1">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span className="text-white text-sm">ログイン中...</span>
              </div>
            ) : (
              <button
                onClick={handleLoginForStamp}
                className="w-full py-2.5 text-sm font-black uppercase tracking-wider text-white transition-opacity hover:opacity-80"
                style={{ backgroundColor: 'var(--one-red)' }}
              >
                Googleでログインしてスタンプを獲得
              </button>
            )}
            {loginError && (
              <p className="text-red-400 text-xs border border-red-800/50 bg-red-900/20 px-3 py-2">
                {loginError}
              </p>
            )}
          </div>
        )}

        <div className="flex gap-2 w-full">
          {!result.passed && (
            <button
              onClick={initQuiz}
              className="flex-1 py-3.5 text-sm font-black uppercase tracking-wider text-white transition-opacity hover:opacity-80"
              style={{ backgroundColor: 'var(--one-red)' }}
            >
              再挑戦
            </button>
          )}
          <button
            onClick={() => router.push(isLoggedIn ? '/stamp-card' : '/')}
            className="flex-1 py-3.5 text-sm font-black uppercase tracking-wider text-white/80 transition-colors hover:text-white hover:bg-white/10"
            style={{ border: '1px solid rgba(255,255,255,0.3)' }}
          >
            {isLoggedIn ? 'スタンプカードへ' : 'ホームへ'}
          </button>
        </div>
      </div>
    );
  }

  const currentQuiz = quizzes[currentIndex];
  const progress = quizzes.length > 0 ? ((currentIndex + 1) / quizzes.length) * 100 : 0;

  return (
    <div className="space-y-5">
      {/* クイズヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full" style={{ backgroundColor: meta.color }} />
          <span className="text-white font-black uppercase tracking-wider text-sm">{meta.en}</span>
          <span className="text-white/50 text-xs">{meta.ja}</span>
        </div>
        <span
          className="text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-sm"
          style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}
        >
          {currentIndex + 1} / {quizzes.length}
        </span>
      </div>

      {/* プログレスバー */}
      <div className="h-1 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
        <div
          className="h-1 rounded-full transition-all duration-300"
          style={{ width: `${progress}%`, backgroundColor: meta.color }}
        />
      </div>

      {error && (
        <div className="border border-red-800/50 bg-red-900/20 px-4 py-3 rounded-sm">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {currentQuiz && <QuizQuestion quiz={currentQuiz} onAnswer={handleAnswer} />}
    </div>
  );
}
