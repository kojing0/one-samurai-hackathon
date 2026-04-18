'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { fetchStampCard, type StampCard } from '@/lib/api';
import StampCardComponent from '@/components/StampCard';

const CHALLENGES = [
  {
    difficulty: 'beginner' as const,
    label: 'フライ級',
    en: 'FLYWEIGHT',
    desc: '基本知識を確認しよう',
    accentColor: '#3B82F6',
  },
  {
    difficulty: 'intermediate' as const,
    label: 'バンタム級',
    en: 'BANTAMWEIGHT',
    desc: '選手・試合の詳細知識',
    accentColor: '#22C55E',
  },
  {
    difficulty: 'advanced' as const,
    label: 'フェザー級',
    en: 'FEATHERWEIGHT',
    desc: '技術・ルールの深い知識',
    accentColor: 'var(--one-red)',
  },
] as const;

export default function StampCardPage() {
  const router = useRouter();
  const [stampCard, setStampCard] = useState<StampCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push('/'); return; }
      if (hasFetched.current) return;
      hasFetched.current = true;

      try {
        const data = await fetchStampCard();
        setStampCard(data.stampCard);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'エラーが発生しました';
        if (msg.includes('見つかりません')) { await signOut(auth); router.push('/'); return; }
        setError(msg);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogout() {
    await signOut(auth);
    router.push('/');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const totalStamped = [
    stampCard?.beginnerStamped,
    stampCard?.intermediateStamped,
    stampCard?.advancedStamped,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-0.5">My Card</p>
          <h2 className="text-2xl font-black uppercase tracking-tight text-white">Stamp Card</h2>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs text-white/40 hover:text-white/80 uppercase tracking-widest transition-colors border border-white/10 hover:border-white/25 px-3.5 py-1.5 rounded-sm"
        >
          Logout
        </button>
      </div>

      {error && (
        <div className="border border-red-800/50 bg-red-900/20 px-4 py-3 rounded-sm">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {stampCard && <StampCardComponent stampCard={stampCard} />}

      {/* チャレンジ一覧 */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">Challenges</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <div className="space-y-2">
          {CHALLENGES.map(({ difficulty, label, en, desc, accentColor }) => {
            const stamped =
              difficulty === 'beginner' ? stampCard?.beginnerStamped
              : difficulty === 'intermediate' ? stampCard?.intermediateStamped
              : stampCard?.advancedStamped;

            return (
              <button
                key={difficulty}
                onClick={() => !stamped && router.push(`/quiz/${difficulty}`)}
                disabled={stamped}
                className="w-full text-left rounded-sm overflow-hidden transition-all disabled:cursor-default group"
                style={{
                  backgroundColor: 'rgba(14,14,14,0.95)',
                  border: `1px solid ${stamped ? `${accentColor}35` : 'rgba(255,255,255,0.1)'}`,
                }}
              >
                <div className="flex items-center">
                  <div className="w-1 self-stretch shrink-0" style={{ backgroundColor: accentColor }} />

                  <div className="flex-1 px-4 py-3.5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className="text-sm font-black"
                          style={{ color: stamped ? 'rgba(255,255,255,0.5)' : 'white' }}
                        >
                          {label}
                        </span>
                        <span className="text-white/25 text-[9px] uppercase tracking-wider">{en}</span>
                      </div>
                      <p className="text-xs" style={{ color: stamped ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.55)' }}>
                        {desc}
                      </p>
                    </div>

                    {stamped ? (
                      <div
                        className="flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-sm"
                        style={{ backgroundColor: `${accentColor}20`, border: `1px solid ${accentColor}40` }}
                      >
                        <svg viewBox="0 0 20 20" className="w-3.5 h-3.5" fill={accentColor}>
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: accentColor }}>
                          Done
                        </span>
                      </div>
                    ) : (
                      <svg
                        viewBox="0 0 20 20"
                        className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                        fill="rgba(255,255,255,0.3)"
                      >
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {totalStamped === 3 && (
          <p className="text-center text-white/30 text-xs mt-4 uppercase tracking-widest">
            All challenges completed
          </p>
        )}
      </div>
    </div>
  );
}
