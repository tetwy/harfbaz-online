import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Play, ArrowRight, Shuffle, Zap, Sparkles } from 'lucide-react';
import { Button, Input } from './UI';
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

    const handleRandomAvatar = () => {
        const randomIndex = Math.floor(Math.random() * AVATARS.length);
        setAvatar(AVATARS[randomIndex]);
    };

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
        <div className="h-screen w-screen fixed inset-0 bg-[#0a0a1a] overflow-hidden">

            {/* Animated gradient background */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-[#0a0a1a] to-pink-900/30" />
                <motion.div
                    className="absolute top-0 left-0 w-full h-full"
                    style={{
                        background: 'radial-gradient(circle at 20% 20%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)',
                    }}
                    animate={{ opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 5, repeat: Infinity }}
                />
                <motion.div
                    className="absolute bottom-0 right-0 w-full h-full"
                    style={{
                        background: 'radial-gradient(circle at 80% 80%, rgba(236, 72, 153, 0.15) 0%, transparent 50%)',
                    }}
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 7, repeat: Infinity }}
                />

                {/* Grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                        backgroundSize: '50px 50px'
                    }}
                />
            </div>

            {/* Main Content - Two Column Layout */}
            <div className="relative z-10 h-full flex">

                {/* Left Side - Hero */}
                <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative">

                    {/* Floating orbs */}
                    <motion.div
                        className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-purple-500/20 blur-3xl"
                        animate={{ y: [0, -20, 0], scale: [1, 1.1, 1] }}
                        transition={{ duration: 6, repeat: Infinity }}
                    />
                    <motion.div
                        className="absolute bottom-1/3 right-1/4 w-40 h-40 rounded-full bg-pink-500/20 blur-3xl"
                        animate={{ y: [0, 20, 0], scale: [1.1, 1, 1.1] }}
                        transition={{ duration: 8, repeat: Infinity }}
                    />

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center relative"
                    >
                        {/* Logo */}
                        <motion.div
                            className="relative inline-block mb-8"
                            animate={{ y: [0, -5, 0] }}
                            transition={{ duration: 3, repeat: Infinity }}
                        >
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 blur-3xl opacity-30"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 4, repeat: Infinity }}
                            />
                            <h1 className="relative text-7xl xl:text-8xl font-black tracking-tight">
                                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                                    HARFBAZ
                                </span>
                            </h1>
                        </motion.div>

                        <p className="text-xl text-slate-400 mb-8 max-w-md">
                            Arkadaşlarınla yarış, kelime ustası ol!
                        </p>

                        {/* Features */}
                        <div className="flex gap-6 justify-center text-sm text-slate-500">
                            <div className="flex items-center gap-2">
                                <Sparkles size={16} className="text-purple-400" />
                                <span>Ücretsiz</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <User size={16} className="text-pink-400" />
                                <span>2+ Oyuncu</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Zap size={16} className="text-orange-400" />
                                <span>Hızlı Oyun</span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Right Side - Form */}
                <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 lg:p-12">

                    {/* Mobile Logo */}
                    <motion.div
                        className="lg:hidden text-center mb-8"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h1 className="text-5xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                            HARFBAZ
                        </h1>
                    </motion.div>

                    <motion.div
                        className="w-full max-w-md"
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >

                        {/* Card */}
                        <div className="relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-orange-500/20 rounded-3xl blur-xl" />

                            <div className="relative bg-[#12121f]/90 backdrop-blur-xl rounded-3xl p-6 lg:p-8 border border-white/5">

                                {/* Avatar Selection */}
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-medium text-slate-400">Karakterini Seç</span>
                                        <motion.button
                                            onClick={handleRandomAvatar}
                                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                                            whileHover={{ rotate: 180 }}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            <Shuffle size={14} />
                                        </motion.button>
                                    </div>

                                    <div className="grid grid-cols-8 gap-2">
                                        {AVATARS.map((a) => (
                                            <motion.button
                                                key={a}
                                                onClick={() => setAvatar(a)}
                                                className={`aspect-square rounded-xl text-xl flex items-center justify-center transition-all
                          ${avatar === a
                                                        ? 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30 ring-2 ring-purple-400/50'
                                                        : 'bg-white/5 hover:bg-white/10'
                                                    }`}
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                {a}
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                {/* Tabs */}
                                <div className="flex p-1 bg-white/5 rounded-xl mb-6">
                                    {[
                                        { key: 'create', label: 'Oda Kur', icon: Zap },
                                        { key: 'join', label: 'Odaya Katıl', icon: Play }
                                    ].map(({ key, label, icon: Icon }) => (
                                        <motion.button
                                            key={key}
                                            onClick={() => setActiveTab(key as 'create' | 'join')}
                                            className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all relative
                        ${activeTab === key ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            {activeTab === key && (
                                                <motion.div
                                                    className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg"
                                                    layoutId="activeTab"
                                                />
                                            )}
                                            <span className="relative z-10 flex items-center justify-center gap-2">
                                                <Icon size={16} /> {label}
                                            </span>
                                        </motion.button>
                                    ))}
                                </div>

                                {/* Form Fields */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-2">Kullanıcı Adın</label>
                                        <div className="relative flex items-center">
                                            <User size={18} className="absolute left-4 text-slate-500" />
                                            <input
                                                type="text"
                                                placeholder="Örn: KelimeUstası"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <AnimatePresence mode="wait">
                                        {activeTab === 'join' && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <label className="block text-xs font-medium text-slate-400 mb-2">Oda Kodu</label>
                                                <input
                                                    type="text"
                                                    placeholder="ABCD"
                                                    value={roomCode}
                                                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-center text-2xl font-mono tracking-[0.5em] uppercase placeholder-slate-600 focus:outline-none focus:border-purple-500/50 transition-all"
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <motion.button
                                        onClick={activeTab === 'create' ? handleCreate : handleJoin}
                                        disabled={loading || !name || (activeTab === 'join' && !roomCode)}
                                        className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/25"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        {loading ? (
                                            <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                                                Bağlanıyor...
                                            </motion.span>
                                        ) : (
                                            <>
                                                {activeTab === 'create' ? 'Oyunu Başlat' : 'Odaya Katıl'}
                                                <ArrowRight size={20} />
                                            </>
                                        )}
                                    </motion.button>
                                </div>

                                {/* Hint text */}
                                <p className="text-center text-xs text-slate-600 mt-4">
                                    {activeTab === 'create' ? '🎯 Kendi odanı kur, arkadaşlarını davet et' : '🔗 Arkadaşının paylaştığı kodu gir'}
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="text-center mt-6 text-xs text-slate-600">
                            <span className="font-mono">v2.0</span> • Made with 💜
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default Lobby;
