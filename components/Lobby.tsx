import React, { useState } from 'react';
import { User, Play, Dices, ArrowRight } from 'lucide-react';
import { Button, Input, Card } from './UI';
import { AVATARS, DEFAULT_SETTINGS } from '../constants';
import { gameService } from '../services/gameService';
import { Player, Room } from '../types';

interface LobbyProps {
  onJoin: (room: Room, player: Player) => void;
}

const Lobby: React.FC<LobbyProps> = ({ onJoin }) => {
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name) return;
    setLoading(true);
    try {
      const { room, player } = await gameService.createRoom(name, avatar, DEFAULT_SETTINGS);
      onJoin(room, player);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!name || !roomCode) return;
    setLoading(true);
    try {
      const { room, player } = await gameService.joinRoom(roomCode, name, avatar);
      onJoin(room, player);
    } catch (e) {
      alert("Odaya katılamadı. Kod hatalı olabilir.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl w-full mx-auto animate-fade-in flex flex-col justify-center min-h-[80vh] py-4 md:py-0">
      {/* Header Logo Area */}
      <div className="text-center mb-6 md:mb-8 space-y-1 md:space-y-2">
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-purple-400 to-pink-400 drop-shadow-2xl">
          HARFBAZ
        </h1>
        <p className="text-slate-400 text-sm md:text-lg font-medium tracking-wide uppercase">Online Kelime Yarışı</p>
      </div>

      <Card className="!p-0 overflow-hidden border-0 shadow-2xl shadow-brand-900/40 bg-slate-900/80 backdrop-blur-xl flex flex-col md:flex-row min-h-auto md:min-h-[500px]">
        
        {/* LEFT SIDE: Avatar Selection */}
        <div className="w-full md:w-5/12 bg-slate-800/50 p-5 md:p-8 flex flex-col border-b md:border-b-0 md:border-r border-white/5 order-2 md:order-1">
          <div className="mb-4 md:mb-6 flex items-center justify-between md:block">
            <div>
                <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                <Dices className="text-brand-400" size={20} />
                <span className="hidden md:inline">Karakterini Seç</span>
                <span className="md:hidden">Avatar</span>
                </h3>
                <p className="text-xs md:text-sm text-slate-400 mt-1 hidden md:block">Seni temsil edecek bir avatar belirle.</p>
            </div>
            {/* Mobile Selection Preview */}
            <div className="md:hidden inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/50 border border-white/5 text-slate-400 text-xs">
                Seçilen: <span className="text-xl">{avatar}</span>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center">
            <div className="grid grid-cols-4 gap-2 md:gap-3 w-full">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  onClick={() => setAvatar(a)}
                  className={`
                    aspect-square rounded-xl text-2xl md:text-3xl flex items-center justify-center transition-all duration-300 relative group
                    ${avatar === a 
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30 scale-105 z-10 ring-2 ring-brand-400 ring-offset-2 ring-offset-slate-900' 
                      : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:scale-105 hover:text-slate-200'
                    }
                  `}
                >
                  <span className="transform transition-transform duration-300 group-hover:rotate-12 block">{a}</span>
                  {avatar === a && (
                    <span className="absolute -top-1.5 -right-1.5 md:-top-2 md:-right-2 bg-green-500 w-3 h-3 md:w-4 md:h-4 rounded-full border-2 border-slate-900 flex items-center justify-center">
                       <span className="w-1 h-1 md:w-1.5 md:h-1 bg-white rounded-full"></span>
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mt-6 text-center hidden md:block">
             <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/50 border border-white/5 text-slate-400 text-sm">
                Seçilen: <span className="text-2xl">{avatar}</span>
             </div>
          </div>
        </div>

        {/* RIGHT SIDE: Form & Actions */}
        <div className="w-full md:w-7/12 p-6 md:p-12 flex flex-col justify-center relative bg-gradient-to-br from-slate-900/50 to-brand-900/10 order-1 md:order-2">
          
          {/* Tabs */}
          <div className="flex p-1 bg-slate-950/50 rounded-xl mb-6 md:mb-8 w-full max-w-sm mx-auto border border-white/5">
            <button
              onClick={() => setActiveTab('create')}
              className={`flex-1 py-2 text-xs md:text-sm font-bold rounded-lg transition-all duration-300 ${activeTab === 'create' ? 'bg-brand-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Oda Kur
            </button>
            <button
              onClick={() => setActiveTab('join')}
              className={`flex-1 py-2 text-xs md:text-sm font-bold rounded-lg transition-all duration-300 ${activeTab === 'join' ? 'bg-brand-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Odaya Katıl
            </button>
          </div>

          <div className="space-y-4 md:space-y-6 max-w-sm mx-auto w-full">
            <div className="space-y-3 md:space-y-4">
              <Input 
                label="Kullanıcı Adın" 
                placeholder="Örn: KelimeAvcısı" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                icon={<User size={18} />}
                className="!py-3 md:!py-4 text-base md:text-lg bg-slate-950/50 border-slate-800 focus:border-brand-500/50"
              />

              <div className={`transition-all duration-300 overflow-hidden ${activeTab === 'join' ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
                <Input 
                  label="Oda Kodu" 
                  placeholder="KOD GİR" 
                  value={roomCode} 
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="!py-3 md:!py-4 text-base md:text-lg tracking-[0.2em] font-mono uppercase text-center bg-slate-950/50 border-slate-800 focus:border-brand-500/50"
                />
              </div>
            </div>

            <div className="pt-2 md:pt-4">
              <Button 
                className="w-full !py-3 md:!py-5 text-base md:text-lg shadow-xl shadow-brand-900/20 hover:shadow-brand-600/40 group relative overflow-hidden" 
                onClick={activeTab === 'create' ? handleCreate : handleJoin}
                disabled={loading || !name || (activeTab === 'join' && !roomCode)}
              >
                <div className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? 'Yükleniyor...' : (activeTab === 'create' ? 'Macerayı Başlat' : 'Oyuna Dahil Ol')}
                  {!loading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
                </div>
                {/* Button Shine Effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent z-0"></div>
              </Button>
            </div>
            
            <p className="text-center text-[10px] md:text-xs text-slate-500 mt-2 md:mt-4">
              {activeTab === 'create' 
                ? 'Kendi kurallarını koy, arkadaşlarını davet et.' 
                : 'Arkadaşının verdiği kodu gir ve hemen başla.'}
            </p>
          </div>
        </div>
      </Card>
      
      <div className="text-center mt-6 text-[10px] md:text-xs text-slate-600 font-mono opacity-50">
        v1.1.0 • Harfbaz
      </div>
    </div>
  );
};

export default Lobby;