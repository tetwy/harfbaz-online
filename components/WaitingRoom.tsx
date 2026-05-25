import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Room, Player, RoomSettings } from '../types';
import { CATEGORIES, MAX_PLAYERS } from '../constants';

const T = {
  bg: '#07090f',
  surface: '#0d1117',
  surface2: '#161b27',
  surface3: '#1e2535',
  primary: '#8b5cf6',
  primaryLight: '#a78bfa',
  primaryDark: '#5b21b6',
  cyan: '#22d3ee',
  amber: '#fbbf24',
  red: '#f87171',
  green: '#34d399',
  text: '#e2e8f0',
  textMuted: '#94a3b8',
  textDim: '#475569',
  border: 'rgba(139,92,246,0.18)',
  borderSub: 'rgba(255,255,255,0.06)',
};

interface WaitingRoomProps {
  room: Room;
  currentPlayer: Player;
  onStart: () => void;
  onUpdateSettings: (settings: RoomSettings) => void;
  onLeave: () => void;
  onKick: (playerId: string) => void;
  onSetPublic: (isPublic: boolean) => void;
}

interface SegProps {
  label: string;
  options: number[];
  value: number;
  suffix?: string;
  onSelect: (v: number) => void;
  disabled?: boolean;
  inputValue: string;
  onInputChange: (v: string) => void;
  onInputBlur: (v: string) => void;
}

const SegmentedControl: React.FC<SegProps> = ({
  label, options, value, suffix = '', onSelect, disabled,
  inputValue, onInputChange, onInputBlur,
}) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
      <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.textDim, margin: 0, fontFamily: 'inherit' }}>
        {label}
      </p>
      <span style={{ fontSize: 13, fontWeight: 800, color: T.primary }}>{value}{suffix}</span>
    </div>
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', height: 42 }}>
      <div style={{ flex: 1, display: 'flex', height: '100%', padding: 4, borderRadius: 12, background: T.surface2, border: `1px solid ${T.borderSub}` }}>
        {options.map(opt => {
          const active = value === opt;
          return (
            <button
              key={opt}
              onClick={() => !disabled && onSelect(opt)}
              style={{
                flex: 1, height: '100%', borderRadius: 8, border: 'none',
                background: active ? T.primary : 'transparent',
                color: active ? '#fff' : T.textMuted,
                fontSize: 13, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1, fontFamily: 'inherit', transition: 'all 0.18s',
                boxShadow: active ? `0 2px 12px rgba(139,92,246,0.4)` : 'none',
              }}
            >
              {opt}{suffix}
            </button>
          );
        })}
      </div>
      <input
        type="text"
        value={inputValue}
        onChange={e => { if (!disabled && /^\d*$/.test(e.target.value)) onInputChange(e.target.value); }}
        onBlur={e => !disabled && onInputBlur(e.target.value)}
        onFocus={e => { if (!disabled) e.target.style.borderColor = T.primary; }}
        disabled={disabled}
        placeholder="?"
        style={{
          width: 52, height: '100%', borderRadius: 10, border: `1.5px solid ${T.borderSub}`,
          background: T.surface2, color: T.text, fontSize: 13, fontWeight: 700,
          textAlign: 'center', outline: 'none', fontFamily: 'inherit',
          cursor: disabled ? 'not-allowed' : 'text', opacity: disabled ? 0.5 : 1, transition: 'border-color 0.15s',
        }}
      />
    </div>
  </div>
);

