'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup, onAuthStateChanged, GoogleAuthProvider } from 'firebase/auth';
import { jwtToAddress } from '@mysten/zklogin';
import { auth, googleProvider } from '@/lib/firebase';
import { verifyUser } from '@/lib/api';
import GoogleLoginButton from '@/components/GoogleLoginButton';

// ハッカソン用固定ソルト（本番では per-user のソルトを使用すること）
const ZKLOGIN_SALT = BigInt(0);

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // ログイン処理中は onAuthStateChanged によるリダイレクトを抑制する
  const isSigningIn = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && !isSigningIn.current) {
        // ページリフレッシュ時など、すでに認証済みの場合
        router.push('/stamp-card');
      } else if (!user) {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  async function handleGoogleLogin() {
    setError(null);
    isSigningIn.current = true;
    setVerifying(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const googleIdToken = credential?.idToken;

      if (!googleIdToken) throw new Error('Google IDトークンの取得に失敗しました');

      // Google JWT + ソルト → Sui アドレスを導出（zkLogin）
      const suiAddress = jwtToAddress(googleIdToken, ZKLOGIN_SALT);

      // バックエンドにユーザー登録 & 初回はスタンプカード発行
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
        {verifying ? (
          <div className="space-y-3">
            <p className="text-samurai-gold text-sm animate-pulse">
              Suiブロックチェーンにスタンプカードを発行中...
            </p>
            <p className="text-gray-500 text-xs">しばらくお待ちください</p>
          </div>
        ) : (
          <>
            <p className="text-gray-300 text-sm">
              Googleアカウントでログインすると、Suiブロックチェーン上にスタンプカードが発行されます
            </p>
            <GoogleLoginButton onClick={handleGoogleLogin} />
          </>
        )}

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
