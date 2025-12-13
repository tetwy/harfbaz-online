import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, RotateCcw, Home, Loader2, LogOut, Crown, Medal, Star } from 'lucide-react';
import { Button, Card } from './UI';
import { Player } from '../types';

interface ScoreboardProps {
  players: Player[];
  onNextRound: () => void;
  isGameOver: boolean;
  roundNumber: number;
  isHost: boolean;
  onLeave: () => void;
}

const Scoreboard: React.FC<ScoreboardProps> = ({ players, onNextRound, isGameOver, roundNumber, isHost, onLeave }) => {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];
  const top3 = sortedPlayers.slice(0, 3);

  // Memoize star positions to prevent re-calculation on every render
  const starPositions = useMemo(() =>
    [...Array(20)].map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
    })),
    []);

  return (
    <div className="h-screen w-screen fixed inset-0 bg-[#0a0a1a] overflow-hidden flex flex-col">

      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-[#0a0a1a] to-yellow-900/20" />
        <motion.div
          className="absolute top-10 left-1/4 w-80 h-80 bg-yellow-500/15 rounded-full blur-3xl"
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 5, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 right-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 7, repeat: Infinity }}
        />

        {/* Floating Stars for Game Over */}
        {isGameOver && (
          <>
            {starPositions.map((pos, i) => (
              <motion.div
                key={i}
                className="absolute text-yellow-400"
                style={pos}
                initial={{ opacity: 0, scale: 0, rotate: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  rotate: 360,
                  y: [0, -100]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeOut"
                }}
              >
                <Star size={12} fill="currentColor" />
              </motion.div>
            ))}
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 pb-24">
        <motion.div
          className="max-w-md w-full relative z-10"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
        >

          {/* Header */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.h2
              className={`text-4xl md:text-5xl font-black mb-2 ${isGameOver ? 'text-gradient-gold' : 'text-white'}`}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {isGameOver ? 'OYUN BİTTİ!' : 'SKOR TABLOSU'}
            </motion.h2>
            <p className="text-slate-400">Puan durumu güncellendi</p>
          </motion.div>

          {/* Winner Display (Game Over only) */}
          {isGameOver && (
            <motion.div
              className="text-center mb-10 relative"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
            >
              <motion.div
                className="absolute inset-0 bg-yellow-500/30 blur-3xl rounded-full"
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />

              <motion.div
                animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Trophy size={80} className="text-yellow-400 mx-auto mb-4 drop-shadow-2xl relative z-10" />
              </motion.div>

              <motion.div
                className="text-2xl font-bold text-slate-300 relative z-10 mb-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Kazanan
              </motion.div>

              <motion.div
                className="flex items-center justify-center gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <span className="text-5xl">{winner.avatar}</span>
                <div>
                  <div className="text-3xl md:text-4xl font-black text-gradient-gold">{winner.name}</div>
                  <div className="text-xl text-yellow-300 font-bold">{winner.score} Puan</div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Podium for Game Over */}
          {isGameOver && top3.length >= 3 && (
            <motion.div
              className="flex items-end justify-center gap-4 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              {/* 2nd Place */}
              <motion.div
                className="text-center"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1 }}
              >
                <div className="w-20 h-20 mx-auto mb-2 rounded-2xl bg-slate-400/20 flex items-center justify-center text-3xl">
                  {top3[1].avatar}
                </div>
                <div className="text-sm font-bold text-slate-400 truncate max-w-[80px]">{top3[1].name}</div>
                <div className="text-xs text-slate-500">{top3[1].score} puan</div>
                <div className="w-20 h-16 bg-gradient-to-t from-slate-500/30 to-slate-400/30 rounded-t-xl mt-2 flex items-center justify-center">
                  <Medal className="text-slate-400" size={24} />
                </div>
              </motion.div>

              {/* 1st Place */}
              <motion.div
                className="text-center"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.9 }}
              >
                <motion.div
                  className="w-24 h-24 mx-auto mb-2 rounded-2xl bg-yellow-500/20 flex items-center justify-center text-4xl ring-2 ring-yellow-500"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {top3[0].avatar}
                </motion.div>
                <div className="text-sm font-bold text-yellow-300 truncate max-w-[100px]">{top3[0].name}</div>
                <div className="text-xs text-yellow-400">{top3[0].score} puan</div>
                <div className="w-24 h-24 bg-gradient-to-t from-yellow-600/30 to-yellow-400/30 rounded-t-xl mt-2 flex items-center justify-center">
                  <Crown className="text-yellow-400" size={28} fill="currentColor" />
                </div>
              </motion.div>

              {/* 3rd Place */}
              <motion.div
                className="text-center"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.1 }}
              >
                <div className="w-20 h-20 mx-auto mb-2 rounded-2xl bg-amber-700/20 flex items-center justify-center text-3xl">
                  {top3[2].avatar}
                </div>
                <div className="text-sm font-bold text-amber-600 truncate max-w-[80px]">{top3[2].name}</div>
                <div className="text-xs text-amber-700">{top3[2].score} puan</div>
                <div className="w-20 h-12 bg-gradient-to-t from-amber-700/30 to-amber-600/30 rounded-t-xl mt-2 flex items-center justify-center">
                  <Medal className="text-amber-600" size={20} />
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Score List */}
          <motion.div
            className="space-y-3"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.1, delayChildren: isGameOver ? 1.2 : 0.2 } } }}
          >
            {sortedPlayers.map((player, index) => (
              <motion.div
                key={player.id}
                className={`
                bg-[#12121f]/80 rounded-xl p-4 flex items-center justify-between border border-white/5
                ${index === 0 ? 'border-yellow-500/30 bg-yellow-500/5' : ''}
                ${index === 1 ? 'border-slate-400/20' : ''}
                ${index === 2 ? 'border-amber-700/20' : ''}
              `}
                variants={{
                  hidden: { opacity: 0, x: -30 },
                  visible: { opacity: 1, x: 0 }
                }}
                whileHover={{ scale: 1.02, x: 5 }}
              >
                <div className="flex items-center gap-4">
                  <span className={`
                  text-lg font-mono font-bold w-8 text-center
                  ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-slate-400' : index === 2 ? 'text-amber-600' : 'text-slate-600'}
                `}>
                    #{index + 1}
                  </span>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-2xl">
                    {player.avatar}
                  </div>
                  <div className="font-bold text-white">{player.name}</div>
                </div>

                <motion.div
                  className="font-mono font-black text-2xl text-brand-400"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: index * 0.1 }}
                >
                  {player.score}
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Footer Actions */}
      <motion.div
        className="relative z-10 p-4 md:p-6 bg-gradient-to-t from-[#0a0a1a] to-transparent"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: isGameOver ? 1.5 : 0.5 }}
      >
        <div className="flex gap-3 max-w-md mx-auto items-stretch">
          <motion.button
            onClick={onLeave}
            className="flex-none w-14 h-14 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <LogOut size={20} />
          </motion.button>

          {isGameOver ? (
            <Button
              onClick={onNextRound}
              disabled={!isHost}
              className={`flex-1 py-4 text-lg ${!isHost ? 'opacity-60' : ''}`}
              icon={isHost ? <Home size={20} /> : <Loader2 className="animate-spin" size={20} />}
            >
              {isHost ? 'Lobiye Dön' : 'Bekleniyor...'}
            </Button>
          ) : (
            <Button
              onClick={onNextRound}
              disabled={!isHost}
              className={`flex-1 py-4 text-lg ${!isHost ? 'opacity-60' : ''}`}
              icon={isHost ? <RotateCcw size={20} /> : <Loader2 className="animate-spin" size={20} />}
            >
              {isHost ? 'Sonraki Tur' : 'Bekleniyor...'}
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Scoreboard;