const WaitingRoom: React.FC<WaitingRoomProps> = ({
  room, currentPlayer, onStart, onUpdateSettings, onLeave, onKick, onSetPublic,
}) => {
  const [copied, setCopied] = useState(false);
  const [localRounds, setLocalRounds] = useState(room.settings.totalRounds.toString());
  const [localDuration, setLocalDuration] = useState(room.settings.roundDuration.toString());
  const [log, setLog] = useState<{ id: number; player: string; msg: string; color: string }[]>([
    { id: 0, player: currentPlayer.name, msg: 'odayı oluşturdu', color: T.primary },
  ]);
  const logRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(room.players.length);

  useEffect(() => {
    if (room.players.length > prevCountRef.current) {
      const newest = room.players[room.players.length - 1];
      if (newest && newest.id !== currentPlayer.id) {
        setLog(l => [...l, { id: Date.now(), player: newest.name, msg: 'lobiye katıldı', color: T.green }]);
      }
    }
    prevCountRef.current = room.players.length;
  }, [room.players.length]);

  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [log]);
  useEffect(() => { setLocalRounds(room.settings.totalRounds.toString()); }, [room.settings.totalRounds]);
  useEffect(() => { setLocalDuration(room.settings.roundDuration.toString()); }, [room.settings.roundDuration]);

  const copyCode = () => {
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const codePill = (
    <div
      className="room-code-pill"
      style={{ height: 42, padding: '0 22px', borderRadius: 10, background: T.surface2, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 24, cursor: 'default', transition: 'all 0.2s' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: T.textDim, textTransform: 'uppercase', letterSpacing: '0.14em', whiteSpace: 'nowrap' }}>Oda Kodu</div>
        <div style={{ width: 1, height: 18, background: T.borderSub }} />
        <div className="code-display" style={{ fontSize: 22, fontWeight: 900, color: T.primary, letterSpacing: '0.28em', lineHeight: 1, transition: 'all 0.35s ease', filter: 'blur(5px)', opacity: 0.2, transform: 'translateY(1px)' }}>{room.code}</div>
      </div>
      <motion.button
        onClick={copyCode}
        whileHover={{ scale: 1.15, background: 'rgba(255,255,255,0.05)' }} whileTap={{ scale: 0.9 }}
        style={{ width: 32, height: 32, borderRadius: 10, background: 'none', border: 'none', color: copied ? T.green : T.primaryLight, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{copied ? 'check' : 'content_copy'}</span>
      </motion.button>
    </div>
  );

  const preset = (key: keyof RoomSettings, val: number) => {
    if (!currentPlayer.isHost) return;
    onUpdateSettings({ ...room.settings, [key]: val });
  };

  const handleBlur = (key: 'totalRounds' | 'roundDuration', raw: string) => {
    if (!currentPlayer.isHost) return;
    let v = parseInt(raw) || 0;
    if (key === 'totalRounds') v = Math.max(1, Math.min(28, v));
    if (key === 'roundDuration') v = Math.max(10, Math.min(300, v));
    onUpdateSettings({ ...room.settings, [key]: v });
    if (key === 'totalRounds') setLocalRounds(v.toString());
    if (key === 'roundDuration') setLocalDuration(v.toString());
  };

  const toggleCategory = (cat: string) => {
    if (!currentPlayer.isHost) return;
    const current = room.settings.categories ?? CATEGORIES;
    if (current.length === 1 && current.includes(cat)) return;
    const updated = current.includes(cat) ? current.filter(c => c !== cat) : [...current, cat];
    onUpdateSettings({ ...room.settings, categories: updated });
  };

  const activeCategories = room.settings.categories ?? CATEGORIES;
  const DURATIONS = [45, 60, 90];
  const ROUNDS = [3, 5, 10];

  const css = `
    @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    @keyframes pulse{0%,100%{opacity:0.4}50%{opacity:1}}
    .wr-layout{display:grid;grid-template-columns:300px 1fr 260px;gap:20px;align-items:stretch}
    .wr-panel{background:${T.surface};border:1px solid ${T.borderSub};border-radius:20px;padding:24px}
    .wr-cat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(75px,1fr));gap:8px}
    .wr-cat{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:8px 4px;border-radius:12px;background:${T.surface2};border:1.5px solid ${T.borderSub};cursor:pointer;transition:all 0.2s;text-align:center;height:70px;position:relative}
    .wr-cat.on{border-color:rgba(139,92,246,0.5);background:rgba(139,92,246,0.1)}
    .wr-cat:not(.on):hover{border-color:rgba(255,255,255,0.15);background:rgba(255,255,255,0.03)}
    .wr-pcard{background:${T.surface2};border:1.5px solid ${T.borderSub};border-radius:16px;padding:20px 16px;display:flex;flex-direction:column;align-items:center;gap:12px;position:relative;transition:border-color 0.2s}
    .wr-pcard.me{border-color:rgba(139,92,246,0.45)}
    @media(max-width:1080px){.wr-layout{grid-template-columns:280px 1fr 240px;gap:16px}}
    .wr-code-mobile{display:none;padding:28px 28px 0;justify-content:center}
    .wr-body{padding:28px 48px 60px}
    @media(max-width:820px){
      .wr-layout{grid-template-columns:1fr}
      .wr-left{order:2}
      .wr-mid{order:1}
      .wr-right{order:3}
      .wr-code-desktop{display:none !important}
      .wr-nav-sub-desktop{display:none !important}
      .wr-nav-divider-desktop{display:none !important}
      .wr-code-mobile{display:flex}
      .wr-code-mobile .room-code-pill{flex:1;justify-content:space-between}
      .wr-body{padding:28px 28px}
    }
    .room-code-pill:hover .code-display{filter:none !important;opacity:1 !important}
  `;

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif", background: T.bg, minHeight: '100vh', color: T.text, overflowX: 'hidden', margin: 0, display: 'flex', flexDirection: 'column' }}>
      <style>{css}</style>

      {/* ── Navbar ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, height: 64, display: 'flex', alignItems: 'center', padding: '0 24px', background: 'rgba(7,9,15,0.88)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderBottom: `1px solid ${T.border}` }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/logo.png" alt="Logo" style={{ width: 36, height: 36, objectFit: 'contain' }} />
          <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.04em' }}>Harf<span style={{ color: T.primary }}>ma</span>z</span>
          <span className="wr-nav-divider-desktop" style={{ width: 1, height: 20, background: T.borderSub, margin: '0 6px' }} />
          <span className="wr-nav-sub-desktop" style={{ fontSize: 12, fontWeight: 700, color: T.textDim, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Bekleme Odası</span>
        </div>
        <div style={{ flex: 1 }} />

        {/* Room code + leave */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="wr-code-desktop">{codePill}</div>
          <button
            onClick={onLeave}
            style={{ height: 42, padding: '0 16px', borderRadius: 10, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: T.red, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            ↩ Ayrıl
          </button>
        </div>
      </nav>

      {/* Mobile-only: navbar altında oda kodu banner'ı */}
      <div className="wr-code-mobile">
        {codePill}
      </div>

      {/* ── Page body ── */}
      <div className="wr-body">

        {/* Sub-header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 3px', letterSpacing: '-0.03em' }}>Bekleme Odası</h1>
            <p style={{ fontSize: 13, color: T.textMuted, margin: 0 }}>Arkadaşlarını bekle, hazır olduğunda oyunu başlat</p>
          </div>
          {/* Stacked avatars */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: T.textDim, marginRight: 8 }}>groups</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: T.textMuted }}>{room.players.length}/{MAX_PLAYERS} oyuncu</span>
          </div>
        </div>

        {/* ── 3-column layout ── */}
        <div className="wr-layout">

          {/* ═══ LEFT: Settings ═══ */}
          <motion.div className="wr-panel wr-left" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22, paddingBottom: 18, borderBottom: `1px solid ${T.borderSub}` }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: T.primaryLight }}>settings</span>
              <h2 style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>Oyun Ayarları</h2>
              {!currentPlayer.isHost && <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: T.textDim, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Salt okunur</span>}
            </div>

            <SegmentedControl
              label="Tur Sayısı" options={ROUNDS} value={room.settings.totalRounds}
              onSelect={v => preset('totalRounds', v)} disabled={!currentPlayer.isHost}
              inputValue={localRounds} onInputChange={setLocalRounds}
              onInputBlur={v => handleBlur('totalRounds', v)}
            />
            <SegmentedControl
              label="Tur Süresi" options={DURATIONS} suffix="s" value={room.settings.roundDuration}
              onSelect={v => preset('roundDuration', v)} disabled={!currentPlayer.isHost}
              inputValue={localDuration} onInputChange={setLocalDuration}
              onInputBlur={v => handleBlur('roundDuration', v)}
            />

            {/* Hidden mode toggle */}
            <button
              onClick={() => currentPlayer.isHost && onUpdateSettings({ ...room.settings, isHiddenMode: !room.settings.isHiddenMode })}
              disabled={!currentPlayer.isHost}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '13px 16px', borderRadius: 14, fontFamily: 'inherit', textAlign: 'left', cursor: currentPlayer.isHost ? 'pointer' : 'not-allowed',
                border: `1.5px solid ${room.settings.isHiddenMode ? 'rgba(139,92,246,0.4)' : T.borderSub}`,
                background: room.settings.isHiddenMode ? `rgba(139,92,246,0.08)` : T.surface2,
                opacity: !currentPlayer.isHost ? 0.6 : 1, marginBottom: 20, transition: 'all 0.2s',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: room.settings.isHiddenMode ? T.primaryLight : T.textMuted }}>
                {room.settings.isHiddenMode ? 'visibility_off' : 'visibility'}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 1 }}>Gizli Mod</div>
                <div style={{ fontSize: 11, color: T.textDim }}>Oylamada kelimeler gizlenir</div>
              </div>
              <div style={{ width: 44, height: 24, borderRadius: 999, position: 'relative', flexShrink: 0, background: room.settings.isHiddenMode ? T.primary : T.textDim, transition: 'background 0.2s' }}>
                <div style={{ position: 'absolute', top: 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.3)', transition: 'left 0.2s', left: room.settings.isHiddenMode ? 23 : 3 }} />
              </div>
            </button>

            {/* Online (Public) mode toggle */}
            <button
              onClick={() => currentPlayer.isHost && onSetPublic(!room.isPublic)}
              disabled={!currentPlayer.isHost}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '13px 16px', borderRadius: 14, fontFamily: 'inherit', textAlign: 'left', cursor: currentPlayer.isHost ? 'pointer' : 'not-allowed',
                border: `1.5px solid ${room.isPublic ? 'rgba(52,211,153,0.4)' : T.borderSub}`,
                background: room.isPublic ? `rgba(52,211,153,0.08)` : T.surface2,
                opacity: !currentPlayer.isHost ? 0.6 : 1, marginBottom: 20, transition: 'all 0.2s',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: room.isPublic ? T.green : T.textMuted }}>
                {room.isPublic ? 'public' : 'lock'}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 1 }}>Online Mod</div>
                <div style={{ fontSize: 11, color: T.textDim }}>Açıkken kod olmadan herkes katılabilir</div>
              </div>
              <div style={{ width: 44, height: 24, borderRadius: 999, position: 'relative', flexShrink: 0, background: room.isPublic ? T.green : T.textDim, transition: 'background 0.2s' }}>
                <div style={{ position: 'absolute', top: 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.3)', transition: 'left 0.2s', left: room.isPublic ? 23 : 3 }} />
              </div>
            </button>

            {/* Categories */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.textDim, margin: 0 }}>Kategoriler</p>
              <span style={{ fontSize: 12, fontWeight: 700, color: T.primary }}>{activeCategories.length}/{CATEGORIES.length}</span>
            </div>
            <div className="wr-cat-grid" style={{ maxHeight: 380, overflowY: 'auto', scrollbarWidth: 'none', padding: '4px 2px' }}>
              {CATEGORIES.map(cat => {
                const active = activeCategories.includes(cat);
                const icons: Record<string, string> = {
                  'İsim': 'person', 'Şehir': 'location_city', 'Hayvan': 'pets', 'Bitki': 'potted_plant',
                  'Eşya': 'inventory_2', 'Ünlü': 'star', 'Ülke': 'public', 'Meslek': 'work',
                  'Yemek': 'restaurant', 'Dizi/Film': 'movie'
                };
                const icon = icons[cat] || 'category';
                
                return (
                  <div 
                    key={cat} 
                    className={`wr-cat${active ? ' on' : ''}`} 
                    onClick={() => currentPlayer.isHost && toggleCategory(cat)}
                    style={{ 
                      cursor: currentPlayer.isHost ? 'pointer' : 'default',
                      borderColor: active ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.15)',
                      background: active ? 'rgba(52,211,153,0.04)' : 'rgba(248,113,113,0.03)'
                    }}
                  >
                    <span 
                      className="material-symbols-outlined" 
                      style={{ 
                        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                        fontSize: 38, zIndex: 0, opacity: 0.12,
                        color: active ? T.green : T.red,
                        pointerEvents: 'none'
                      }}
                    >
                      {icon}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: active ? T.text : T.textMuted, zIndex: 1, position: 'relative' }}>
                      {cat}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* ═══ CENTER: Players + Actions ═══ */}
          <motion.div className="wr-mid" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Player cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(152px, 1fr))', gap: 14 }}>
              <AnimatePresence>
                {room.players.map((player, i) => {
                  const isMe = player.id === currentPlayer.id;
                  const isReady = isMe || !!player.isReady;
                  return (
                    <motion.div
                      key={player.id}
                      className={`wr-pcard${isMe ? ' me' : ''}`}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ delay: i * 0.04, type: 'spring', stiffness: 280, damping: 22 }}
                    >
                      {/* Kick */}
                      {currentPlayer.isHost && !isMe && (
                        <motion.button
                          onClick={() => onKick(player.id)}
                          whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                          title="Oyuncuyu at"
                          style={{ position: 'absolute', top: 10, left: 10, width: 26, height: 26, borderRadius: 8, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: T.red, cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >✕</motion.button>
                      )}

                      {/* Card Indicators (Corners) */}
                      {isReady && (
                        <div style={{
                          position: 'absolute', top: 12, right: 12, width: 8, height: 8,
                          borderRadius: '50%', background: T.green,
                          boxShadow: `0 0 10px ${T.green}`
                        }} />
                      )}

                      {player.isHost && (
                        <span className="material-symbols-outlined" style={{ 
                          position: 'absolute', top: 12, left: 12, fontSize: 20, 
                          color: T.amber, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' 
                        }}>crown</span>
                      )}

                      {/* Avatar */}
                      <div style={{
                        width: 72, height: 72, marginTop: 4,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44,
                      }}>{player.avatar}</div>

                      {/* Name */}
                      <div style={{ textAlign: 'center', width: '100%' }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: isMe ? T.primaryLight : T.text, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>
                          {player.name}{isMe ? ' (Sen)' : ''}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Empty slots */}
              {[...Array(Math.max(0, 16 - room.players.length))].map((_, i) => (
                <div key={'e' + i} style={{ background: T.surface2, border: `1.5px dashed ${T.borderSub}`, borderRadius: 16, padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, opacity: 0.3 }}>
                  <div style={{ width: 72, height: 72, borderRadius: 20, border: `1.5px dashed ${T.borderSub}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: T.textDim }}>?</div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.textDim, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Bekleniyor</span>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto' }}>
              {currentPlayer.isHost ? (
                <motion.button
                  onClick={onStart}
                  disabled={room.players.length < 1}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  style={{
                    width: '100%', padding: '18px', borderRadius: 16, border: 'none',
                    background: `linear-gradient(135deg,${T.primary},${T.primaryDark})`,
                    color: '#fff', fontSize: 17, fontWeight: 900, fontFamily: 'inherit',
                    cursor: room.players.length < 1 ? 'not-allowed' : 'pointer',
                    boxShadow: `0 8px 32px rgba(139,92,246,0.45)`,
                    opacity: room.players.length < 1 ? 0.5 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  }}
                >
                  <span>▶</span> Oyunu Başlat
                </motion.button>
              ) : (
                <div style={{ width: '100%', padding: '18px', borderRadius: 16, background: T.surface2, border: `1px solid ${T.borderSub}`, textAlign: 'center', fontSize: 14, fontWeight: 700, color: T.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <motion.div style={{ width: 8, height: 8, borderRadius: '50%', background: T.primary }} animate={{ opacity: [1, 0.25, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
                  Yönetici oyunu başlatacak
                </div>
              )}

            </div>
          </motion.div>

          {/* ═══ RIGHT: Activity + Summary ═══ */}
          <motion.div className="wr-panel wr-right" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ display: 'flex', flexDirection: 'column' }}>

            {/* Activity feed */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, paddingBottom: 16, borderBottom: `1px solid ${T.borderSub}` }}>
              <span className="material-symbols-outlined" style={{ fontSize: 22, color: T.primaryLight }}>forum</span>
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>Aktivite</h3>
            </div>
            <div ref={logRef} style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 200, maxHeight: 280, scrollbarWidth: 'none' }}>
              <AnimatePresence initial={false}>
                {log.map(entry => (
                  <motion.div key={entry.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} style={{ padding: '4px 0 4px 4px' }}>
                    <p style={{ fontSize: 11, fontWeight: 800, margin: '0 0 2px', color: entry.color, letterSpacing: '0.02em' }}>{entry.player}</p>
                    <p style={{ fontSize: 13, color: T.text, margin: 0, opacity: 0.95 }}>{entry.msg}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Settings summary */}
            <div style={{ marginTop: 'auto', paddingTop: 22, borderTop: `1px solid ${T.borderSub}` }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: T.textDim, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 16px' }}>Ayar Özeti</p>
              {[
                { label: 'Tur Sayısı', val: `${room.settings.totalRounds} tur`, icon: 'repeat' },
                { label: 'Tur Süresi', val: `${room.settings.roundDuration}s`, icon: 'timer' },
                { label: 'Kategoriler', val: `${activeCategories.length}/${CATEGORIES.length}`, icon: 'category' },
                { 
                  label: 'Gizli Mod', 
                  val: room.settings.isHiddenMode ? 'Açık' : 'Kapalı', 
                  icon: room.settings.isHiddenMode ? 'visibility_off' : 'visibility',
                  active: room.settings.isHiddenMode
                },
              ].map(({ label, val, icon, active }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: T.textDim }}>{icon}</span>
                    <span style={{ fontSize: 13, color: T.textMuted }}>{label}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: active ? T.primaryLight : T.text }}>{val}</span>
                </div>
              ))}
            </div>


          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default WaitingRoom;
