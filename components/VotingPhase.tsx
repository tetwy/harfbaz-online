import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsDown, AlertCircle, ArrowRight, LogOut, Eye, EyeOff, Loader2, UserMinus } from 'lucide-react';
import { Button } from './UI';
import { CATEGORIES } from '../constants';
import { Player, RoundAnswers, Vote } from '../types';

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
}

const VotingPhase: React.FC<VotingPhaseProps> = ({
  players, answers, currentLetter, currentPlayerId,
  currentVotes, currentCategoryIndex, isHost, onNextCategory, onToggleVote, onLeave,
  isHiddenMode, revealedPlayers, onRevealCard,
  isLoading = false, roundStartTime
}) => {

  const category = CATEGORIES[currentCategoryIndex];

  const activePlayers = useMemo(() => {
    if (!roundStartTime) return players;
    const start = new Date(roundStartTime).getTime();
    return players.filter(p => new Date(p.joinedAt).getTime() <= start + 5000);
  }, [players, roundStartTime]);

  const amISpectator = !activePlayers.find(p => p.id === currentPlayerId);
  const totalActivePlayers = activePlayers.length;
  const isLastCategory = currentCategoryIndex === CATEGORIES.length - 1;

  const handleCardClick = (targetPlayerId: string, isEmpty: boolean) => {
    if (isEmpty || amISpectator) return;
    const isMe = targetPlayerId === currentPlayerId;
    const isRevealed = revealedPlayers.includes(targetPlayerId);

    if (isMe && isHiddenMode && !isRevealed) {
      onRevealCard(targetPlayerId);
      return;
    }
    if (!isMe) onToggleVote(targetPlayerId);
  };

  return (
    <div className="h-screen w-screen fixed inset-0 bg-[#0a0a1a] overflow-hidden flex flex-col safe-bottom">

      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-[#0a0a1a] to-orange-900/20" />
        <motion.div
          className="absolute top-0 left-0 w-1/2 h-1/2"
          style={{ background: 'radial-gradient(circle at 20% 20%, rgba(234, 179, 8, 0.1) 0%, transparent 50%)' }}
        />
      </div>

      {/* Leave Button */}
      <motion.button
        onClick={onLeave}
        className="fixed top-4 right-4 z-50 flex items-center gap-2 text-slate-500 hover:text-red-400 transition-all text-sm px-3 py-2 rounded-xl bg-white/5 hover:bg-red-500/10 safe-top safe-right"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <LogOut size={16} /> Çık
      </motion.button>

      {/* Header */}
      <div className="relative z-10 p-4 pt-14 md:pt-6 md:p-6">
        <div className="max-w-2xl mx-auto">

          {/* Spectator Warning */}
          <AnimatePresence>
            {amISpectator && (
              <motion.div
                className="bg-blue-500/10 text-blue-300 p-3 rounded-xl text-center text-sm border border-blue-500/30 mb-4"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <UserMinus className="inline-block mr-2 w-4 h-4" />
                Bu tura sonradan katıldın. Sadece izleyebilirsin.
              </motion.div>
            )}
          </AnimatePresence>

          {/* Category Header */}
          <div className="flex items-center justify-between gap-4">

            {/* Letter Badge */}
            <motion.div
              className="relative"
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
                <span className="text-2xl font-black text-white">{currentLetter}</span>
              </div>
            </motion.div>

            {/* Category Name */}
            <div className="flex-1">
              <AnimatePresence mode="wait">
                <motion.h2
                  key={category}
                  className="text-2xl md:text-3xl font-black text-white"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  {category}
                </motion.h2>
              </AnimatePresence>

              {/* Category Progress */}
              <div className="flex items-center gap-1 mt-2">
                {CATEGORIES.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1 rounded-full flex-1 transition-all ${idx < currentCategoryIndex ? 'bg-purple-500' :
                      idx === currentCategoryIndex ? 'bg-purple-400' : 'bg-white/10'
                      }`}
                  />
                ))}
              </div>
            </div>

            {/* Hidden Mode Badge */}
            {isHiddenMode && (
              <div className="flex items-center gap-1 text-xs text-purple-300 bg-purple-900/30 px-3 py-1.5 rounded-full">
                <EyeOff size={12} /> Gizli
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Player Cards */}
      <div className="relative z-10 flex-1 overflow-auto p-4 md:p-6 pt-0">
        <div className="max-w-2xl mx-auto space-y-3">
          {activePlayers.map((player, index) => {
            const answer = answers[player.id]?.[category] || "";
            const isEmpty = !answer.trim();
            const isMe = player.id === currentPlayerId;
            const isRevealed = revealedPlayers.includes(player.id);
            const isHidden = isHiddenMode && !isRevealed;
            const invalidStart = !isHidden && answer && !answer.trim().toLocaleUpperCase('tr-TR').startsWith(currentLetter);

            const votesForThisCard = currentVotes.filter(v =>
              v.targetPlayerId === player.id && v.category === category && v.isVeto
            );
            const voteCount = votesForThisCard.length;
            const iVoted = currentVotes.some(v =>
              v.voterId === currentPlayerId && v.targetPlayerId === player.id && v.category === category
            );
            const isRejected = voteCount > (totalActivePlayers / 2);

            return (
              <motion.div
                key={player.id}
                onClick={() => handleCardClick(player.id, isEmpty)}
                className={`
                  relative bg-[#12121f]/80 rounded-xl p-4 transition-all cursor-pointer group border
                  ${isEmpty ? 'opacity-50 cursor-not-allowed border-white/5' : 'border-white/5 hover:border-white/10'}
                  ${isHidden && isMe ? 'border-purple-500/50 bg-purple-500/5' : ''}
                  ${isRejected && !isHidden ? 'border-red-500/30 bg-red-500/5' : ''}
                  ${iVoted && !isMe ? 'border-red-500/50' : ''}
                  ${amISpectator ? 'cursor-default' : ''}
                `}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="text-3xl">{player.avatar}</div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-slate-500 font-medium">{player.name}</div>
                    <div className={`text-lg font-semibold truncate ${isEmpty ? 'text-slate-600 italic' :
                      isRejected && !isHidden ? 'text-red-300 line-through' :
                        isHidden ? 'text-slate-500 tracking-widest' : 'text-white'
                      }`}>
                      {isEmpty ? 'Cevap yok' : isHidden ? '••••••' : answer}
                    </div>

                    {/* Vote Dots - below the answer (show on all cards including own) */}
                    {!isEmpty && !isHidden && (
                      <div className="flex items-center gap-1 mt-2">
                        {activePlayers.filter(p => p.id !== player.id).map((voter) => {
                          const hasVoted = currentVotes.some(v =>
                            v.voterId === voter.id && v.targetPlayerId === player.id && v.category === category && v.isVeto
                          );
                          return (
                            <motion.div
                              key={voter.id}
                              className={`w-2.5 h-2.5 rounded-full transition-all ${hasVoted ? 'bg-red-500' : 'bg-white/10'}`}
                              animate={hasVoted ? { scale: [1, 1.3, 1] } : {}}
                              transition={{ duration: 0.3 }}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {isHidden && isMe && (
                      <motion.div
                        className="flex items-center gap-1 text-xs text-purple-300 bg-purple-900/50 px-2 py-1 rounded-lg"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <Eye size={12} /> Göster
                      </motion.div>
                    )}

                    {invalidStart && !isEmpty && !isRejected && (
                      <div className="flex items-center gap-1 text-xs text-yellow-500 bg-yellow-900/30 px-2 py-1 rounded-lg">
                        <AlertCircle size={12} />
                      </div>
                    )}

                    {!isEmpty && !isMe && !isHidden && !amISpectator && (
                      <motion.div
                        className={`p-2 rounded-lg transition-all ${iVoted
                          ? 'bg-red-500 text-white'
                          : 'bg-white/5 text-slate-400 group-hover:bg-red-500/20 group-hover:text-red-400'
                          }`}
                        whileTap={{ scale: 0.9 }}
                      >
                        <ThumbsDown size={16} />
                      </motion.div>
                    )}

                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Spacer for fixed footer */}
      <div className="h-24" />

      {/* Footer - Next Button (Fixed) */}
      {isHost && (
        <div className="fixed bottom-0 left-0 right-0 p-4 pt-8 bg-gradient-to-t from-[#0f0c29] via-[#0f0c29] to-transparent z-50 pb-safe">
          <div className="max-w-md mx-auto">
            <Button
              onClick={onNextCategory}
              disabled={isLoading}
              className="w-full py-3.5 text-lg font-bold shadow-lg shadow-blue-500/20"
              icon={isLoading ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />}
            >
              {isLoading ? 'Yükleniyor...' : isLastCategory ? 'Sonuçları Göster' : 'Sonraki Kategori'}
            </Button>
          </div>
        </div>
      )}

      {/* Non-host waiting (Fixed) */}
      {!isHost && (
        <div className="fixed bottom-0 left-0 right-0 p-4 pt-8 bg-gradient-to-t from-[#0f0c29] via-[#0f0c29] to-transparent z-50 pb-safe">
          <div className="max-w-md mx-auto">
            <motion.div
              className="text-center p-3 rounded-xl bg-white/5 border border-white/5"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <p className="text-slate-400 font-medium">Host'un devam etmesi bekleniyor...</p>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VotingPhase;