import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Player } from '../types';

const T = {
  bg: '#07090f', 
  surface: '#0d1117', 
  surface2: '#161b27', 
  surface3: '#1e2535',
  primary: '#8b5cf6', 
  primaryLight: '#a78bfa', 
  primaryDark: '#5b21b6',
  amber: '#fbbf24', 
  red: '#f87171', 
  green: '#34d399',
  text: '#e2e8f0', 
  textMuted: '#94a3b8', 
  textDim: '#475569',
  border: 'rgba(139,92,246,0.18)', 
  borderSub: 'rgba(255,255,255,0.06)',
};

const font = "'Plus Jakarta Sans', system-ui, sans-serif";

interface ScoreboardProps {
  players: Player[];
  onNextRound: () => void;
  isGameOver: boolean;
  roundNumber: number;
  isHost: boolean;
  onLeave: () => void;
}

const CONFETTI_COLORS = [T.primary, T.amber, T.green, '#22d3ee', T.red, '#f472b6'];

const CONFETTI_SHAPES = ['circle', 'square', 'star', 'heart'] as const;
type ConfettiShape = typeof CONFETTI_SHAPES[number];

const Confetti: React.FC = () => {
  const pieces = useMemo(() =>
    [...Array(48)].map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 3 + Math.random() * 2,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 6 + Math.random() * 8,
      shape: CONFETTI_SHAPES[i % CONFETTI_SHAPES.length] as ConfettiShape,
    }))
  , []);

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 2, overflow: 'hidden' }}>
      {pieces.map(p => {
        const isIcon = p.shape === 'star' || p.shape === 'heart';
        const baseStyle: React.CSSProperties = {
          position: 'absolute', left: `${p.x}%`, top: -20, opacity: 0.8,
        };
        const shapeStyle: React.CSSProperties = isIcon
          ? baseStyle
          : {
              ...baseStyle,
              width: p.size, height: p.size, background: p.color,
              borderRadius: p.shape === 'circle' ? '50%' : '2px',
            };
        return (
          <motion.div
            key={p.id}
            style={shapeStyle}
            animate={{ y: ['0vh', '110vh'], rotate: [0, 360], opacity: [0, 0.8, 0.8, 0] }}
            transition={{ duration: p.duration, delay: p.delay, ease: 'linear', repeat: Infinity }}
          >
            {isIcon && (
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: p.size + 8,
                  color: p.color,
                  fontVariationSettings: "'FILL' 1",
                  display: 'inline-block', lineHeight: 1,
                }}
              >
                {p.shape === 'star' ? 'star' : 'favorite'}
              </span>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

const Scoreboard: React.FC<ScoreboardProps> = ({
  players, onNextRound, isGameOver, roundNumber, isHost, onLeave,
}) => {
  const sorted = useMemo(() => [...players].sort((a, b) => b.score - a.score), [players]);
  const winner = sorted[0];

  return (
    <div style={{ 
      fontFamily: font, background: T.bg, minHeight: '100vh', 
      color: T.text, overflowX: 'hidden', margin: 0, 
      display: 'flex', flexDirection: 'column' 
    }}>
      <style>{`
        .sb-btn-primary {
          padding: 0 32px; height: 56px; border-radius: 999px;
          background: linear-gradient(135deg, #8b5cf6 0%, #5b21b6 100%);
          color: #fff; font-size: 16px; font-weight: 800;
          border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;
          box-shadow: 0 8px 32px rgba(139,92,246,0.4);
          font-family: inherit; transition: all 0.2s;
        }
        .sb-btn-primary:hover { transform: scale(1.05); opacity: 0.9; }
        .sb-btn-primary:active { transform: scale(0.95); }

        .sb-btn-outline {
          padding: 0 32px; height: 52px; border-radius: 999px;
          background: rgba(255,255,255,0.03); border: 1px solid ${T.borderSub};
          color: ${T.textMuted}; font-size: 14px; font-weight: 700;
          cursor: pointer; display: flex; align-items: center; gap: 8px;
          font-family: inherit; transition: all 0.2s;
        }
        .sb-btn-outline:hover { background: rgba(255,255,255,0.08); color: ${T.text}; }

        .player-row {
          background: ${T.surface2}; border: 1.5px solid ${T.borderSub};
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .player-row:hover { border-color: rgba(139,92,246,0.3); transform: translateX(8px); background: rgba(139,92,246,0.04); }

        @media(max-width: 820px){ .sb-main { padding: 28px 28px 100px !important; } .sb-nav-mid { display: none !important; } .sb-header { padding: 0 24px !important; } }
      `}</style>

      {isGameOver && <Confetti />}

      {/* Navbar */}
      <header className="sb-header" style={{
        height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 48px', borderBottom: `1px solid ${T.borderSub}`,
        background: 'rgba(7,9,15,0.8)', backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/logo.png" alt="Logo" style={{ width: 32, height: 32, objectFit: 'contain' }} />
          <span style={{ fontSize: 20, fontWeight: 900, color: T.text, letterSpacing: '-0.03em' }}>Harf<span style={{ color: T.primary }}>ma</span>z</span>
        </div>

        <div className="sb-nav-mid" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{
            padding: '6px 16px', borderRadius: 999,
            background: isGameOver ? 'rgba(251,191,36,0.1)' : 'rgba(139,92,246,0.1)',
            color: isGameOver ? T.amber : T.primaryLight,
            fontSize: 12, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase',
            display: 'inline-flex', alignItems: 'center', gap: 6
          }}>
            {isGameOver && <span className="material-symbols-outlined" style={{ fontSize: 16 }}>flag</span>}
            {isGameOver ? 'Final' : `Tur ${roundNumber} Tamamlandı`}
          </span>
        </div>

        <button onClick={onLeave} style={{
          height: 42, padding: '0 16px', borderRadius: 10,
          background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)',
          color: T.red, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: font,
        }}>
          ↩ Ayrıl
        </button>
      </header>

      <main className="sb-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 48px 100px' }}>
        
        {/* Hero Section */}
        <section style={{ textAlign: 'center', marginBottom: 60, position: 'relative', width: '100%', maxWidth: 600 }}>
          <div style={{
            position: 'absolute', inset: '-100px',
            background: isGameOver 
              ? 'radial-gradient(circle at center, rgba(251,191,36,0.12) 0%, transparent 70%)'
              : 'radial-gradient(circle at center, rgba(139,92,246,0.1) 0%, transparent 70%)',
            pointerEvents: 'none', zIndex: -1
          }} />

          {isGameOver ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 48, color: T.amber, marginBottom: 16 }}>emoji_events</span>
              <h1 style={{ fontSize: 48, fontWeight: 900, marginBottom: 8, letterSpacing: '-0.04em' }}>Şampiyon {winner?.name}!</h1>
              <p style={{ fontSize: 18, color: T.textMuted }}>Efsanevi bir yarıştı. Tebrikler!</p>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h1 style={{ fontSize: 40, fontWeight: 900, marginBottom: 8, letterSpacing: '-0.03em' }}>Sıralama Güncellendi</h1>
              <p style={{ fontSize: 16, color: T.textMuted }}>Bir sonraki tur için her şey hazır.</p>
            </motion.div>
          )}
        </section>

        {/* Leaderboard List */}
        <section style={{ width: '100%', maxWidth: 640 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <AnimatePresence mode="popLayout">
              {sorted.map((p, i) => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="player-row"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 20px', borderRadius: 20,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 12,
                      background: i === 0 ? 'rgba(251,191,36,0.15)' : i === 1 ? 'rgba(148,163,184,0.1)' : i === 2 ? 'rgba(205,124,46,0.1)' : 'rgba(255,255,255,0.05)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, fontWeight: 900,
                      color: i === 0 ? T.amber : i === 1 ? T.textMuted : i === 2 ? '#cd7c2e' : T.textDim,
                    }}>
                      {i + 1}
                    </div>
                    
                    <div style={{ fontSize: 32, lineHeight: 1 }}>{p.avatar}</div>
                    
                    <div>
                      <p style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: 0 }}>{p.name}</p>
                      {i === 0 && (
                        <p style={{ fontSize: 10, fontWeight: 800, color: T.amber, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '2px 0 0' }}>
                          Liderlik Koltuğu
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 24, fontWeight: 900, color: i === 0 ? T.amber : T.primaryLight, letterSpacing: '-0.02em' }}>
                      {p.score}
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.textDim, textTransform: 'uppercase' }}>Puan</div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>

        {/* Footer Actions */}
        <footer style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, 
          padding: '24px 48px', background: 'rgba(7,9,15,0.9)',
          backdropFilter: 'blur(20px)', borderTop: `1px solid ${T.borderSub}`,
          display: 'flex', justifyContent: 'center', zIndex: 100
        }}>
          <div style={{ maxWidth: 640, width: '100%', display: 'flex', gap: 16, justifyContent: 'center' }}>
            {isHost ? (
              <button className="sb-btn-primary" onClick={onNextRound}>
                {isGameOver ? 'Yeni Oyun Başlat' : 'Sonraki Tur'}
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            ) : (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '0 32px', height: 56, borderRadius: 999,
                background: T.surface2, border: `1.5px solid ${T.borderSub}`,
                color: T.textMuted, fontSize: 15, fontWeight: 600,
              }}>
                <motion.div
                  style={{ width: 8, height: 8, borderRadius: '50%', background: T.primary }}
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                Liderin devam etmesi bekleniyor...
              </div>
            )}
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Scoreboard;
