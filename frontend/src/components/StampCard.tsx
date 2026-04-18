'use client';

import { type StampCard } from '@/lib/api';

interface Props {
  stampCard: StampCard;
}

const STAMPS = [
  { key: 'beginnerStamped' as const,     label: 'フライ級',   en: 'FLYWEIGHT',    color: '#3B82F6' },
  { key: 'intermediateStamped' as const, label: 'バンタム級', en: 'BANTAMWEIGHT', color: '#22C55E' },
  { key: 'advancedStamped' as const,     label: 'フェザー級', en: 'FEATHERWEIGHT', color: '#E31937' },
];

function Belt({ stamped, color, label, en }: { stamped: boolean; color: string; label: string; en: string }) {
  const strapColor = stamped ? color : 'rgba(255,255,255,0.08)';
  const plateColor = stamped ? color : 'rgba(255,255,255,0.06)';

  return (
    <div className="px-4 py-4 relative">
      {/* ベルト本体 */}
      <div className="relative flex items-center h-16">

        {/* 左ストラップ */}
        <div
          className="flex-1 h-7 relative overflow-hidden"
          style={{
            background: stamped
              ? `linear-gradient(90deg, ${color}30, ${color}70)`
              : 'rgba(255,255,255,0.05)',
            boxShadow: stamped ? `inset 0 1px 0 ${color}50, inset 0 -1px 0 ${color}30` : 'none',
          }}
        >
          {/* ステッチ線 */}
          {stamped && (
            <>
              <div className="absolute inset-x-0 top-1.5 h-px opacity-30" style={{ background: `repeating-linear-gradient(90deg, ${color} 0, ${color} 4px, transparent 4px, transparent 8px)` }} />
              <div className="absolute inset-x-0 bottom-1.5 h-px opacity-30" style={{ background: `repeating-linear-gradient(90deg, ${color} 0, ${color} 4px, transparent 4px, transparent 8px)` }} />
            </>
          )}
        </div>

        {/* センタープレート */}
        <div
          className="relative z-10 flex flex-col items-center justify-center shrink-0 mx-1"
          style={{
            width: 96,
            height: 64,
            background: stamped
              ? `linear-gradient(160deg, ${color}50 0%, ${color}30 40%, ${color}20 100%)`
              : 'rgba(255,255,255,0.04)',
            border: `1px solid ${stamped ? color : 'rgba(255,255,255,0.1)'}`,
            boxShadow: stamped
              ? `0 0 16px ${color}50, inset 0 1px 0 ${color}60`
              : 'none',
          }}
        >
          {/* 上下の装飾ライン */}
          <div className="absolute inset-x-2 top-1 h-px" style={{ backgroundColor: stamped ? `${color}60` : 'rgba(255,255,255,0.06)' }} />
          <div className="absolute inset-x-2 bottom-1 h-px" style={{ backgroundColor: stamped ? `${color}60` : 'rgba(255,255,255,0.06)' }} />

          {stamped ? (
            <>
              <svg viewBox="0 0 24 24" className="w-6 h-6 mb-0.5" fill={color}>
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
              <span className="text-[8px] font-black uppercase tracking-widest leading-none" style={{ color }}>
                {en}
              </span>
            </>
          ) : (
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="rgba(255,255,255,0.12)">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
            </svg>
          )}
        </div>

        {/* 右ストラップ */}
        <div
          className="flex-1 h-7 relative overflow-hidden"
          style={{
            background: stamped
              ? `linear-gradient(90deg, ${color}70, ${color}30)`
              : 'rgba(255,255,255,0.05)',
            boxShadow: stamped ? `inset 0 1px 0 ${color}50, inset 0 -1px 0 ${color}30` : 'none',
          }}
        >
          {stamped && (
            <>
              <div className="absolute inset-x-0 top-1.5 h-px opacity-30" style={{ background: `repeating-linear-gradient(90deg, ${color} 0, ${color} 4px, transparent 4px, transparent 8px)` }} />
              <div className="absolute inset-x-0 bottom-1.5 h-px opacity-30" style={{ background: `repeating-linear-gradient(90deg, ${color} 0, ${color} 4px, transparent 4px, transparent 8px)` }} />
            </>
          )}
        </div>
      </div>

      {/* ベルト下ラベル */}
      <div className="mt-2.5 flex items-center justify-between px-1">
        <span
          className="text-xs font-black"
          style={{ color: stamped ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.2)' }}
        >
          {label}
        </span>
        {stamped ? (
          <span
            className="text-[9px] font-black uppercase tracking-[0.15em] px-1.5 py-0.5"
            style={{ color, backgroundColor: `${color}20`, border: `1px solid ${color}40` }}
          >
            ACQUIRED
          </span>
        ) : (
          <span className="text-[9px] uppercase tracking-wider text-white/15">NOT YET</span>
        )}
      </div>
    </div>
  );
}

export default function StampCardComponent({ stampCard }: Props) {
  const stampedCount = STAMPS.filter(({ key }) => stampCard[key]).length;
  const allStamped = stampedCount === 3;

  return (
    <div
      className="overflow-hidden rounded-sm"
      style={{
        border: allStamped ? '1px solid #FFD70050' : '1px solid rgba(255,255,255,0.12)',
        boxShadow: allStamped ? '0 0 30px #FFD70020' : 'none',
      }}
    >
      {/* カードヘッダー */}
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{
          background: 'linear-gradient(135deg, #111 0%, #1a0a0a 50%, #111 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="text-white text-[11px] font-black px-2 py-0.5 uppercase tracking-widest"
            style={{ backgroundColor: 'var(--one-red)' }}
          >
            ONE
          </span>
          <span className="text-white text-sm font-black uppercase tracking-wider">
            SAMURAI STAMP CARD
          </span>
        </div>
        {allStamped && (
          <span
            className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 text-black"
            style={{ backgroundColor: '#FFD700' }}
          >
            CHAMPION
          </span>
        )}
      </div>

      {/* プログレスバー */}
      <div style={{ backgroundColor: '#0a0a0a', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="px-5 pt-3 pb-1 flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Progress</span>
          <span className="text-[10px] font-black text-white/30">{stampedCount} / 3</span>
        </div>
        <div className="px-5 pb-3">
          <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${(stampedCount / 3) * 100}%`,
                backgroundColor: allStamped ? '#FFD700' : 'var(--one-red)',
              }}
            />
          </div>
        </div>
      </div>

      {/* ベルト3本 */}
      <div
        className="divide-y"
        style={{
          backgroundColor: '#0d0d0d',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          borderColor: 'rgba(255,255,255,0.06)',
        }}
      >
        {STAMPS.map(({ key, label, en, color }) => (
          <Belt key={key} stamped={stampCard[key]} color={color} label={label} en={en} />
        ))}
      </div>

      {/* Sui Object ID + エクスプローラーリンク */}
      <a
        href={`https://suiscan.xyz/testnet/object/${stampCard.objectId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="px-5 py-2.5 flex items-center justify-between group"
        style={{ backgroundColor: '#080808' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Sui Object</span>
          <p className="text-white/30 text-[10px] font-mono group-hover:text-white/50 transition-colors">
            {stampCard.objectId.slice(0, 12)}...{stampCard.objectId.slice(-8)}
          </p>
        </div>
        <div className="flex items-center gap-1 text-white/20 group-hover:text-white/50 transition-colors">
          <span className="text-[9px] uppercase tracking-wider">SuiScan</span>
          <svg viewBox="0 0 12 12" className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 10L10 2M10 2H5M10 2V7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </a>

      {/* コンプリートバナー */}
      {allStamped && (
        <div
          className="px-5 py-3.5 text-center"
          style={{
            background: 'linear-gradient(90deg, transparent, #FFD70018, transparent)',
            borderTop: '1px solid #FFD70030',
          }}
        >
          <p className="text-xs font-black uppercase tracking-[0.25em]" style={{ color: '#FFD700' }}>
            ★ All Stamps Collected · Champion ★
          </p>
        </div>
      )}
    </div>
  );
}
