import React from 'react';
import { ThumbsDown, AlertCircle, ArrowRight, LogOut, Clock } from 'lucide-react'; 
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
}

const VotingPhase: React.FC<VotingPhaseProps> = ({ 
  players, answers, currentLetter, currentPlayerId,
  currentVotes, currentCategoryIndex, isHost, onNextCategory, onToggleVote, onLeave 
}) => {
  
  const category = CATEGORIES[currentCategoryIndex];
  const totalPlayers = players.length;
  const isLastCategory = currentCategoryIndex === CATEGORIES.length - 1;

  return (
    <div className="max-w-2xl w-full mx-auto space-y-6 animate-fade-in pb-32 relative px-4 md:px-0">
      
      {/* ÜST BAŞLIK ALANI */}
      <div className="text-center space-y-2 mt-6 md:mt-0">
        <Badge color="bg-yellow-500/20 text-yellow-300">OYLAMA ZAMANI</Badge>
        <h2 className="text-3xl font-bold text-white">{category}</h2>
        <div className="flex items-center justify-center gap-2 text-slate-400">
           <span>Harf:</span>
           <span className="w-8 h-8 flex items-center justify-center bg-brand-600 text-white rounded-lg font-bold text-lg">{currentLetter}</span>
        </div>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          {isHost ? 'Yönetici olarak ilerleyişi sen kontrol ediyorsun.' : 'Yönetici kategoriyi değiştirene kadar bekle.'}
        </p>
      </div>

      {/* OYUNCU KARTLARI LİSTESİ */}
      <div className="space-y-3">
        {players.map((player) => {
          const answer = answers[player.id]?.[category] || "";
          const isEmpty = !answer.trim();
          const isMe = player.id === currentPlayerId;

          const invalidStart = answer && !answer.trim().toLocaleUpperCase('tr-TR').startsWith(currentLetter);

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
              onClick={() => !isMe && !isEmpty && onToggleVote(player.id)}
              className={`
                relative p-4 rounded-xl border-2 transition-all cursor-pointer select-none group overflow-hidden
                ${isEmpty ? 'bg-slate-800/30 border-slate-800 opacity-60 cursor-not-allowed' : 
                  isRejected ? 'bg-red-950/30 border-red-500/50' : 
                  'bg-slate-800 border-slate-700 hover:border-slate-500'}
              `}
            >
              {isRejected && (
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(239,68,68,0.1)_25%,rgba(239,68,68,0.1)_50%,transparent_50%,transparent_75%,rgba(239,68,68,0.1)_75%,rgba(239,68,68,0.1)_100%)] bg-[length:20px_20px] pointer-events-none"></div>
              )}

              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <span className="text-3xl filter drop-shadow-lg flex-shrink-0">{player.avatar}</span>
                  <div className="flex flex-col items-start min-w-0">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">{player.name}</span>
                    <span className={`text-xl font-medium transition-all truncate w-full ${isEmpty ? 'text-slate-600 italic' : 'text-white'} ${isRejected ? 'line-through decoration-2 decoration-red-500 text-red-200/70' : ''}`}>
                      {isEmpty ? 'Cevap yok' : answer}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end justify-center gap-2 pl-2">
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
                      {isRejected && <span className="text-red-500 ml-2">(İPTAL)</span>}
                   </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ALT AKSİYON ÇUBUĞU (FOOTER) - Herkes İçin Görünür */}
      <div className="fixed bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent z-20 backdrop-blur-[2px]">
        <div className="flex gap-3 max-w-lg mx-auto w-full items-stretch">
            
            {/* SOL: ÇIKIŞ BUTONU (Kare İkon) */}
            <button
                onClick={onLeave}
                className="flex-none w-12 md:w-16 flex items-center justify-center rounded-xl md:rounded-2xl bg-slate-800/80 border border-slate-700 text-slate-400 hover:text-red-400 hover:bg-slate-800 hover:border-red-500/50 transition-all shadow-xl backdrop-blur-sm active:scale-95"
                title="Odadan Ayrıl"
            >
                <LogOut className="w-5 h-5 md:w-6 md:h-6" />
            </button>

            {/* SAĞ: AKSİYON BUTONU */}
            {isHost ? (
              // YÖNETİCİ İSE: İLERİ BUTONU
              <Button 
                onClick={onNextCategory} 
                className="flex-1 shadow-2xl !py-3 md:!py-4 text-base md:text-xl tracking-wide uppercase font-black transition-all duration-500 rounded-xl md:rounded-2xl"
                icon={<ArrowRight />}
              >
                {isLastCategory ? 'Oylamayı Bitir' : 'Sıradaki'}
              </Button>
            ) : (
              // OYUNCU İSE: BEKLEME GÖSTERGESİ (Pasif Buton Görünümlü)
              <div className="flex-1 flex items-center justify-center gap-3 bg-slate-800/50 border border-slate-700/50 rounded-xl md:rounded-2xl text-slate-500 font-bold text-sm md:text-base animate-pulse">
                 <Clock className="w-5 h-5" /> Yönetici Bekleniyor...
              </div>
            )}
        </div>
      </div>

    </div>
  );
};

export default VotingPhase;