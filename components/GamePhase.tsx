import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CATEGORIES } from '../constants';

const T = {
  bg: '#07090f', surface: '#0d1117', surface2: '#161b27', surface3: '#1e2535',
  primary: '#8b5cf6', primaryLight: '#a78bfa', primaryDark: '#5b21b6',
  cyan: '#22d3ee', amber: '#fbbf24', red: '#f87171', green: '#34d399',
  text: '#e2e8f0', textMuted: '#94a3b8', textDim: '#475569',
  border: 'rgba(139,92,246,0.18)', borderSub: 'rgba(255,255,255,0.06)',
};

const font = "'Plus Jakarta Sans', system-ui, sans-serif";

const CATEGORY_ICONS: Record<string, string> = {
  'İsim': 'person', 'Şehir': 'location_city', 'Hayvan': 'pets', 'Bitki': 'eco',
  'Eşya': 'inventory_2', 'Ünlü': 'person_celebrate', 'Ülke': 'public', 'Meslek': 'work',
  'Yemek': 'restaurant', 'Dizi/Film': 'movie',
};

const CATEGORY_PLACEHOLDERS: Record<string, string> = {
  'İsim': 'Bir isim girin...', 'Şehir': 'Bir şehir girin...',
  'Hayvan': 'Bir hayvan girin...', 'Bitki': 'Bir bitki girin...',
  'Eşya': 'Bir eşya girin...', 'Ünlü': 'Ünlü bir isim...',
  'Ülke': 'Bir ülke girin...', 'Meslek': 'Bir meslek girin...',
  'Yemek': 'Bir yemek girin...', 'Dizi/Film': 'Dizi veya film...',
};

interface GamePhaseProps {
  letter: string;
  roundDuration: number;
  roomId: string;
  playerId: string;
  gameId: string;
  roundNumber: number;
  onTimeUp: (answers: Record<string, string>) => void;
  onLeave: () => void;
  categories: string[];
  roundStartTime?: string;
}

