import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, Users, Play, Crown, Clock, Hash, Settings, Check, LogOut, Eye, EyeOff, UserMinus } from 'lucide-react';
import { Button } from './UI';
import { Room, Player, RoomSettings } from '../types';

interface WaitingRoomProps {
  room: Room;
  currentPlayer: Player;
  onStart: () => void;
  onUpdateSettings: (settings: RoomSettings) => void;
  onLeave: () => void;
  onKick: (playerId: string) => void;
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
    if (/^\d*$/.test(value)) setter(value);
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
    <div className="h-screen w-screen fixed inset-0 bg-[#0a0a1a] overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-[#0a0a1a] to-pink-900/20" />
        <motion.div
          className="absolute top-0 right-0 w-1/2 h-1/2"
          style={{ background: 'radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.12) 0%, transparent 50%)' }}
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-1/2 h-1/2"
          style={{ background: 'radial-gradient(circle at 20% 80%, rgba(236, 72, 153, 0.12) 0%, transparent 50%)' }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Leave Button */}
      <motion.button
        onClick={onLeave}
        className="fixed top-6 right-6 z-50 flex items-center gap-2 text-slate-500 hover:text-red-400 transition-all text-sm font-medium px-4 py-2 rounded-xl bg-white/5 hover:bg-red-500/10 border border-white/5"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <LogOut size={16} /> Çık
      </motion.button>

      {/* Main Layout - Vertical on mobile, horizontal on desktop */}
      <div className="relative z-10 h-full flex flex-col lg:flex-row overflow-auto">

        {/* Left Panel - Room Info & Settings */}
        <motion.div
          className="w-full lg:w-[400px] xl:w-[450px] flex-shrink-0 lg:h-full flex flex-col p-4 lg:p-8 lg:border-r border-white/5"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
        >

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-black text-white mb-1">Bekleme Odası</h1>
            <p className="text-slate-500 text-sm">Oyuncular toplanıyor...</p>
          </div>

          {/* Room Code Card */}
          <div className="relative mb-6">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-2xl blur-sm" />
            <div className="relative bg-[#12121f] rounded-2xl p-5 border border-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1">
                    {copied ? '✓ Kopyalandı!' : 'Oda Kodu'}
                  </div>
                  <motion.button
                    onClick={copyCode}
                    className="flex items-center gap-3"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="text-4xl font-black font-mono tracking-wider text-white">{room.code}</span>
                    {copied ? (
                      <Check size={20} className="text-green-400" />
                    ) : (
                      <Copy size={18} className="text-slate-500 hover:text-white transition-colors" />
                    )}
                  </motion.button>
                </div>

                {currentPlayer.isHost && (
                  <Button
                    onClick={onStart}
                    disabled={room.players.length < 1}
                    className="px-6 py-3"
                    icon={<Play size={18} className="fill-current" />}
                  >
                    Başlat
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="flex-1 overflow-auto">
            <div className="bg-[#12121f]/50 rounded-2xl p-5 border border-white/5">
              <div className="flex items-center gap-2 mb-5 pb-4 border-b border-white/5">
                <Settings className="text-purple-400" size={18} />
                <h3 className="font-bold text-white">Oyun Ayarları</h3>
                {!currentPlayer.isHost && (
                  <span className="text-[10px] bg-white/10 text-slate-400 px-2 py-0.5 rounded ml-auto">Görüntüleme</span>
                )}
              </div>

              <div className="space-y-5">
                {/* Duration */}
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock size={14} className="text-purple-400" /> Tur Süresi
                    </div>
                    <span className="font-bold text-purple-300">{room.settings.roundDuration}sn</span>
                  </div>
                  {currentPlayer.isHost && (
                    <div className="flex gap-2">
                      {DURATION_OPTIONS.map(sec => (
                        <motion.button
                          key={sec}
                          onClick={() => handlePresetChange('roundDuration', sec)}
                          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${room.settings.roundDuration === sec
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25'
                            : 'bg-white/5 text-slate-500 hover:bg-white/10 hover:text-white'
                            }`}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          {sec}
                        </motion.button>
                      ))}
                      <input
                        type="text"
                        value={localDuration}
                        onChange={(e) => handleInputChange(setLocalDuration, e.target.value)}
                        onBlur={(e) => handleBlur('roundDuration', e.target.value)}
                        className="w-14 text-center rounded-lg text-sm font-bold bg-white/5 border border-white/10 focus:border-purple-500/50 outline-none text-white"
                      />
                    </div>
                  )}
                </div>

                {/* Rounds */}
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Hash size={14} className="text-purple-400" /> Tur Sayısı
                    </div>
                    <span className="font-bold text-purple-300">{room.settings.totalRounds}</span>
                  </div>
                  {currentPlayer.isHost && (
                    <div className="flex gap-2">
                      {ROUND_OPTIONS.map(count => (
                        <motion.button
                          key={count}
                          onClick={() => handlePresetChange('totalRounds', count)}
                          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${room.settings.totalRounds === count
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25'
                            : 'bg-white/5 text-slate-500 hover:bg-white/10 hover:text-white'
                            }`}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          {count}
                        </motion.button>
                      ))}
                      <input
                        type="text"
                        value={localRounds}
                        onChange={(e) => handleInputChange(setLocalRounds, e.target.value)}
                        onBlur={(e) => handleBlur('totalRounds', e.target.value)}
                        className="w-14 text-center rounded-lg text-sm font-bold bg-white/5 border border-white/10 focus:border-purple-500/50 outline-none text-white"
                      />
                    </div>
                  )}
                </div>

                {/* Hidden Mode */}
                <motion.button
                  onClick={toggleHiddenMode}
                  disabled={!currentPlayer.isHost}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${room.settings.isHiddenMode
                    ? 'bg-purple-500/10 border-purple-500/30'
                    : 'bg-white/5 border-white/5'
                    } ${!currentPlayer.isHost ? 'cursor-default' : 'hover:bg-white/10'}`}
                  whileHover={currentPlayer.isHost ? { scale: 1.01 } : {}}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${room.settings.isHiddenMode ? 'bg-purple-500 text-white' : 'bg-white/10 text-slate-400'}`}>
                      {room.settings.isHiddenMode ? <EyeOff size={16} /> : <Eye size={16} />}
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-bold text-white">Gizli Kelime</div>
                      <div className="text-xs text-slate-500">Oylamada kelimeler gizli</div>
                    </div>
                  </div>

