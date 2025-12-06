import React from 'react';
import { ThumbsDown, AlertCircle, ArrowRight, LogOut, Eye, EyeOff, Loader2 } from 'lucide-react'; 
import { Button, Badge } from './UI';
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
  onVotingComplete: (votes: Vote[]) => void;
  initialBotVotes: Vote[];
  onLeave: () => void;
  
  // Mevcut Proplar
  isHiddenMode: boolean;
  revealedPlayers: string[];
  onRevealCard: (playerId: string) => void;
  
  // YENİ PROP: Yükleniyor Durumu
  isLoading?: boolean;
}

const VotingPhase: React.FC<VotingPhaseProps> = ({ 
  players, answers, currentLetter, currentPlayerId,
  currentVotes, currentCategoryIndex, isHost, onNextCategory, onToggleVote, onLeave,
  isHiddenMode, revealedPlayers, onRevealCard,
  isLoading = false // Varsayılan değer
}) => {
  
  const category = CATEGORIES[currentCategoryIndex];
  const totalPlayers = players.length;
  const isLastCategory = currentCategoryIndex === CATEGORIES.length - 1;

  // Kart tıklama işleyicisi
  const handleCardClick = (targetPlayerId: string, isEmpty: boolean) => {
    if (isEmpty) return;

    const isMe = targetPlayerId === currentPlayerId;
    const isRevealed = revealedPlayers.includes(targetPlayerId);

    // EĞER KART BENİMSE VE GİZLİYSE -> AÇ
    if (isMe && isHiddenMode && !isRevealed) {
        onRevealCard(targetPlayerId);
        return;
    }

    // EĞER KART BAŞKASININSA -> OY VER (REDDET)
    if (!isMe) {
        onToggleVote(targetPlayerId);
    }
  };

  return (
    <div className="max-w-2xl w-full mx-auto space-y-6 animate-fade-in pb-28 relative px-4 md:px-0">
      
      {/* ÇIKIŞ BUTONU (Sticky Header) */}
      <div className="sticky top-4 z-50 flex justify-end pointer-events-none">
        <button 
          onClick={onLeave}
          className="pointer-events-auto flex items-center gap-2 text-slate-400 hover:text-red-400 transition-all text-xs font-bold bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-full border border-slate-700/50 hover:border-red-500/50 shadow-lg hover:shadow-red-900/20">
          <LogOut size={14} /> 
          <span>Odadan Ayrıl</span>
        </button>
      </div>

      <div className="text-center space-y-2 mt-6 md:mt-0">
        <Badge color="bg-yellow-500/20 text-yellow-300">OYLAMA ZAMANI</Badge>
        <h2 className="text-3xl font-bold text-white">{category}</h2>
        <div className="flex items-center justify-center gap-2 text-slate-400">
           <span>Harf:</span>
           <span className="w-8 h-8 flex items-center justify-center bg-brand-600 text-white rounded-lg font-bold text-lg">{currentLetter}</span>
        </div>
        {isHiddenMode && (
            <div className="flex items-center justify-center gap-2 text-xs text-purple-400 bg-purple-900/20 px-3 py-1 rounded-full mx-auto w-fit">
                <EyeOff size={12} /> Gizli Kelime Modu Aktif
            </div>
        )}
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          {isHost ? 'Yönetici olarak ilerleyişi sen kontrol ediyorsun.' : 'Yönetici kategoriyi değiştirene kadar bekle.'}
        </p>
      </div>

      <div className="space-y-3">
        {players.map((player) => {
          const answer = answers[player.id]?.[category] || "";
          const isEmpty = !answer.trim();
          const isMe = player.id === currentPlayerId;
          const isRevealed = revealedPlayers.includes(player.id);
          
          const isHidden = isHiddenMode && !isRevealed;
          const invalidStart = !isHidden && answer && !answer.trim().toLocaleUpperCase('tr-TR').startsWith(currentLetter);

          const votesForThisCard = currentVotes.filter(v => 
            v.targetPlayerId === player.id && 
            v.category === category && 
            v.isVeto
          );

          const voteCount = votesForThisCard.length;
          const iVoted = currentVotes.some(v => 
             v.voterId === currentPlayerId && 
             v.targetPlayerId === player.id && 
             v.category === category
          );
          
          const isRejected = voteCount > (totalPlayers / 2);

          return (
            <div 
              key={player.id}
              onClick={() => handleCardClick(player.id, isEmpty)}
              className={`
                relative p-4 rounded-xl border-2 transition-all cursor-pointer select-none group overflow-hidden
                ${isEmpty ? 'bg-slate-800/30 border-slate-800 opacity-60 cursor-not-allowed' : 
                  isHidden && isMe ? 'bg-purple-900/20 border-purple-500/50 hover:bg-purple-900/30' :
                  isRejected ? 'bg-red-950/30 border-red-500/50' : 
                  'bg-slate-800 border-slate-700 hover:border-slate-500'}
              `}
            >
              {isRejected && !isHidden && (
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(239,68,68,0.1)_25%,rgba(239,68,68,0.1)_50%,transparent_50%,transparent_75%,rgba(239,68,68,0.1)_75%,rgba(239,68,68,0.1)_100%)] bg-[length:20px_20px] pointer-events-none"></div>
              )}

              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <span className="text-3xl filter drop-shadow-lg flex-shrink-0">{player.avatar}</span>
                  <div className="flex flex-col items-start min-w-0">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">{player.name}</span>
                    
                    <span className={`text-xl font-medium transition-all truncate w-full 
                        ${isEmpty ? 'text-slate-600 italic' : 'text-white'} 
                        ${isRejected && !isHidden ? 'line-through decoration-2 decoration-red-500 text-red-200/70' : ''}
                        ${isHidden ? 'tracking-widest text-slate-500' : ''}
                    `}>
                      {isEmpty ? 'Cevap yok' : isHidden ? '••••••' : answer}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end justify-center gap-2 pl-2">
                   
                   {isHidden && isMe && (
                       <div className="flex items-center gap-1 text-[10px] text-purple-300 font-bold bg-purple-900/50 px-2 py-1 rounded-full whitespace-nowrap animate-pulse">
                           <Eye size={12} /> DOKUN VE AÇ
                       </div>
                   )}

                   {invalidStart && !isEmpty && !isRejected && (
                     <div className="flex items-center gap-1 text-[10px] text-yellow-500 font-bold bg-yellow-900/30 px-2 py-1 rounded-full whitespace-nowrap">
                        <AlertCircle size={10} /> HATALI
                     </div>
                   )}

                   {!isEmpty && !isMe && (
                    <div className={`
                      flex items-center gap-2 px-3 py-1.5 rounded-full transition-all text-xs font-bold whitespace-nowrap
                      ${iVoted ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-400 group-hover:bg-slate-600'}
                    `}>
                      <ThumbsDown size={14} className={iVoted ? 'fill-current' : ''} />
                      {iVoted ? 'RED' : 'REDDET'}
                    </div>
                  )}
                  {isMe && <Badge>Sen</Badge>}
                </div>
              </div>

              {!isEmpty && (
                <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                   <div className="flex items-center gap-1">
                      {Array.from({ length: totalPlayers }).map((_, idx) => (
                        <div 
                          key={idx} 
                          className={`
                            w-2.5 h-2.5 rounded-full transition-all duration-300
                            ${idx < voteCount ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] scale-110' : 'bg-slate-700'}
                          `}
                          title={idx < voteCount ? "Red Oyu" : "Onay/Beklemede"}
                        />
                      ))}
                   </div>
                   <div className="text-[10px] font-bold text-slate-500">
                      {voteCount} / {totalPlayers} RED
                      {isRejected && !isHidden && <span className="text-red-500 ml-2">(İPTAL)</span>}
                   </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isHost && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center px-4 z-30 pointer-events-none">
          <Button 
            onClick={onNextCategory} 
            disabled={isLoading} // Yükleniyorsa devre dışı
            className="w-full max-w-md shadow-2xl pointer-events-auto" 
            icon={isLoading ? <Loader2 className="animate-spin" /> : <ArrowRight />} // İkon değişimi
          >
            {isLoading 
                ? 'Hesaplanıyor...' 
                : (isLastCategory ? 'Oylamayı Bitir' : 'Sıradaki Kategori')
            }
          </Button>
        </div>
      )}
    </div>
  );
};

export default VotingPhase;