const GamePhase: React.FC<GamePhaseProps> = ({
  letter, roundDuration, gameId, roundNumber, onTimeUp, onLeave, categories, roundStartTime,
}) => {
  const storageKey = `harfbaz_answers_${gameId}_${roundNumber}`;

  const calcTime = () => {
    if (!roundStartTime) return roundDuration;
    const elapsed = (Date.now() - new Date(roundStartTime).getTime()) / 1000;
    return Math.max(0, Math.ceil(roundDuration - elapsed));
  };

  const loadAnswers = (): Record<string, string> => {
    try { const s = localStorage.getItem(storageKey); if (s) return JSON.parse(s); } catch { /**/ }
    return {};
  };

  const [timeLeft,   setTimeLeft]   = useState(calcTime);
  const [answers,    setAnswers]    = useState<Record<string, string>>(loadAnswers);
  const [submitted,  setSubmitted]  = useState(false);
  const [focusedCat, setFocusedCat] = useState<string | null>(null);

  const answersRef   = useRef(answers);
  const submittedRef = useRef(false);
  const onTimeUpRef  = useRef(onTimeUp);

  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { onTimeUpRef.current = onTimeUp; }, [onTimeUp]);

  useEffect(() => {
    try {
      if (Object.keys(answers).length > 0)
        localStorage.setItem(storageKey, JSON.stringify(answers));
    } catch { /**/ }
  }, [answers, storageKey]);

  useEffect(() => {
    setAnswers(loadAnswers());
    setSubmitted(false);
    submittedRef.current = false;
    setTimeLeft(calcTime());
    try {
      const toRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith('harfbaz_answers_') && k !== storageKey) toRemove.push(k);
      }
      toRemove.forEach(k => localStorage.removeItem(k));
    } catch { /**/ }
  }, [gameId, roundNumber]);

  const doSubmit = () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitted(true);
    onTimeUpRef.current(answersRef.current);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const r = calcTime();
      setTimeLeft(r);
      if (r <= 0) { clearInterval(timer); doSubmit(); }
    }, 1000);
    return () => clearInterval(timer);
  }, [roundStartTime, roundDuration]);

  useEffect(() => {
    const handle = () => { if (!submittedRef.current && calcTime() <= 0) doSubmit(); };
    document.addEventListener('visibilitychange', handle);
    window.addEventListener('pageshow', handle);
    return () => {
      document.removeEventListener('visibilitychange', handle);
      window.removeEventListener('pageshow', handle);
    };
  }, [roundStartTime, roundDuration]);

  const safeDuration  = roundDuration > 0 ? roundDuration : 60;
  const progress      = Math.max(0, Math.min(1, timeLeft / safeDuration));
  const displayCats   = categories?.length > 0 ? categories : CATEGORIES;
  const filledCount   = displayCats.filter(c => answers[c]?.trim()).length;
  const isUrgent      = timeLeft <= 10 && !submitted;
  const isWarning     = timeLeft <= 30 && !submitted;
  const allFilled     = filledCount === displayCats.length;
  const timerColor    = timeLeft > 30 ? T.primary : timeLeft > 10 ? T.amber : T.red;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ fontFamily: font, background: T.bg, minHeight: '100vh', color: T.text, overflowX: 'hidden', margin: 0, display: 'flex', flexDirection: 'column' }}>
      <style>{`
        .gp-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
          gap: 14px;
          padding: 0 48px 120px;
        }
        @media(max-width: 680px){ .gp-grid { grid-template-columns: 1fr; padding: 0 16px 110px; } }

        .gp-card {
          border-radius: 20px; padding: 22px;
          border: 1.5px solid rgba(255,255,255,0.06);
          background: ${T.surface2};
          transition: all 0.25s;
          position: relative; overflow: hidden;
        }
        .gp-card.filled  { background: rgba(52,211,153,0.04); border-color: rgba(52,211,153,0.25); }
        .gp-card.focused { border-color: rgba(139,92,246,0.45); box-shadow: 0 0 20px rgba(139,92,246,0.1); }
        .gp-card.bad     { border-color: rgba(248,113,113,0.38); }
        .gp-card:hover:not(.filled):not(.focused) { border-color: rgba(255,255,255,0.12); background: rgba(255,255,255,0.02); }

        .gp-input {
          width: 100%; box-sizing: border-box;
          padding: 14px 16px; border-radius: 12px;
          border: 1.5px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.03);
          color: #e2e8f0; font-size: 15px; font-weight: 600;
          outline: none; font-family: inherit;
          transition: all 0.2s;
          position: relative; z-index: 2;
        }
        .gp-input:focus { border-color: ${T.primaryLight}; background: rgba(255,255,255,0.06); box-shadow: 0 0 15px rgba(139,92,246,0.15); }
        .gp-input.filled { border-color: rgba(52,211,153,0.2); background: rgba(52,211,153,0.03); }
        .gp-input.bad { border-color: rgba(248,113,113,0.3); background: rgba(248,113,113,0.04); color: #f87171; }

        .gp-stop {
          padding: 18px 44px; border-radius: 16px;
          background: linear-gradient(135deg, #f87171 0%, #dc2626 100%);
          color: #fff; font-size: 17px; font-weight: 900;
          border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
          font-family: inherit; letter-spacing: 0.1em;
          box-shadow: 0 8px 32px rgba(220,38,38,0.4);
          transition: all 0.2s;
        }
        .gp-stop:hover { opacity: 0.9; transform: scale(1.03); }
        .gp-stop:active { transform: scale(0.97); }
        .gp-stop:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        @keyframes gp-dot-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }

        @media (max-width: 820px) {
          .gp-nav-mid { display: none !important; }
          .gp-timer { width: 100%; }
          .gp-stop, .gp-submitted { width: 100%; }
        }
      `}</style>

      {/* ── Navbar ── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 64,
        background: 'rgba(7,9,15,0.9)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${T.borderSub}`,
        display: 'flex', alignItems: 'center', padding: '0 24px',
      }}>
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/logo.png" alt="Logo" style={{ width: 36, height: 36, objectFit: 'contain' }} />
            <span style={{ fontSize: 18, fontWeight: 800, color: T.text, letterSpacing: '-0.03em' }}>Harf<span style={{ color: T.primary }}>ma</span>z</span>
          </div>

          <div className="gp-nav-mid" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              padding: '5px 14px', borderRadius: 999,
              background: 'rgba(139,92,246,0.12)', color: T.primaryLight,
              fontSize: 12, fontWeight: 700, letterSpacing: '0.05em',
            }}>TUR {roundNumber}</span>

            <span style={{
              padding: '5px 14px', borderRadius: 999,
              background: allFilled ? 'rgba(52,211,153,0.15)' : 'rgba(52,211,153,0.08)',
              color: T.green, fontSize: 12, fontWeight: 700,
              transition: 'background 0.3s',
            }}>{filledCount}/{displayCats.length} ✓</span>
          </div>

          <button onClick={onLeave} style={{
            height: 42, padding: '0 16px', borderRadius: 10,
            background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)',
            color: T.red, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: font,
          }}>
            ↩ Ayrıl
          </button>
        </div>
      </header>

      {/* ── Time progress strip ── */}
      <div style={{ position: 'fixed', top: 64, left: 0, right: 0, zIndex: 99, height: 4, background: 'rgba(255,255,255,0.04)' }}>
        <div style={{
          height: '100%',
          width: `${progress * 100}%`,
          background: timerColor,
          transition: 'width 1s linear, background 0.5s',
          borderRadius: '0 2px 2px 0',
        }} />
      </div>

      {/* ── Hero section ── */}
      <div style={{ paddingTop: 68 }}>
        <div style={{
          padding: '28px 28px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 20,
        }}>
          {/* Left: letter + progress dots */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <motion.div
              animate={isUrgent
                ? { scale: [1, 1.12, 1], rotate: [0, -4, 4, 0] }
                : { scale: 1, rotate: 0 }
              }
              transition={{ duration: 0.4, repeat: isUrgent ? Infinity : 0 }}
              style={{
                width: 84, height: 84, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 64, fontWeight: 900, color: T.primaryLight,
              }}
            >{letter}</motion.div>

            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: '0 0 14px' }}>
                Tüm kategorileri{' '}
                <span style={{ color: T.primaryLight, fontWeight: 900 }}>"{letter}"</span>
                {' '}ile doldur
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                {displayCats.map(cat => (
                  <div
                    key={cat}
                    title={cat}
                    style={{
                      width: 9, height: 9, borderRadius: '50%',
                      background: answers[cat]?.trim() ? T.green : 'rgba(255,255,255,0.1)',
                      boxShadow: answers[cat]?.trim() ? `0 0 6px ${T.green}60` : 'none',
                      transition: 'all 0.3s',
                    }}
                  />
                ))}
                <span style={{ fontSize: 11, fontWeight: 700, color: T.textDim, marginLeft: 6 }}>
                  {filledCount}/{displayCats.length} tamamlandı
                </span>
              </div>
            </div>
          </div>

          {/* Right: digital timer */}
          <div className="gp-timer" style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            padding: '12px 20px',
            transition: 'all 0.5s',
          }}>
            <p style={{ fontSize: 10, fontWeight: 800, color: T.textDim, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
              Kalan Süre
            </p>
            <motion.div
              animate={isUrgent ? { scale: [1, 1.06, 1] } : { scale: 1 }}
              transition={{ duration: 0.5, repeat: isUrgent ? Infinity : 0 }}
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 44, fontWeight: 900, letterSpacing: '0.04em',
                color: isUrgent ? T.red : isWarning ? T.amber : T.text,
                lineHeight: 1,
              }}
            >{formatTime(timeLeft)}</motion.div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: submitted ? T.green : timerColor,
                animation: submitted ? 'none' : 'gp-dot-pulse 1.4s ease infinite',
              }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: T.textDim }}>
                {submitted ? 'Gönderildi' : 'Devam ediyor'}
              </span>
            </div>
          </div>
        </div>

        {/* Submitted overlay banner */}
        <AnimatePresence>
        </AnimatePresence>

        {/* Divider */}
        <div style={{ borderTop: `1px solid ${T.borderSub}`, marginBottom: 20 }} />

        {/* ── Category cards ── */}
        <div className="gp-grid">
          {displayCats.map((cat, idx) => {
            const val         = answers[cat] || '';
            const filled      = !!val.trim();
            const isFocused   = focusedCat === cat;
            const wrongLetter = filled && !val.trim().toLocaleUpperCase('tr-TR').startsWith(letter);
            const statusClass = `${wrongLetter ? ' bad' : filled ? ' filled' : isFocused ? ' focused' : ''}`;

            return (
              <motion.div
                key={cat}
                className={`gp-card ${statusClass}`}
                whileHover={{ y: -4 }}
              >
                {/* Background Icon */}
                <span className="material-symbols-outlined" style={{
                  position: 'absolute', right: -10, bottom: -10, fontSize: 100,
                  opacity: filled ? 0.08 : 0.04, color: wrongLetter ? T.red : filled ? T.green : T.text,
                  pointerEvents: 'none', zIndex: 0
                }}>
                  {CATEGORY_ICONS[cat] || 'category'}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className="material-symbols-outlined" style={{ 
                      fontSize: 24, color: wrongLetter ? T.red : filled ? T.green : isFocused ? T.primaryLight : T.textDim 
                    }}>
                      {CATEGORY_ICONS[cat] || 'category'}
                    </span>
                    <div>
                      <p style={{ 
                        fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0,
                        color: wrongLetter ? T.red : filled ? T.green : T.textDim 
                      }}>
                        {cat}
                      </p>
                      {filled && (
                        <p style={{ fontSize: 11, color: wrongLetter ? T.red : T.textMuted, margin: '2px 0 0', fontWeight: 600 }}>
                          {wrongLetter ? 'Yanlış Harf' : 'Dolduruldu'}
                        </p>
                      )}
                    </div>
                  </div>
                  {filled && (
                    <div style={{
                      width: 28, height: 28, borderRadius: 10,
                      background: wrongLetter ? 'rgba(248,113,113,0.12)' : 'rgba(52,211,153,0.12)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, color: wrongLetter ? T.red : T.green,
                    }}>
                      {wrongLetter ? '!' : '✓'}
                    </div>
                  )}
                </div>

                <input
                  type="text"
                  className={`gp-input${wrongLetter ? ' bad' : filled ? ' filled' : ''}`}
                  placeholder={CATEGORY_PLACEHOLDERS[cat] || 'Buraya yazın...'}
                  value={val}
                  onChange={e => setAnswers(prev => ({ ...prev, [cat]: e.target.value }))}
                  onFocus={() => setFocusedCat(cat)}
                  onBlur={() => setFocusedCat(null)}
                  onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }}
                  disabled={submitted}
                />
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── Bottom action bar ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(7,9,15,0.95)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderTop: `1px solid ${T.borderSub}`,
        padding: '14px 24px',
      }}>
        <div style={{
          maxWidth: 1160, margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
        }}>
          {!submitted ? (
            <motion.button
              className="gp-stop"
              disabled={submitted}
              onClick={doSubmit}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Cevapları Gönder
            </motion.button>
          ) : (
            <div className="gp-submitted" style={{
              padding: '16px 28px', borderRadius: 16,
              background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)',
              color: T.green, fontSize: 15, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>check_circle</span>
              Gönderildi
              <span style={{ width: 1, height: 18, background: 'currentColor', opacity: 0.3, margin: '0 2px' }} />
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="material-symbols-outlined"
                style={{ fontSize: 18, display: 'inline-flex' }}
              >
                progress_activity
              </motion.span>
              Diğerleri bekleniyor
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GamePhase;
