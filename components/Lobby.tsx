import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AVATARS, CATEGORIES, DEFAULT_SETTINGS } from '../constants';
import { gameService } from '../services/gameService';
import { Player, Room } from '../types';

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

const CATEGORY_ICONS: Record<string, string> = {
  'İsim': 'person', 'Şehir': 'location_city', 'Hayvan': 'pets', 'Bitki': 'eco',
  'Eşya': 'inventory_2', 'Ünlü': 'person_celebrate', 'Ülke': 'public', 'Meslek': 'work',
  'Yemek': 'restaurant', 'Dizi/Film': 'movie',
};

interface LobbyProps {
  onJoin: (room: Room, player: Player) => void;
}

const RANDOM_NAMES = [
  'KelimeUstası', 'HarfAvcısı', 'SözSihirbazı', 'DilMaestro', 'HızlıKalem',
  'KelimeFırtınası', 'SözBilgini', 'AlfabeKralı', 'DilUstadı', 'HarfBeyni',
  'SözYağmuru', 'KelimeBomba', 'DilŞampiyonu', 'HarfMaster', 'SözAteşi',
];

const Lobby: React.FC<LobbyProps> = ({ onJoin }) => {
  const [activeTab, setActiveTab] = useState<'create' | 'quick' | 'join'>('create');
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [onlineCount, setOnlineCount] = useState(0);
  const [roomCount, setRoomCount] = useState(0);

  useEffect(() => {
    gameService.getLobbyStats()
      .then(({ roomCount: r, playerCount: p }) => {
        setRoomCount(r);
        setOnlineCount(p);
      })
      .catch(() => {});
  }, []);

  const handleRandomAvatar = () => {
    setAvatar(AVATARS[Math.floor(Math.random() * AVATARS.length)]);
    if (!name.trim()) {
      setName(RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)]);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true); setError('');
    try {
      const { room, player } = await gameService.createRoom(name.trim(), avatar, DEFAULT_SETTINGS);
      onJoin(room, player);
    } catch (e) {
      setError('Oda oluşturulamadı. Lütfen tekrar dene.'); console.error(e);
    } finally { setLoading(false); }
  };

  const handleJoin = async () => {
    if (!name.trim() || !roomCode.trim()) return;
    setLoading(true); setError('');
    try {
      const { room, player } = await gameService.joinRoom(roomCode.trim(), name.trim(), avatar);
      onJoin(room, player);
    } catch {
      setError('Odaya katılamadı. Kod hatalı olabilir.');
    } finally { setLoading(false); }
  };

  const handleQuickJoin = async () => {
    if (!name.trim()) return;
    setLoading(true); setError('');
    try {
      const { room, player } = await gameService.joinRandomRoom(name.trim(), avatar);
      onJoin(room, player);
    } catch (e: any) {
      setError(e?.message || 'Aktif online oda yok. Kendin bir oda kurabilirsin.');
    } finally { setLoading(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter') return;
    if (activeTab === 'create') handleCreate();
    else if (activeTab === 'quick') handleQuickJoin();
    else handleJoin();
  };

  const css = `
    @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    @keyframes pulse-glow{0%,100%{opacity:0.5}50%{opacity:1}}
    .lby-grid{display:grid;grid-template-columns:420px 1fr;min-height:calc(100vh - 72px)}
    .lby-sidebar{position:sticky;top:72px;height:calc(100vh - 72px);overflow-y:auto;padding:32px 28px;background:${T.surface};border-right:1px solid ${T.border};scrollbar-width:none;display:flex;flex-direction:column}
    .lby-sidebar::-webkit-scrollbar{display:none}
    .lby-content{padding:52px 56px 32px;overflow-y:auto}
    .how-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
    .feat-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
    .cat-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}
    .av-btn{width:44px;height:44px;border-radius:12px;border:2px solid transparent;background:${T.surface2};font-size:22px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.15s}
    .av-btn:hover{transform:scale(1.12)}
    .av-btn.sel{border-color:${T.primary};background:rgba(139,92,246,0.2);box-shadow:0 0 12px rgba(139,92,246,0.3)}
    .tab-pill{flex:1;padding:12px;border-radius:12px;border:none;cursor:pointer;font-weight:700;font-family:inherit;font-size:14px;transition:all 0.2s;display:inline-flex;align-items:center;justify-content:center;gap:6px}
    .tab-pill .material-symbols-outlined{font-size:18px}
    .tab-pill.on{background:${T.primary};color:#fff;box-shadow:0 4px 20px rgba(139,92,246,0.4)}
    .tab-pill.off{background:transparent;color:${T.textMuted}}
    .tab-pill.off:hover{background:${T.surface2};color:${T.text}}
    .inp{width:100%;box-sizing:border-box;padding:14px 18px;border-radius:14px;border:1.5px solid ${T.borderSub};background:${T.surface2};font-size:15px;font-weight:600;color:${T.text};outline:none;font-family:inherit;transition:all 0.2s}
    .inp::placeholder{color:${T.textDim}}
    .inp:focus{border-color:${T.primary};background:${T.surface3};box-shadow:0 0 0 3px rgba(139,92,246,0.15)}
    .sbtn{width:100%;padding:16px;border-radius:16px;border:none;font-size:16px;font-weight:800;font-family:inherit;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;justify-content:center;gap:8px}
    .sbtn.c-on{background:linear-gradient(135deg,${T.primary},${T.primaryDark});color:#fff;box-shadow:0 8px 28px rgba(139,92,246,0.45)}
    .sbtn.c-on:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(139,92,246,0.55)}
    .sbtn.j-on{background:linear-gradient(135deg,${T.cyan},#0891b2);color:#fff;box-shadow:0 8px 28px rgba(34,211,238,0.35)}
    .sbtn.j-on:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(34,211,238,0.45)}
    .sbtn.off{background:${T.surface3};color:${T.textDim};cursor:not-allowed}
    .stat-pill{display:inline-flex;align-items:center;gap:8px;padding:7px 16px;border-radius:999px;font-size:12px;font-weight:700}
    .sdot{width:7px;height:7px;border-radius:50%;animation:pulse-glow 2s ease-in-out infinite}
    .card-hover{transition:transform 0.2s,box-shadow 0.2s}
    .card-hover:hover{transform:translateY(-4px)}
    .nav-link:hover{background:rgba(255,255,255,0.08) !important;color:${T.text} !important;border-color:rgba(255,255,255,0.1) !important}
    @media(max-width:960px){
      .lby-grid{grid-template-columns:1fr}
      .lby-sidebar{position:relative;top:0;height:auto;border-right:none;border-bottom:1px solid ${T.border}}
      .lby-content{padding:32px}
      .how-grid{grid-template-columns:1fr}
      .feat-grid{grid-template-columns:1fr 1fr}
      .cat-grid{grid-template-columns:repeat(2,1fr)}
      .nav-stats{display:none !important}
    }
    @media(max-width:560px){.feat-grid{grid-template-columns:1fr}.cat-grid{grid-template-columns:repeat(2,1fr)}}
  `;

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif", background: T.bg, minHeight: '100vh', color: T.text }}>
      <style>{css}</style>

      {/* ── Navbar ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, height: 72, display: 'flex', alignItems: 'center', padding: '0 32px', background: 'rgba(7,9,15,0.7)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: `1px solid ${T.borderSub}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/logo.png" alt="Logo" style={{ width: 40, height: 40, objectFit: 'contain' }} />
          <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.05em', color: T.text }}>Harf<span style={{ color: T.primary }}>ma</span>z</span>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="nav-stats" style={{ display: 'flex', alignItems: 'center', gap: 10, paddingRight: 16, borderRight: `1px solid ${T.borderSub}` }}>
            <div className="stat-pill" style={{ background: 'rgba(52,211,153,0.08)', color: T.green, border: '1px solid rgba(52,211,153,0.15)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>sensors</span>
              {onlineCount}
            </div>
            <div className="stat-pill" style={{ background: 'rgba(139,92,246,0.08)', color: T.primaryLight, border: '1px solid rgba(139,92,246,0.15)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>sports_esports</span>
              {roomCount}
            </div>
          </div>

          <a href="https://discord.gg/Ta4jQWpfGk" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.borderSub}`, color: T.textMuted, fontSize: 13, fontWeight: 700, textDecoration: 'none', transition: 'all 0.2s' }} className="nav-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.946 2.419-2.157 2.419z" />
            </svg>
            Discord
          </a>
        </div>
      </nav>

      {/* ── Two-column layout ── */}
      <div className="lby-grid">

        {/* ── SIDEBAR: Sticky form ── */}
        <div className="lby-sidebar">

          {/* Profile header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ margin: 0, fontSize: 13, fontWeight: 900, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Profilini Oluştur</h2>
            <button onClick={handleRandomAvatar} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 999, background: 'rgba(139,92,246,0.1)', border: `1px solid ${T.border}`, fontSize: 12, fontWeight: 700, color: T.primaryLight, cursor: 'pointer' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>casino</span>
              Rastgele
            </button>
          </div>

          {/* Avatar + Name row */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 18 }}>
            <motion.div
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              style={{ width: 80, height: 80, borderRadius: 24, flexShrink: 0, background: `linear-gradient(135deg,rgba(139,92,246,0.25),rgba(34,211,238,0.12))`, border: `2.5px solid ${T.primary}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, boxShadow: `0 0 32px rgba(139,92,246,0.2)` }}
            >
              {avatar}
            </motion.div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: T.textDim, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>Kullanıcı Adın</label>
              <input className="inp" type="text" placeholder="Örn: KelimeUstası" value={name} onChange={e => setName(e.target.value)} onKeyDown={handleKeyDown} maxLength={20} />
            </div>
          </div>

          {/* Avatar grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))', gap: 8, padding: 14, borderRadius: 18, background: T.surface2, border: `1px solid ${T.borderSub}`, marginBottom: 24 }}>
            {AVATARS.map(a => (
              <button key={a} className={`av-btn${avatar === a ? ' sel' : ''}`} onClick={() => setAvatar(a)}>{a}</button>
            ))}
          </div>

          <div style={{ height: 1, background: T.border, marginBottom: 22 }} />

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 6, background: T.surface2, borderRadius: 16, padding: 6, marginBottom: 20 }}>
            <button className={`tab-pill ${activeTab === 'create' ? 'on' : 'off'}`} onClick={() => setActiveTab('create')}>✦ Kur</button>
            <button className={`tab-pill ${activeTab === 'quick' ? 'on' : 'off'}`} onClick={() => setActiveTab('quick')}>
              <span className="material-symbols-outlined">bolt</span>
              Hızlı
            </button>
            <button className={`tab-pill ${activeTab === 'join' ? 'on' : 'off'}`} onClick={() => setActiveTab('join')}>
              <span className="material-symbols-outlined">login</span>
              Katıl
            </button>
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            {activeTab === 'create' && (
              <motion.div key="c" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.18 }}>
                <p style={{ fontSize: 13, color: T.textMuted, lineHeight: '20px', marginBottom: 20 }}>
                  Özel lobini oluştur ve arkadaşlarını davet et. Online modu açarsan diğer oyuncular da katılabilir!
                </p>
                <button className={`sbtn ${name.trim() ? 'c-on' : 'off'}`} onClick={handleCreate} disabled={loading || !name.trim()}>
                  {loading ? <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block', fontSize: 20 }}>⟳</span> : '✦ Oda Oluştur'}
                </button>
              </motion.div>
            )}
            {activeTab === 'quick' && (
              <motion.div key="q" initial={{ opacity: 0, x: 0 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 0 }} transition={{ duration: 0.18 }}>
                <p style={{ fontSize: 13, color: T.textMuted, lineHeight: '20px', marginBottom: 20 }}>
                  Arkadaşın yok mu? Sorun değil! Kod gerekmez — rastgele bir online odaya seni hemen alalım.
                </p>
                <button
                  className={`sbtn ${name.trim() ? 'c-on' : 'off'}`}
                  onClick={handleQuickJoin}
                  disabled={loading || !name.trim()}
                  style={name.trim() ? { background: `linear-gradient(135deg,${T.green},#059669)`, boxShadow: '0 8px 28px rgba(52,211,153,0.4)' } : undefined}
                >
                  {loading ? (
                    <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block', fontSize: 20 }}>⟳</span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined" style={{ fontSize: 22 }}>bolt</span>
                      Online Oyna
                    </>
                  )}
                </button>
              </motion.div>
            )}
            {activeTab === 'join' && (
              <motion.div key="j" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.18 }}>
                <p style={{ fontSize: 13, color: T.textMuted, lineHeight: '20px', marginBottom: 16 }}>
                  Arkadaşının paylaştığı oda kodunu girerek yarışa katıl!
                </p>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: T.textDim, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>Oda Kodu</label>
                  <input
                    className="inp"
                    type="text"
                    placeholder="ABCDEF"
                    value={roomCode}
                    onChange={e => setRoomCode(e.target.value.toUpperCase())}
                    onKeyDown={handleKeyDown}
                    maxLength={6}
                    style={{ letterSpacing: '0.3em', textAlign: 'center', fontSize: 22, fontWeight: 800, color: T.cyan }}
                  />
                </div>
                <button className={`sbtn ${name.trim() && roomCode.trim() ? 'j-on' : 'off'}`} onClick={handleJoin} disabled={loading || !name.trim() || !roomCode.trim()}>
                  {loading ? <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block', fontSize: 20 }}>⟳</span> : '→ Oyuna Katıl'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} style={{ marginTop: 14, padding: '12px 16px', borderRadius: 12, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: T.red, fontSize: 13, fontWeight: 600 }}>
                ⚠ {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick pills */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 'auto', paddingTop: 32, borderTop: `1px solid ${T.borderSub}` }}>
            {[
              { icon: 'payments', label: 'Ücretsiz' },
              { icon: 'bolt', label: 'Anlık' },
              { icon: 'groups', label: '2+ Oyuncu' }
            ].map(({ icon, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, background: T.surface2, border: `1px solid ${T.borderSub}`, fontSize: 11, fontWeight: 700, color: T.textMuted }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{icon}</span>
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: Scrollable landing ── */}
        <div className="lby-content">

          {/* Hero */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} style={{ marginBottom: 56 }}>

            <h1 style={{ fontSize: 'clamp(52px,7vw,96px)', fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 0.95, marginBottom: 20 }}>
              {'HARF'.split('').map((l, i) => (
                <motion.span key={i} style={{ color: T.text, display: 'inline-block' }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}>{l}</motion.span>
              ))}
              {'MA'.split('').map((l, i) => (
                <motion.span key={'m' + i} style={{ color: T.primary, display: 'inline-block' }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * (4 + i) }}>{l}</motion.span>
              ))}
              {'Z'.split('').map((l, i) => (
                <motion.span key={'z' + i} style={{ color: T.text, display: 'inline-block' }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * (6 + i) }}>{l}</motion.span>
              ))}
            </h1>
            <p style={{ fontSize: 17, color: T.textMuted, lineHeight: '28px', maxWidth: 520, marginBottom: 32 }}>
              Arkadaşlarınla gerçek zamanlı Türkçe kelime yarışına gir. Verilen harfle kategorileri doldur, en hızlı ve doğru olanı kazan!
            </p>
            {/* Stats row */}
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              {[
                { label: 'Toplam Oyun', val: '1,200+', color: T.primary },
                { label: 'Aktif Oyuncu', val: `${onlineCount}`, color: T.green },
                { label: 'Açık Oda', val: `${roomCount}`, color: T.cyan },
                { label: 'Kategori', val: '10', color: T.amber },
              ].map(({ label, val, color }) => (
                <div key={label} style={{ padding: '14px 20px', borderRadius: 16, background: T.surface, border: `1px solid ${T.borderSub}`, minWidth: 100 }}>
                  <div style={{ fontSize: 26, fontWeight: 900, color, letterSpacing: '-0.04em' }}>{val}</div>
                  <div style={{ fontSize: 12, color: T.textDim, fontWeight: 600, marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
          </motion.div>



          {/* How to play */}
          <div style={{ marginBottom: 56 }}>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: T.text, margin: '0 0 4px', letterSpacing: '-0.03em' }}>Nasıl Oynanır?</h2>
              <p style={{ fontSize: 14, color: T.textMuted, margin: 0 }}>3 adımda öğren, hemen başla</p>
            </div>
            <div className="how-grid">
              {[
                { n: '01', title: 'Oda Kur ya da Katıl', desc: 'Özel oda oluştur ya da paylaşılan kodu girerek katıl. İstediğin kadar oyuncu davet et!', icon: 'home_app_logo', color: T.primary },
                { n: '02', title: 'Harf Çekilir, Süre Başlar', desc: 'Rastgele bir Türk harfi belirlenir. Zamanlayıcı başlar, tüm kategorileri doldur!', icon: 'timer', color: T.amber },
                { n: '03', title: 'Oylama & Puan', desc: 'Tur biter, oyuncular geçersiz cevaplara veto verir. En yüksek puan kazanır!', icon: 'emoji_events', color: T.green },
              ].map(({ n, title, desc, icon, color }) => (
                <motion.div key={n} className="card-hover" style={{ padding: 24, borderRadius: 20, background: T.surface, border: `1px solid ${T.borderSub}`, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ position: 'absolute', top: 12, right: 12, fontSize: 80, opacity: 0.05, fontWeight: 900, color, lineHeight: 1 }}>{n}</div>
                  <span className="material-symbols-outlined" style={{ fontSize: 38, marginBottom: 14, color, display: 'block' }}>{icon}</span>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: T.text, margin: '0 0 8px' }}>{title}</h3>
                  <p style={{ fontSize: 13, color: T.textMuted, lineHeight: '20px', margin: 0 }}>{desc}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 'auto', paddingTop: 16 }}>
                    <div style={{ height: 3, width: 28, borderRadius: 99, background: color }} />
                    <span style={{ fontSize: 11, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Adım {n}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div style={{ marginBottom: 56 }}>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: T.text, margin: '0 0 4px', letterSpacing: '-0.03em' }}>Kategoriler</h2>
              <p style={{ fontSize: 14, color: T.textMuted, margin: 0 }}>10 farklı kategori, sonsuz kelime</p>
            </div>
            <div className="cat-grid">
              {CATEGORIES.map(cat => (
                <motion.div key={cat} whileHover={{ scale: 1.05, y: -2 }} style={{ padding: '18px 12px', borderRadius: 18, background: T.surface, border: `1px solid ${T.borderSub}`, textAlign: 'center', cursor: 'default' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 32, marginBottom: 10, color: T.primaryLight, display: 'block' }}>{CATEGORY_ICONS[cat]}</span>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{cat}</div>
                </motion.div>
              ))}
            </div>
          </div>



          {/* Footer */}
          <div style={{ paddingTop: 24, borderTop: `1px solid ${T.borderSub}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.04em' }}>
              Harf<span style={{ color: T.primary }}>ma</span>z
            </div>
            <span style={{ fontSize: 13, color: T.textDim }}>© 2026 tetwy. Tüm Hakları Saklıdır.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
