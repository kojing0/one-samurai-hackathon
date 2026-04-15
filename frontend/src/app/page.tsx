'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup, onAuthStateChanged, type User } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import GoogleLoginButton from '@/components/GoogleLoginButton';

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push('/stamp-card');
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  async function handleGoogleLogin() {
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged が検知してリダイレクト
    } catch {
      setError('ログインに失敗しました。もう一度お試しください。');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <p className="text-gray-400">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 py-16">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-samurai-gold mb-3">ONE Samurai クイズ</h2>
        <p className="text-gray-300 text-lg">格闘技の知識を試して、スタンプカードを集めよう</p>
      </div>

      <div className="bg-samurai-navy rounded-2xl p-8 w-full max-w-sm text-center space-y-4">
        <p className="text-gray-300 text-sm">
          Googleアカウントでログインすると、Suiブロックチェーン上にスタンプカードが発行されます
        </p>

        <GoogleLoginButton onClick={handleGoogleLogin} />

        {error && <p className="text-red-400 text-sm">{error}</p>}
      </div>

      <div className="grid grid-cols-3 gap-4 w-full text-center">
        {(['初級', '中級', '上級'] as const).map((level) => (
          <div key={level} className="bg-samurai-navy rounded-xl p-4">
            <p className="text-samurai-gold font-bold text-lg">{level}</p>
            <p className="text-gray-400 text-xs mt-1">スタンプ 1個</p>
          </div>
        ))}
      </div>
    </div>
  );
}