                  <div className={`w-12 h-6 rounded-full relative transition-colors ${room.settings.isHiddenMode ? 'bg-purple-500' : 'bg-slate-700'}`}>
                    <motion.div
                      className="absolute top-1 w-4 h-4 rounded-full bg-white"
                      animate={{ left: room.settings.isHiddenMode ? '1.5rem' : '0.25rem' }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </div>
                </motion.button>
              </div>
            </div>
          </div>

          {/* Non-host waiting message */}
          {!currentPlayer.isHost && (
            <motion.div
              className="mt-4 p-4 rounded-xl bg-white/5 text-center"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <p className="text-slate-400 text-sm">Yönetici oyunu başlatacak...</p>
            </motion.div>
          )}
        </motion.div>

        {/* Right Panel - Players */}
        <motion.div
          className="flex flex-1 flex-col p-4 lg:p-8 min-h-[300px] lg:min-h-0"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >

          <div className="flex items-center gap-3 mb-6">
            <Users className="text-purple-400" size={24} />
            <h2 className="text-2xl font-bold text-white">Oyuncular</h2>
            <span className="text-sm bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full font-medium">
              {room.players.length}
            </span>
          </div>

          <div className="flex-1 overflow-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4 p-2">
              {room.players.map((player, index) => (
                <motion.div
                  key={player.id}
                  className={`relative bg-[#12121f]/80 rounded-2xl p-5 flex flex-col items-center justify-center gap-3 group border border-white/5 transition-all
                    ${player.id === currentPlayer.id ? 'ring-2 ring-purple-500' : 'hover:bg-white/5'}
                  `}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03 }}
                >
                  {/* Avatar */}
                  <motion.div
                    className="relative"
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 3, repeat: Infinity, delay: index * 0.2 }}
                  >
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center text-3xl">
                      {player.avatar}
                    </div>
                    {player.isHost && (
                      <motion.div
                        className="absolute -top-2 -right-2 bg-yellow-500 text-yellow-900 p-1.5 rounded-full"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      >
                        <Crown size={12} fill="currentColor" />
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Kick Button */}
                  {currentPlayer.isHost && player.id !== currentPlayer.id && (
                    <motion.button
                      onClick={() => onKick(player.id)}
                      className="absolute top-2 right-2 p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                      whileTap={{ scale: 0.9 }}
                    >
                      <UserMinus size={14} />
                    </motion.button>
                  )}

                  {/* Name */}
                  <div className="text-center">
                    <div className="font-bold text-white text-sm truncate max-w-[90px]">{player.name}</div>
                    {player.id === currentPlayer.id && (
                      <span className="text-[10px] bg-purple-500 px-2 py-0.5 rounded text-white mt-1 inline-block">
                        SEN
                      </span>
                    )}
                  </div>

                  {/* Online indicator */}
                  <motion.span
                    className="absolute bottom-3 right-3 w-2 h-2 rounded-full bg-green-500"
                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.div>
              ))}

              {/* Empty Slots */}
              {[...Array(Math.max(0, 12 - room.players.length))].map((_, i) => (
                <motion.div
                  key={`empty-${i}`}
                  className="border border-dashed border-white/10 bg-white/[0.02] rounded-2xl flex flex-col items-center justify-center p-5 text-slate-700"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                >
                  <Users size={18} className="mb-1 opacity-30" />
                  <span className="text-[10px] font-medium opacity-50">Boş</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default WaitingRoom;