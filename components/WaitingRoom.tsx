import React, { useState } from 'react';
import { Copy, Users, Play, Crown, Clock, Hash, Settings, Check, LogOut } from 'lucide-react'; // LogOut eklendi
import { Button, Card, Badge } from './UI';
import { Room, Player, RoomSettings } from '../types';

interface WaitingRoomProps {
  room: Room;
  currentPlayer: Player;
  onStart: () => void;
  onUpdateSettings: (settings: RoomSettings) => void;
  onLeave: () => void; // Yeni prop
}

const WaitingRoom: React.FC<WaitingRoomProps> = ({ room, currentPlayer, onStart, onUpdateSettings, onLeave }) => {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSettingChange = (key: keyof RoomSettings, value: number) => {
    if (!currentPlayer.isHost) return;
    let finalValue = value;
    if (key === 'totalRounds') {
      if (value > 28) finalValue = 28;
      if (value < 1) finalValue = 1;
    }
    if (key === 'roundDuration') {
      if (value < 10) finalValue = 10;
      if (value > 300) finalValue = 300;
    }
    onUpdateSettings({ ...room.settings, [key]: finalValue });
  };

  const DURATION_OPTIONS = [30, 60, 90];
  const ROUND_OPTIONS = [5, 10, 15];

  return (
    <div className="max-w-7xl w-full mx-auto animate-fade-in pb-12 relative">
      
      {/* ÇIKIŞ BUTONU (Sağ Üst) */}
      <button 
        onClick={onLeave}
        className="absolute top-0 right-0 flex items-center gap-2 text-slate-500 hover:text-red-400 transition-colors text-sm font-bold bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50 hover:border-red-500/30"
      >
        <LogOut size={16} /> Odadan Çık
      </button>

      {/* Header */}
      <div className="text-center mb-8 space-y-2 mt-4">
        <h2 className="text-4xl font-black text-white tracking-tight">Bekleme Salonu</h2>
        <p className="text-slate-400 font-medium">Takım toplanıyor, stratejini belirle.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT PANEL: Room Info & Settings */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-slate-900/50 border-brand-500/20 shadow-xl shadow-brand-900/10 overflow-hidden relative group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-400 to-purple-500"></div>
            <div className="text-center space-y-4 py-4">
              <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">
                {copied ? 'KOPYALANDI!' : 'ODA KODU'}
              </span>
              <div 
                onClick={copyCode}
                className={`
                  mx-auto w-full max-w-[240px] border-2 border-dashed rounded-xl py-4 flex items-center justify-center gap-3 cursor-pointer transition-all duration-300
                  ${copied 
                    ? 'bg-green-500/10 border-green-500 text-green-400' 
                    : 'bg-slate-950 border-slate-700 hover:border-brand-500 hover:bg-slate-900 text-white'
                  }
                `}
              >
                <span className="text-4xl font-black tracking-widest font-mono">{room.code}</span>
                {copied ? <Check size={20} /> : <Copy size={20} className="text-slate-500" />}
              </div>
              <p className="text-xs text-slate-500">
                {copied ? 'Kod panoya kopyalandı.' : 'Arkadaşlarınla paylaşmak için koda tıkla.'}
              </p>
            </div>
          </Card>

          <Card className="bg-slate-800/40 border-slate-700/50">
            <div className="flex items-center gap-2 mb-6 text-white border-b border-white/5 pb-4">
              <Settings className="text-brand-400" size={20} />
              <h3 className="font-bold text-lg">Oyun Ayarları</h3>
              {!currentPlayer.isHost && <Badge color="bg-slate-700 text-slate-400 ml-auto">Görüntüleme</Badge>}
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                   <div className="flex items-center gap-2 text-slate-300"><Clock size={16} /> Tur Süresi (sn)</div>
                   <span className="font-bold text-brand-300">{room.settings.roundDuration} sn</span>
                </div>
                {currentPlayer.isHost ? (
                  <div className="flex gap-2">
                    {DURATION_OPTIONS.map(sec => (
                      <button key={sec} onClick={() => handleSettingChange('roundDuration', sec)} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${room.settings.roundDuration === sec ? 'bg-brand-600 text-white' : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'}`}>{sec}</button>
                    ))}
                    <div className="relative flex-1 min-w-[70px]">
                      <input type="number" min="10" max="300" placeholder="Özel" value={DURATION_OPTIONS.includes(room.settings.roundDuration) ? '' : room.settings.roundDuration} onChange={(e) => handleSettingChange('roundDuration', parseInt(e.target.value) || 0)} className={`w-full h-full text-center rounded-lg text-sm font-bold bg-slate-900/50 border border-slate-700 text-white ${!DURATION_OPTIONS.includes(room.settings.roundDuration) ? 'border-brand-500' : ''}`} />
                    </div>
                  </div>
                ) : <div className="w-full bg-slate-900/50 h-2 rounded-full overflow-hidden"><div className="bg-slate-700 h-full w-full opacity-50"></div></div>}
              </div>

              <div className="space-y-3">
                 <div className="flex items-center justify-between text-sm">
                   <div className="flex items-center gap-2 text-slate-300"><Hash size={16} /> Tur Sayısı (Max: 28)</div>
                   <span className="font-bold text-brand-300">{room.settings.totalRounds} Tur</span>
                </div>
                {currentPlayer.isHost ? (
                  <div className="flex gap-2">
                    {ROUND_OPTIONS.map(count => (
                      <button key={count} onClick={() => handleSettingChange('totalRounds', count)} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${room.settings.totalRounds === count ? 'bg-brand-600 text-white' : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'}`}>{count}</button>
                    ))}
                    <div className="relative flex-1 min-w-[70px]">
                      <input type="number" min="1" max="28" placeholder="Özel" value={ROUND_OPTIONS.includes(room.settings.totalRounds) ? '' : room.settings.totalRounds} onChange={(e) => handleSettingChange('totalRounds', parseInt(e.target.value) || 0)} className={`w-full h-full text-center rounded-lg text-sm font-bold bg-slate-900/50 border border-slate-700 text-white ${!ROUND_OPTIONS.includes(room.settings.totalRounds) ? 'border-brand-500' : ''}`} />
                    </div>
                  </div>
                ) : <div className="w-full bg-slate-900/50 h-2 rounded-full overflow-hidden"><div className="bg-slate-700 h-full w-full opacity-50"></div></div>}
              </div>
            </div>
          </Card>

          <div className="pt-2">
            {currentPlayer.isHost ? (
              <Button onClick={onStart} disabled={room.players.length < 1} className="w-full !py-4 text-lg shadow-xl shadow-brand-600/20 relative overflow-hidden group">
                <div className="relative z-10 flex items-center justify-center gap-2"><Play size={20} className="fill-current" /> Oyunu Başlat</div>
                <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent z-0"></div>
              </Button>
            ) : (
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center animate-pulse">
                <p className="text-slate-400 text-sm italic">Oyun kurucunun başlatması bekleniyor...</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-8">
           <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2"><Users className="text-brand-400" /> Oyuncular <span className="text-slate-500 text-sm bg-slate-800 px-2 py-0.5 rounded-full ml-2">{room.players.length}</span></h3>
           </div>
           <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {room.players.map((player) => (
                <div key={player.id} className={`relative bg-slate-800/40 backdrop-blur-sm border rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all group hover:bg-slate-800/80 min-h-[140px] ${player.id === currentPlayer.id ? 'border-brand-500/50 shadow-lg shadow-brand-900/20' : 'border-slate-700/50'}`}>
                   <div className="relative">
                      <div className="w-16 h-16 rounded-xl bg-slate-700 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform duration-300">{player.avatar}</div>
                      {player.isHost && <div className="absolute -top-2 -right-2 bg-yellow-500 text-yellow-900 p-1 rounded-full shadow-lg border border-slate-800"><Crown size={12} fill="currentColor" /></div>}
                   </div>
                   <div className="text-center w-full min-w-0 mt-1">
                      <div className="font-bold text-white text-sm truncate px-1">{player.name}</div>
                      {player.id === currentPlayer.id && <div className="text-[10px] bg-brand-600/80 px-2 py-0.5 rounded text-white inline-block mt-1">SEN</div>}
                   </div>
                   <div className="absolute bottom-3 right-3"><span className="block w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span></div>
                </div>
              ))}
              {[...Array(Math.max(0, 12 - room.players.length))].map((_, i) => (
                <div key={`empty-${i}`} className="border border-dashed border-slate-800 bg-slate-900/20 rounded-xl flex flex-col items-center justify-center p-3 text-slate-700 min-h-[140px]"><Users size={24} className="mb-2 opacity-20" /><span className="text-xs font-bold opacity-40">Boş Koltuk</span></div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default WaitingRoom;