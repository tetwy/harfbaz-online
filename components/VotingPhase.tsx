import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Player, RoundAnswers, Vote } from '../types';

const T = {
  bg: '#07090f', surface: '#0d1117', surface2: '#161b27', surface3: '#1e2535',
  primary: '#8b5cf6', primaryLight: '#a78bfa', primaryDark: '#5b21b6',
  cyan: '#22d3ee', amber: '#fbbf24', red: '#f87171', green: '#34d399',
  text: '#e2e8f0', textMuted: '#94a3b8', textDim: '#475569',
  border: 'rgba(139,92,246,0.18)', borderSub: 'rgba(255,255,255,0.06)',
};

const font = "'Plus Jakarta Sans', system-ui, sans-serif";

interface VotingPhaseProps {
  players: Player[];
  answers: RoundAnswers;
  currentLetter: string;
  currentPlayerId: string;
  currentVotes: Vote[];
  currentCategoryIndex: number;
  isHost: boolean;
  onNextCategory: () => void;
  onToggleVote: (targetPlayerId: string) => void;
  onLeave: () => void;
  isHiddenMode: boolean;
  revealedPlayers: string[];
  onRevealCard: (playerId: string) => void;
  isLoading?: boolean;
  roundStartTime?: string;
  categories: string[];
}

