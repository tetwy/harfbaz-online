import React from 'react';
import { ThumbsDown, AlertCircle, ArrowRight } from 'lucide-react';
import { Button, Badge } from './UI';
import { CATEGORIES } from '../constants';
import { Player, RoundAnswers, Vote } from '../types';

interface VotingPhaseProps {
  players: Player[];
  answers: RoundAnswers;
  currentLetter: string;
  currentPlayerId: string;
  
  // YENİ PROP'LAR
  currentVotes: Vote[]; // Tüm oylar buradan geliyor
  currentCategoryIndex: number; // Kategori sırası DB'den geliyor
  isHost: boolean;
  onNextCategory: () => void;
  onToggleVote: (targetPlayerId: string) => void;
}

const VotingPhase: React.FC<VotingPhaseProps> = ({ 
  players, answers, currentLetter, currentPlayerId,
  currentVotes, currentCategoryIndex, isHost, onNextCategory, onToggleVote 
}) => {
  
  const category = CATEGORIES[currentCategoryIndex];
  const totalPlayers = players.length;
  const isLastCategory = currentCategoryIndex === CATEGORIES.length - 1;

  return (
    <div className="max-w-2xl w-full mx-auto space-y-6 animate-fade-in pb-28">
      <div className="text-center space-y-2">
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

      <div className="space-y-3">
        {players.map((player) => {
          const answer = answers[player.id]?.[category] || "";
          const isEmpty = !answer.trim();
          const isMe = player.id === currentPlayerId;

          const invalidStart = answer && !answer.trim().toLocaleUpperCase('tr-TR').startsWith(currentLetter);

          // Bu karta ait oyları filtrele
          const votesForThisCard = currentVotes.filter(v => 
            v.targetPlayerId === player.id && 
            v.category === category && 
            v.isVeto
          );

          const voteCount = votesForThisCard.length;
          // Ben oy verdim mi?
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

      {/* Sadece Yönetici İleri Butonunu Görür */}
      {isHost && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center px-4 z-30 pointer-events-none">
          <Button onClick={onNextCategory} className="w-full max-w-md shadow-2xl pointer-events-auto" icon={<ArrowRight />}>
            {isLastCategory ? 'Oylamayı Bitir' : 'Sıradaki Kategori'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default VotingPhase;