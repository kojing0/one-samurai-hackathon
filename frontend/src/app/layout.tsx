import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ONE Samurai クイズ',
  description: '格闘技クイズでスタンプカードを集めよう',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-samurai-dark">
        <header className="border-b border-samurai-red/30 px-6 py-4">
          <h1 className="text-xl font-bold text-samurai-gold tracking-wider">
            ONE Samurai クイズ
          </h1>
        </header>
        <main className="container mx-auto max-w-2xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
