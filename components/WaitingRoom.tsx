import React, { useState, useEffect } from 'react';
import { Copy, Users, Play, Crown, Clock, Hash, Settings, Check, LogOut, Eye, EyeOff, UserMinus } from 'lucide-react';
import { Button, Card, Badge } from './UI';
import { Room, Player, RoomSettings } from '../types';

interface WaitingRoomProps {
  room: Room;
  currentPlayer: Player;
  onStart: () => void;
  onUpdateSettings: (settings: RoomSettings) => void;
  onLeave: () => void;
  onKick: (playerId: string) => void; // <-- YENİ PROP
}

const WaitingRoom: React.FC<WaitingRoomProps> = ({ room, currentPlayer, onStart, onUpdateSettings, onLeave, onKick }) => {
  const [copied, setCopied] = useState(false);
  
  const [localDuration, setLocalDuration] = useState<string>(room.settings.roundDuration.toString());
  const [localRounds, setLocalRounds] = useState<string>(room.settings.totalRounds.toString());

  useEffect(() => {
    setLocalDuration(room.settings.roundDuration.toString());
    setLocalRounds(room.settings.totalRounds.toString());
  }, [room.settings.roundDuration, room.settings.totalRounds]);

  const copyCode = () => {
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePresetChange = (key: keyof RoomSettings, value: number) => {
    if (!currentPlayer.isHost) return;
    onUpdateSettings({ ...room.settings, [key]: value });
  };

  const toggleHiddenMode = () => {
    if (!currentPlayer.isHost) return;
    onUpdateSettings({ ...room.settings, isHiddenMode: !room.settings.isHiddenMode });
  };

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
    if (!currentPlayer.isHost) return;
    if (/^\d*$/.test(value)) {
      setter(value);
    }
  };

  const handleBlur = (key: keyof RoomSettings, valueStr: string) => {
    if (!currentPlayer.isHost) return;
    
    let value = parseInt(valueStr) || 0;
    
    if (key === 'roundDuration') {
      if (value < 10) value = 10;
      if (value > 300) value = 300;
    } else if (key === 'totalRounds') {
      if (value < 1) value = 1;
      if (value > 28) value = 28;
    }

    onUpdateSettings({ ...room.settings, [key]: value });
    
    if (key === 'roundDuration') setLocalDuration(value.toString());
    if (key === 'totalRounds') setLocalRounds(value.toString());
  };

  const DURATION_OPTIONS = [30, 60, 90];
  const ROUND_OPTIONS = [5, 10, 15];

  return (
    <div className="max-w-7xl w-full mx-auto animate-fade-in pb-12 relative px-4 md:px-0">
      
      {/* ÇIKIŞ BUTONU */}
      <button 
        onClick={onLeave}
        className="hidden md:flex absolute top-0 right-0 items-center gap-2 text-slate-500 hover:text-red-400 transition-colors text-sm font-bold bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50 hover:border-red-500/30"
      >
        <LogOut size={16} /> Odadan Çık
      </button>

      {/* Header */}
      <div className="text-center mb-6 md:mb-8 space-y-1 md:space-y-2 mt-8 md:mt-4">
        <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">Bekleme Salonu</h2>
        <p className="text-xs md:text-base text-slate-400 font-medium">Takım toplanıyor, stratejini belirle.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
        
        {/* LEFT PANEL: Room Info & Settings */}
        <div className="lg:col-span-4 space-y-4 md:space-y-6">
          
          {/* --- ODA KODU KARTI (SADECE HOST İÇİN) --- */}
          {currentPlayer.isHost ? (
            <Card className="bg-slate-900/50 border-brand-500/20 shadow-xl shadow-brand-900/10 overflow-hidden relative group">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-400 to-purple-500"></div>
                <div className="text-center space-y-3 md:space-y-4 py-2 md:py-4">
                <span className="text-[10px] md:text-xs font-bold text-slate-400 tracking-widest uppercase">
                    {copied ? 'KOPYALANDI!' : 'ODA KODU'}
                </span>

                {/* MOBİL GÖRÜNÜM: Çıkış - Kod - Kopyala */}
                <div className="flex md:hidden items-center justify-between gap-2 px-1">
                    <button
                    onClick={onLeave}
                    className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 active:scale-95 transition-all shadow-lg shadow-red-900/10"
                    title="Odadan Çık"
                    >
                    <LogOut size={20} />
                    </button>

                    <div className="flex-1 h-12 flex items-center justify-center bg-slate-950 border-2 border-dashed border-slate-700 rounded-xl overflow-hidden">
                        <span className="text-3xl font-black tracking-widest font-mono text-white pt-1">{room.code}</span>
                    </div>

                    <button
                    onClick={copyCode}
                    className={`
                        w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl border active:scale-95 transition-all
                        ${copied 
                        ? 'bg-green-500/10 border-green-500 text-green-500' 
                        : 'bg-brand-600 text-white border-brand-500 shadow-lg shadow-brand-500/20'
                        }
                    `}
                    title="Kodu Kopyala"
                    >
                    {copied ? <Check size={20} /> : <Copy size={20} />}
                    </button>
                </div>

                {/* MASAÜSTÜ GÖRÜNÜM: Klasik Büyük Kutu */}
                <div 
                    onClick={copyCode}
                    className={`
                    hidden md:flex mx-auto w-full max-w-[240px] border-2 border-dashed rounded-xl py-4 items-center justify-center gap-3 cursor-pointer transition-all duration-300
                    ${copied 
                        ? 'bg-green-500/10 border-green-500 text-green-400' 
                        : 'bg-slate-950 border-slate-700 hover:border-brand-500 hover:bg-slate-900 text-white'
                    }
                    `}
                >
                    <span className="text-4xl font-black tracking-widest font-mono">{room.code}</span>
                    {copied ? <Check size={20} /> : <Copy size={20} className="text-slate-500" />}
                </div>

                <p className="text-[10px] md:text-xs text-slate-500">
                    {copied ? 'Kod panoya kopyalandı.' : 'Arkadaşlarınla paylaşmak için koda tıkla.'}
                </p>
                </div>
            </Card>
          ) : (
            <Card className="bg-slate-900/50 border-slate-700/50 shadow-xl overflow-hidden relative">
                <div className="text-center py-6">
                   <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-800 mb-3">
                      <Users className="text-brand-400" size={24} />
                   </div>
                   <h3 className="text-white font-bold text-lg">Hazır Bekle</h3>
                   <p className="text-slate-500 text-sm mt-1 px-4">Yönetici oyunu başlattığında ekranın otomatik değişecek.</p>
                </div>
            </Card>
          )}

          {/* OYUN AYARLARI KARTI */}
          <Card className="bg-slate-800/40 border-slate-700/50">
            <div className="flex items-center gap-2 mb-4 md:mb-6 text-white border-b border-white/5 pb-3 md:pb-4">
              <Settings className="text-brand-400" size={18} />
              <h3 className="font-bold text-base md:text-lg">Oyun Ayarları</h3>
              {!currentPlayer.isHost && <Badge color="bg-slate-700 text-slate-400 ml-auto text-[10px]">Görüntüleme</Badge>}
            </div>

            <div className="space-y-4 md:space-y-6">
              {/* Duration Setting */}
              <div className="space-y-2 md:space-y-3">
                <div className="flex items-center justify-between text-xs md:text-sm">
                   <div className="flex items-center gap-2 text-slate-300">
                     <Clock size={14} /> Tur Süresi (sn)
                   </div>
                   <span className="font-bold text-brand-300">{room.settings.roundDuration} sn</span>
                </div>
                
                {currentPlayer.isHost ? (
                  <div className="flex gap-2">
                    {DURATION_OPTIONS.map(sec => (
                      <button
                        key={sec}
                        onClick={() => handlePresetChange('roundDuration', sec)}
                        className={`flex-1 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-bold transition-all ${
                          room.settings.roundDuration === sec 
                          ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/50 ring-2 ring-brand-400/50' 
                          : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        {sec}
                      </button>
                    ))}
                    <div className="relative flex-1 min-w-[60px] md:min-w-[70px]">
                      <input 
                        type="text"
                        placeholder="Özel"
                        value={localDuration}
                        onChange={(e) => handleInputChange(setLocalDuration, e.target.value)}
                        onBlur={(e) => handleBlur('roundDuration', e.target.value)}
                        className={`w-full h-full text-center rounded-lg text-xs md:text-sm font-bold bg-slate-900/50 border border-slate-700 focus:border-brand-500 outline-none text-white placeholder-slate-600 transition-all ${
                          !DURATION_OPTIONS.includes(room.settings.roundDuration) ? 'border-brand-500 ring-2 ring-brand-400/20' : ''
                        }`}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="w-full bg-slate-900/50 h-2 rounded-full overflow-hidden">
                    <div className="bg-slate-700 h-full w-full opacity-50"></div>
                  </div>
                )}
              </div>

              {/* Rounds Count Setting */}
              <div className="space-y-2 md:space-y-3">
                 <div className="flex items-center justify-between text-xs md:text-sm">
                   <div className="flex items-center gap-2 text-slate-300">
                     <Hash size={14} /> Tur Sayısı (Max: 28)
                   </div>
                   <span className="font-bold text-brand-300">{room.settings.totalRounds} Tur</span>
                </div>

                {currentPlayer.isHost ? (
                  <div className="flex gap-2">
                    {ROUND_OPTIONS.map(count => (
                      <button
                        key={count}
                        onClick={() => handlePresetChange('totalRounds', count)}
                        className={`flex-1 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-bold transition-all ${
                          room.settings.totalRounds === count 
                          ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/50 ring-2 ring-brand-400/50' 
                          : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                    <div className="relative flex-1 min-w-[60px] md:min-w-[70px]">
                      <input 
                        type="text"
                        placeholder="Özel"
                        value={localRounds}
                        onChange={(e) => handleInputChange(setLocalRounds, e.target.value)}
                        onBlur={(e) => handleBlur('totalRounds', e.target.value)}
                        className={`w-full h-full text-center rounded-lg text-xs md:text-sm font-bold bg-slate-900/50 border border-slate-700 focus:border-brand-500 outline-none text-white placeholder-slate-600 transition-all ${
                          !ROUND_OPTIONS.includes(room.settings.totalRounds) ? 'border-brand-500 ring-2 ring-brand-400/20' : ''
                        }`}
                      />
                    </div>
                  </div>
                ) : (
                   <div className="w-full bg-slate-900/50 h-2 rounded-full overflow-hidden">
                    <div className="bg-slate-700 h-full w-full opacity-50"></div>
                  </div>
                )}
              </div>

              {/* YENİ: Gizli Kelime Modu */}
              <div className="pt-2 border-t border-white/5">
                <button
                  onClick={toggleHiddenMode}
                  disabled={!currentPlayer.isHost}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                    room.settings.isHiddenMode 
                      ? 'bg-purple-500/10 border-purple-500/50 text-purple-200' 
                      : 'bg-slate-900/50 border-slate-700 text-slate-400'
                  } ${!currentPlayer.isHost ? 'cursor-default opacity-80' : 'hover:bg-slate-800'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${room.settings.isHiddenMode ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                      {room.settings.isHiddenMode ? <EyeOff size={18} /> : <Eye size={18} />}
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-bold text-white">Gizli Kelime</div>
                      <div className="text-[10px] text-slate-400">Oylamada kelimeler kapalı gelir</div>
                    </div>
                  </div>
                  
                  {/* Toggle Switch Görünümü */}
                  <div className={`w-10 h-5 rounded-full relative transition-colors ${room.settings.isHiddenMode ? 'bg-purple-500' : 'bg-slate-700'}`}>
                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${room.settings.isHiddenMode ? 'left-6' : 'left-1'}`}></div>
                  </div>
                </button>
              </div>

            </div>
          </Card>

          <div className="pt-2">
            {currentPlayer.isHost ? (
              <Button 
                onClick={onStart} 
                disabled={room.players.length < 1} 
                className="w-full !py-3 md:!py-4 text-base md:text-lg shadow-xl shadow-brand-600/20 relative overflow-hidden group"
              >
                <div className="relative z-10 flex items-center justify-center gap-2">
                  <Play size={18} className="fill-current" /> Oyunu Başlat
                </div>
                <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent z-0"></div>
              </Button>
            ) : (
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center animate-pulse">
                <p className="text-slate-400 text-xs md:text-sm italic">Oyun kurucunun başlatması bekleniyor...</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Player Grid */}
        <div className="lg:col-span-8">
           <div className="flex items-center justify-between mb-4 md:mb-6">
              <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                <Users className="text-brand-400" size={20} />
                Oyuncular <span className="text-slate-500 text-xs md:text-sm bg-slate-800 px-2 py-0.5 rounded-full ml-2">{room.players.length}</span>
              </h3>
           </div>

           <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {room.players.map((player) => (
                <div 
                  key={player.id} 
                  className={`
                    relative bg-slate-800/40 backdrop-blur-sm border rounded-xl p-2 md:p-3 flex flex-col items-center justify-center gap-2 transition-all group hover:bg-slate-800/80 min-h-[120px] md:min-h-[140px]
                    ${player.id === currentPlayer.id ? 'border-brand-500/50 shadow-lg shadow-brand-900/20' : 'border-slate-700/50'}
                  `}
                >
                   {/* Avatar */}
                   <div className="relative">
                      <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl bg-slate-700 flex items-center justify-center text-2xl md:text-3xl shadow-inner group-hover:scale-110 transition-transform duration-300">
                        {player.avatar}
                      </div>
                      {player.isHost && (
                        <div className="absolute -top-1.5 -right-1.5 md:-top-2 md:-right-2 bg-yellow-500 text-yellow-900 p-0.5 md:p-1 rounded-full shadow-lg border border-slate-800">
                           <Crown size={10} className="md:w-3 md:h-3" fill="currentColor" />
                        </div>
                      )}
                   </div>

                   {/* YENİ: KICK BUTONU (Sadece Host, Başkaları İçin Görür) */}
                   {currentPlayer.isHost && player.id !== currentPlayer.id && (
                        <button
                            onClick={() => onKick(player.id)}
                            className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                            title="Oyuncuyu At"
                        >
                            <UserMinus size={14} />
                        </button>
                   )}

                   {/* Info */}
                   <div className="text-center w-full min-w-0 mt-1">
                      <div className="font-bold text-white text-xs md:text-sm truncate px-1">
                        {player.name}
                      </div>
                      {player.id === currentPlayer.id && (
                        <div className="text-[9px] md:text-[10px] bg-brand-600/80 px-1.5 py-0.5 rounded text-white inline-block mt-1">SEN</div>
                      )}
                   </div>

                   {/* Status Dot */}
                   <div className="absolute bottom-2 right-2 md:bottom-3 md:right-3">
                      <span className="block w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                   </div>
                </div>
              ))}

              {[...Array(Math.max(0, 12 - room.players.length))].map((_, i) => (
                <div key={`empty-${i}`} className="border border-dashed border-slate-800 bg-slate-900/20 rounded-xl flex flex-col items-center justify-center p-3 text-slate-700 min-h-[120px] md:min-h-[140px]">
                  <Users size={20} className="mb-2 opacity-20 md:w-6 md:h-6" />
                  <span className="text-[10px] md:text-xs font-bold opacity-40">Boş Koltuk</span>
                </div>
              ))}
           </div>
        </div>

      </div>
    </div>
  );
};

export default WaitingRoom;