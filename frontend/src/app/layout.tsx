import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ONE SAMURAI QUIZ',
  description: '格闘技クイズでスタンプカードを集めよう',
};

function OneLogo() {
  return (
    <div className="flex items-center gap-0.5">
      {/* ONE ロゴ文字 */}
      <svg viewBox="0 0 80 28" className="h-7 w-auto fill-white" aria-label="ONE">
        <text x="0" y="22" fontFamily="Arial Black, Arial" fontWeight="900" fontSize="26" letterSpacing="-1">ONE</text>
      </svg>
      <div className="w-px h-5 bg-white/30 mx-2" />
      <span className="text-white text-[11px] font-bold uppercase tracking-[0.15em] leading-tight">
        SAMURAI<br />QUIZ
      </span>
    </div>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body
          className="min-h-screen"
          style={{
            backgroundImage: 'url(https://firebasestorage.googleapis.com/v0/b/one-samurai-hackathon.firebasestorage.app/o/backgroundImg.jpg?alt=media)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
          }}
        >
        {/* ヘッダー: ONE FC 公式と同じ黒帯 */}
        <header className="sticky top-0 z-50 bg-black border-b border-white/10">
          <div className="container mx-auto max-w-2xl px-4 h-14 flex items-center justify-between">
            <OneLogo />
          </div>
        </header>

        <main className="container mx-auto max-w-2xl px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