const VotingPhase: React.FC<VotingPhaseProps> = ({
  players, answers, currentLetter, currentPlayerId,
  currentVotes, currentCategoryIndex, isHost,
  onNextCategory, onToggleVote, onLeave,
  isHiddenMode, revealedPlayers, onRevealCard,
  isLoading = false, roundStartTime, categories,
}) => {
  const category     = categories[currentCategoryIndex];
  const isLastCat    = currentCategoryIndex === categories.length - 1;

  const activePlayers = useMemo(() => {
    if (!roundStartTime) return players;
    const start = new Date(roundStartTime).getTime();
    return players.filter(p => new Date(p.joinedAt).getTime() <= start + 5000);
  }, [players, roundStartTime]);

  const amISpectator = !activePlayers.find(p => p.id === currentPlayerId);
  const totalActive  = activePlayers.length;

  const getVoteCount = (pid: string) =>
    currentVotes.filter(v => v.targetPlayerId === pid && v.category === category && v.isVeto).length;

  const iVetoed = (pid: string) =>
    currentVotes.some(v => v.voterId === currentPlayerId && v.targetPlayerId === pid && v.category === category && v.isVeto);

  const isRejected = (pid: string) => getVoteCount(pid) > totalActive / 2;

  const handleCardClick = (pid: string, isEmpty: boolean) => {
    if (isEmpty || amISpectator) return;
    const isMe    = pid === currentPlayerId;
    const revealed = revealedPlayers.includes(pid);
    if (isMe && isHiddenMode && !revealed) { onRevealCard(pid); return; }
    if (!isMe) onToggleVote(pid);
  };

  return (
    <div style={{ fontFamily: font, background: T.bg, minHeight: '100vh', color: T.text, overflowX: 'hidden', margin: 0, display: 'flex', flexDirection: 'column' }}>
      <style>{`
        .vp-cards {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 14px;
          padding: 0 48px 100px;
        }
        @media(max-width: 640px){ .vp-cards { grid-template-columns: 1fr; } }
        @media(max-width: 820px){ .vp-nav-mid { display: none !important; } .vp-main { padding: 28px 28px !important; } .vp-cards { padding: 0 !important; } }

        .vp-card {
          border-radius: 16px;
          padding: 18px 20px;
          display: flex; align-items: center; justify-content: space-between;
          transition: border-color 0.2s, background 0.2s, transform 0.15s;
          position: relative; overflow: hidden;
        }
        .vp-card:hover:not(.vp-card--empty) { transform: translateY(-1px); }

        .vp-veto-btn {
          width: 28px; height: 28px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; font-weight: 800; line-height: 1;
          transition: all 0.18s; border: 1.5px solid rgba(248,113,113,0.35);
          background: transparent; color: #f87171;
          flex-shrink: 0; padding: 0;
        }
        .vp-veto-btn .material-symbols-outlined { font-size: 16px; line-height: 1; }
        .vp-veto-btn.on {
          background: #f87171; color: #fff; border-color: #f87171;
          box-shadow: 0 4px 14px rgba(248,113,113,0.4);
        }
        .vp-veto-btn:hover { background: rgba(248,113,113,0.15); }
        .vp-veto-btn.on:hover { background: #ef4444; }

        .vp-next-btn {
          padding: 0 52px; height: 56px; border-radius: 999px;
          background: linear-gradient(135deg, #8b5cf6 0%, #5b21b6 100%);
          color: #fff; font-size: 17px; font-weight: 800;
          border: none; cursor: pointer; display: flex; align-items: center; gap: 10px;
          box-shadow: 0 8px 28px rgba(139,92,246,0.4);
          font-family: inherit; transition: opacity 0.2s, transform 0.15s;
        }
        .vp-next-btn:hover { opacity: 0.92; transform: scale(1.03); }
        .vp-next-btn:active { transform: scale(0.97); }
        .vp-next-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; box-shadow: none; }
      `}</style>

      {/* ── Navbar ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        height: 64,
        background: 'rgba(7,9,15,0.88)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${T.borderSub}`,
        display: 'flex', alignItems: 'center', padding: '0 24px',
      }}>
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/logo.png" alt="Logo" style={{ width: 36, height: 36, objectFit: 'contain' }} />
            <span style={{ fontSize: 18, fontWeight: 800, color: T.text, letterSpacing: '-0.03em' }}>Harf<span style={{ color: T.primary }}>ma</span>z</span>
          </div>

          <div className="vp-nav-mid" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              height: 28, padding: '0 12px', borderRadius: 999,
              background: 'rgba(139,92,246,0.12)', color: T.primaryLight,
              fontSize: 11, fontWeight: 800, letterSpacing: '0.05em',
              display: 'inline-flex', alignItems: 'center', gap: 6
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>how_to_vote</span>
              OYLAMA
            </span>
            <span style={{
              height: 28, padding: '0 12px', borderRadius: 999,
              background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.borderSub}`,
              color: T.text, fontSize: 14, fontWeight: 900,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 40
            }}>
              {currentLetter}
            </span>
            {isHiddenMode && (
              <span style={{
                height: 28, padding: '0 12px', borderRadius: 999,
                background: 'rgba(251,191,36,0.1)', color: T.amber,
                fontSize: 11, fontWeight: 700,
                display: 'inline-flex', alignItems: 'center', gap: 6
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>visibility_off</span>
                GİZLİ
              </span>
            )}
          </div>

          <button
            onClick={onLeave}
            style={{
              height: 42, padding: '0 16px', borderRadius: 10,
              background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)',
              color: T.red, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              fontFamily: font,
            }}
          >
            ↩ Ayrıl
          </button>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="vp-main" style={{
        padding: '28px 48px 60px',
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column' 
      }}>

        {/* ── Category progress bar ── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
            {categories.map((cat, i) => (
              <div key={cat} style={{ flex: 1, position: 'relative' }}>
                <div style={{
                  height: 6, borderRadius: 999,
                  background: i < currentCategoryIndex
                    ? 'rgba(52,211,153,0.5)'
                    : i === currentCategoryIndex
                      ? T.primary
                      : 'rgba(255,255,255,0.06)',
                  transition: 'background 0.3s',
                  overflow: 'hidden',
                }}>
                  {i === currentCategoryIndex && (
                    <motion.div
                      style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.25)' }}
                      animate={{ opacity: [0.3, 0.7, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {categories.map((cat, i) => (
              <span key={cat} style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
                color: i < currentCategoryIndex ? T.green
                  : i === currentCategoryIndex ? T.primaryLight
                  : T.textDim,
                flex: 1, textAlign: 'center', whiteSpace: 'nowrap',
                overflow: 'hidden', textOverflow: 'ellipsis' // ellipsis as fallback but flex:1 helps
              }}>
                {cat}
              </span>
            ))}
          </div>
        </div>

        {/* ── Section title ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCategoryIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{ textAlign: 'center', marginBottom: 28 }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: T.textDim, textTransform: 'uppercase', marginBottom: 8 }}>
              İnceleniyor ({currentCategoryIndex + 1}/{categories.length})
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 900, color: T.text, letterSpacing: '-0.03em', marginBottom: 8 }}>
              <span style={{ color: T.primaryLight }}>{category}</span>
            </h1>
            <p style={{ fontSize: 14, color: T.textMuted, maxWidth: 460, margin: '0 auto' }}>
              "{currentLetter}" harfiyle başlamayan veya geçersiz cevaplara veto verin.
            </p>
            {amISpectator && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                marginTop: 12, padding: '6px 16px', borderRadius: 999,
                background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)',
                color: T.amber, fontSize: 12, fontWeight: 700,
              }}>
                👁️ Sadece İzleyebilirsin
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* ── Answer cards ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCategoryIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="vp-cards"
          >
            {activePlayers.map((player, index) => {
              const answer    = answers[player.id]?.[category] || '';
              const isEmpty   = !answer.trim();
              const isMe      = player.id === currentPlayerId;
              const revealed  = revealedPlayers.includes(player.id);
              const hidden    = isHiddenMode && !revealed;
              const vetoed    = iVetoed(player.id);
              const rejected  = isRejected(player.id);
              const voteCount = getVoteCount(player.id);
              const canVeto   = !isEmpty && !isMe && !hidden && !amISpectator;
              const badStart  = !hidden && answer && !answer.trim().toLocaleUpperCase('tr-TR').startsWith(currentLetter);

              return (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleCardClick(player.id, isEmpty)}
                  className={`vp-card${isEmpty ? ' vp-card--empty' : ''}`}
                  style={{
                    background: rejected && !isEmpty
                      ? 'rgba(248,113,113,0.06)'
                      : vetoed && !isMe
                        ? 'rgba(248,113,113,0.04)'
                        : T.surface2,
                    border: `1px solid ${
                      rejected && !isEmpty ? 'rgba(248,113,113,0.35)'
                      : vetoed && !isMe    ? 'rgba(248,113,113,0.25)'
                      : isMe               ? T.border
                      : T.borderSub
                    }`,
                    opacity: isEmpty ? 0.42 : 1,
                    cursor: canVeto ? 'pointer' : isEmpty ? 'default' : isMe && isHiddenMode && !revealed ? 'pointer' : 'default',
                  }}
                >
                  {/* Left: avatar + info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                    {/* Avatar */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: 12,
                        background: isMe
                          ? 'rgba(139,92,246,0.15)'
                          : 'rgba(255,255,255,0.05)',
                        border: `2px solid ${
                          rejected && !isEmpty ? 'rgba(248,113,113,0.5)'
                          : isMe ? T.border
                          : T.borderSub
                        }`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 26,
                      }}>
                        {player.avatar}
                      </div>
                      {/* Score badge */}
                      <div style={{
                        position: 'absolute', bottom: -5, right: -5,
                        fontSize: 9, fontWeight: 800,
                        padding: '2px 5px', borderRadius: 999,
                        background: isEmpty || rejected
                          ? 'rgba(248,113,113,0.15)'
                          : 'rgba(52,211,153,0.15)',
                        color: isEmpty || rejected ? T.red : T.green,
                        border: `1.5px solid ${T.bg}`,
                      }}>
                        {isEmpty ? '—' : rejected ? '0' : '+10'}
                      </div>
                    </div>

                    {/* Info */}
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                        textTransform: 'uppercase', color: T.textDim, marginBottom: 1,
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}>
                        {player.name}
                        {isMe && (
                          <span style={{
                            fontSize: 9, padding: '1px 6px', borderRadius: 999,
                            background: 'rgba(139,92,246,0.15)', color: T.primaryLight,
                          }}>SEN</span>
                        )}
                      </div>

                      {/* Answer */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: 20, fontWeight: 800, color: T.text,
                          textDecoration: rejected && !isEmpty ? 'line-through' : 'none',
                          opacity: rejected && !isEmpty ? 0.45 : 1,
                          letterSpacing: '-0.02em',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160,
                        }}>
                          {isEmpty ? '—' : hidden ? '• • • • • •' : answer}
                        </span>

                        {hidden && isMe && (
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                            background: 'rgba(251,191,36,0.12)', color: T.amber,
                            cursor: 'pointer',
                          }}>
                            Göster →
                          </span>
                        )}
                        {badStart && !isEmpty && !rejected && (
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                            background: 'rgba(251,191,36,0.1)', color: T.amber,
                          }}>⚠ Harf?</span>
                        )}
                        {rejected && !isEmpty && (
                          <span style={{
                            fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 999,
                            background: 'rgba(248,113,113,0.12)', color: T.red,
                            letterSpacing: '0.04em',
                          }}>GEÇERSİZ</span>
                        )}
                      </div>

                      {/* Veto dots */}
                      {!isEmpty && !hidden && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 12, height: 12 }}>
                          {activePlayers.filter(p => p.id !== player.id).map(voter => {
                            const hasVoted = currentVotes.some(v =>
                              v.voterId === voter.id && v.targetPlayerId === player.id &&
                              v.category === category && v.isVeto
                            );
                            return (
                              <div key={voter.id} title={voter.name} style={{
                                width: 7, height: 7, borderRadius: '50%', transition: 'all 0.2s', flexShrink: 0,
                                background: hasVoted ? T.red : 'rgba(255,255,255,0.1)',
                                boxShadow: hasVoted ? `0 0 4px rgba(248,113,113,0.6)` : 'none',
                              }} />
                            );
                          })}
                          {voteCount > 0 && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: T.red, marginLeft: 2, lineHeight: 1 }}>
                              {voteCount} veto
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: veto button */}
                  {canVeto && (
                    <motion.button
                      className={`vp-veto-btn${vetoed ? ' on' : ''}`}
                      onClick={e => { e.stopPropagation(); onToggleVote(player.id); }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.88 }}
                    >
                      <span className="material-symbols-outlined">close</span>
                    </motion.button>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* ── Host actions ── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, marginTop: 'auto', paddingTop: 60 }}>

          {/* Player count pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 16px', borderRadius: 999,
            background: T.surface2, border: `1px solid ${T.borderSub}`,
          }}>
            <div style={{ display: 'flex' }}>
              {activePlayers.slice(0, 4).map((p, i) => (
                <div key={p.id} style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'rgba(139,92,246,0.15)',
                  border: `2px solid ${T.surface2}`,
                  marginLeft: i > 0 ? -8 : 0,
                  position: 'relative',
                  zIndex: 4 - i,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14,
                }}>
                  {p.avatar}
                </div>
              ))}
            </div>
            <span style={{ fontSize: 12, color: T.textMuted, fontWeight: 600 }}>
              {activePlayers.length} oyuncu oylama yapıyor
            </span>
          </div>

          {isHost ? (
            <motion.button
              className="vp-next-btn"
              onClick={onNextCategory}
              disabled={isLoading}
              whileHover={isLoading ? {} : { scale: 1.04 }}
              whileTap={isLoading ? {} : { scale: 0.97 }}
            >
              {isLoading ? (
                <motion.span
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                >
                  Yükleniyor...
                </motion.span>
              ) : (
                <>
                  {isLastCat ? 'Sonuçları Göster' : 'Sonraki Kategori'}
                  <span className="material-symbols-outlined" style={{ fontSize: 20, display: 'inline-flex', alignItems: 'center' }}>arrow_forward</span>
                </>
              )}
            </motion.button>
          ) : (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '16px 32px', borderRadius: 999,
              background: T.surface2, border: `1px solid ${T.borderSub}`,
              color: T.textMuted, fontSize: 14, fontWeight: 600,
            }}>
              <motion.div
                style={{ width: 8, height: 8, borderRadius: '50%', background: T.primary }}
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
              Yönetici devam ettirsin...
            </div>
          )}


        </div>
      </main>
    </div>
  );
};

export default VotingPhase;
