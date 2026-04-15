'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { fetchStampCard, type StampCard } from '@/lib/api';
import StampCardComponent from '@/components/StampCard';

export default function StampCardPage() {
  const router = useRouter();
  const [stampCard, setStampCard] = useState<StampCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/');
        return;
      }

      try {
        const data = await fetchStampCard();
        setStampCard(data.stampCard);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'エラーが発生しました');
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  async function handleLogout() {
    await signOut(auth);
    router.push('/');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <p className="text-gray-400">スタンプカードを取得中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-samurai-gold">マイスタンプカード</h2>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          ログアウト
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-500 rounded-lg p-4 text-red-300">
          {error}
        </div>
      )}

      {stampCard && <StampCardComponent stampCard={stampCard} />}

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white">クイズに挑戦する</h3>
        {(
          [
            { difficulty: 'beginner', label: '初級', desc: '基本知識を確認しよう' },
            { difficulty: 'intermediate', label: '中級', desc: '選手・試合の詳細知識' },
            { difficulty: 'advanced', label: '上級', desc: '技術・ルールの深い知識' },
          ] as const
        ).map(({ difficulty, label, desc }) => {
          const stamped =
            difficulty === 'beginner'
              ? stampCard?.beginnerStamped
              : difficulty === 'intermediate'
                ? stampCard?.intermediateStamped
                : stampCard?.advancedStamped;

          return (
            <button
              key={difficulty}
              onClick={() => router.push(`/quiz/${difficulty}`)}
              disabled={stamped}
              className={`w-full text-left rounded-xl p-4 flex justify-between items-center transition-colors ${
                stamped
                  ? 'bg-green-900/30 border border-green-600 cursor-default'
                  : 'bg-samurai-navy hover:bg-samurai-navy/70 border border-white/10 cursor-pointer'
              }`}
            >
              <div>
                <p className="font-bold text-white">{label}</p>
                <p className="text-gray-400 text-sm">{desc}</p>
              </div>
              {stamped ? (
                <span className="text-green-400 font-bold">スタンプ済</span>
              ) : (
                <span className="text-samurai-gold">挑戦する →</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
