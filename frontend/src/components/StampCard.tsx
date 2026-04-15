'use client';

import { type StampCard } from '@/lib/api';

interface Props {
  stampCard: StampCard;
}

const STAMPS = [
  { key: 'beginnerStamped' as const, label: '初級', color: 'text-green-400' },
  { key: 'intermediateStamped' as const, label: '中級', color: 'text-blue-400' },
  { key: 'advancedStamped' as const, label: '上級', color: 'text-samurai-gold' },
];

export default function StampCardComponent({ stampCard }: Props) {
  const allStamped = stampCard.beginnerStamped && stampCard.intermediateStamped && stampCard.advancedStamped;

  return (
    <div className="bg-samurai-navy rounded-2xl p-6 border border-samurai-gold/30">
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-samurai-gold font-bold text-lg">ONE Samurai スタンプカード</p>
          <p className="text-gray-500 text-xs mt-1 break-all">
            Sui: {stampCard.objectId.slice(0, 8)}...{stampCard.objectId.slice(-6)}
          </p>
        </div>
        {allStamped && (
          <span className="bg-samurai-gold text-black text-xs font-bold px-2 py-1 rounded-full">
            コンプリート
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {STAMPS.map(({ key, label, color }) => {
          const stamped = stampCard[key];
          return (
            <div
              key={key}
              className={`rounded-xl p-4 text-center border-2 transition-all ${
                stamped
                  ? 'border-samurai-gold bg-samurai-gold/10'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              <div className="text-3xl mb-2">{stamped ? '🥋' : '⬜'}</div>
              <p className={`text-sm font-bold ${stamped ? color : 'text-gray-500'}`}>{label}</p>
              {stamped && <p className="text-xs text-gray-400 mt-1">取得済み</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
