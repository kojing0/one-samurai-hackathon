'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup, onAuthStateChanged, GoogleAuthProvider, type User } from 'firebase/auth';
import { jwtToAddress } from '@mysten/zklogin';
import { auth, googleProvider } from '@/lib/firebase';
import { verifyUser } from '@/lib/api';
import GoogleLoginButton from '@/components/GoogleLoginButton';

const ZKLOGIN_SALT = BigInt(0);

const WEIGHT_CLASSES = [
  { label: 'フライ級',   en: 'FLYWEIGHT',    color: '#3B82F6', difficulty: 'beginner' },
  { label: 'バンタム級', en: 'BANTAMWEIGHT', color: '#22C55E', difficulty: 'intermediate' },
  { label: 'フェザー級', en: 'FEATHERWEIGHT', color: 'var(--one-red)', difficulty: 'advanced' },
];

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const isSigningIn = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  async function handleGoogleLogin() {
    setError(null);
    isSigningIn.current = true;
    setVerifying(true);
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
      setError('ログインに失敗しました。もう一度お試しください。');
      isSigningIn.current = false;
      setVerifying(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* イベントヒーローバナー風 */}
      <div
        className="relative overflow-hidden rounded-sm"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}
      >
        <div className="relative px-7 py-12">
          <div className="flex items-center gap-2 mb-5">
            <span
              className="text-white text-xs font-black px-2.5 py-1 uppercase tracking-widest"
              style={{ backgroundColor: 'var(--one-red)' }}
            >
              LIVE EVENT
            </span>
            <span className="text-white/40 text-xs uppercase tracking-widest">Powered by Sui</span>
          </div>

          <h2 className="text-5xl font-black uppercase leading-none tracking-tight text-white mb-2">
            ONE SAMURAI
          </h2>
          <p className="text-white/60 text-base mb-7">
            格闘技クイズに挑戦しよう
          </p>

          {/* ログイン / スタンプカードセクション */}
          <div className="bg-black/60 border border-white/10 rounded-sm p-6 backdrop-blur-sm">
            {verifying ? (
              <div className="flex items-center gap-3 py-2">
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin shrink-0" />
                <div>
                  <p className="text-white text-base font-bold">Issuing Stamp Card on Sui...</p>
                  <p className="text-white/40 text-sm mt-0.5">ブロックチェーンに登録中</p>
                </div>
              </div>
            ) : user ? (
              <div className="space-y-4">
                <p className="text-white/60 text-sm leading-relaxed">
                  ログイン中: <span className="text-white/80">{user.displayName ?? user.email}</span>
                </p>
                <button
                  onClick={() => router.push('/stamp-card')}
                  className="w-full py-3.5 text-base font-black uppercase tracking-wider text-white transition-opacity hover:opacity-80"
                  style={{ backgroundColor: 'var(--one-red)' }}
                >
                  マイスタンプカードを見る
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-white/60 text-sm leading-relaxed">
                  Googleでログインすると、クリア時にSuiブロックチェーン上のスタンプカードにスタンプが付与されます
                </p>
                <GoogleLoginButton onClick={handleGoogleLogin} />
              </div>
            )}
            {error && (
              <p className="text-red-400 text-sm mt-3 border border-red-800/50 bg-red-900/20 px-3 py-2">
                {error}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 体重クラス一覧 */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-white/70 text-xs font-black uppercase tracking-widest">Challenges</span>
          <div className="flex-1 h-px bg-white/20" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {WEIGHT_CLASSES.map(({ label, en, color, difficulty }) => (
            <button
              key={difficulty}
              onClick={() => router.push(`/quiz/${difficulty}`)}
              className="rounded-sm p-5 text-center transition-opacity hover:opacity-80 active:opacity-60"
              style={{ backgroundColor: 'var(--one-card)', borderTop: `2px solid ${color}` }}
            >
              <p className="text-white font-black text-base">{label}</p>
              <p className="text-white/50 text-[11px] uppercase tracking-wider mt-1">{en}</p>
              <p className="text-white/60 text-xs mt-2.5">× 1 stamp</p>
            </button>
          ))}
        </div>
        {!user && (
          <div
            className="flex items-center justify-center gap-2 mt-4 px-4 py-2.5 rounded-sm"
            style={{ backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            <svg viewBox="0 0 20 20" className="w-4 h-4 shrink-0" fill="rgba(255,255,255,0.5)">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p className="text-white/65 text-xs">
              ログインなしでも挑戦できます
              <span className="text-white/40 ml-1">（スタンプ付与にはログインが必要）</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
