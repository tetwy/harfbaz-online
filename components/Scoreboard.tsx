import React from 'react';
import { Trophy, RotateCcw, Home, Loader2, LogOut } from 'lucide-react'; // LogOut eklendi
import { Button, Card } from './UI';
import { Player } from '../types';

interface ScoreboardProps {
  players: Player[];
  onNextRound: () => void;
  isGameOver: boolean;
  roundNumber: number;
  isHost: boolean;
  onLeave: () => void; // Yeni prop
}

const Scoreboard: React.FC<ScoreboardProps> = ({ players, onNextRound, isGameOver, roundNumber, isHost, onLeave }) => {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];

  return (
    <div className="max-w-md w-full mx-auto space-y-8 animate-fade-in text-center pb-12 relative">
      
       {/* ÇIKIŞ BUTONU (Sağ Üst - Eğer oyun bittiyse ve host değilse veya host ise de çıkmak isterse) */}
       {isGameOver && (
        <button 
            onClick={onLeave}
            className="absolute -top-10 right-0 flex items-center gap-2 text-slate-500 hover:text-red-400 transition-colors text-xs font-bold"
        >
            <LogOut size={14} /> Odadan Ayrıl
        </button>
       )}

      <div className="space-y-2">
        <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600">
          {isGameOver ? 'OYUN BİTTİ!' : `${roundNumber}. TUR SONUCU`}
        </h2>
        <p className="text-slate-400">Puan durumu güncellendi.</p>
      </div>

      {isGameOver && (
        <div className="relative inline-block mx-auto py-8">
           <div className="absolute inset-0 bg-yellow-500/20 blur-3xl rounded-full"></div>
           <Trophy size={80} className="text-yellow-400 relative z-10 mx-auto mb-4 drop-shadow-lg" />
           <div className="text-2xl font-bold text-white relative z-10">Kazanan</div>
           <div className="text-4xl font-black text-yellow-300 relative z-10">{winner.name}</div>
        </div>
      )}

      <div className="space-y-3">
        {sortedPlayers.map((player, index) => (
          <Card key={player.id} className="!p-4 flex items-center justify-between border-l-4 border-l-transparent data-[rank='0']:border-l-yellow-400 data-[rank='1']:border-l-slate-400 data-[rank='2']:border-l-amber-700" data-rank={index}>
            <div className="flex items-center gap-4">
              <span className="text-lg font-mono font-bold text-slate-500 w-6">#{index + 1}</span>
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-xl">
                {player.avatar}
              </div>
              <div className="text-left">
                <div className="font-bold text-white">{player.name}</div>
              </div>
            </div>
            <div className="font-mono font-bold text-2xl text-brand-400">
              {player.score}
            </div>
          </Card>
        ))}
      </div>

      <div className="pt-8">
        {isGameOver ? (
          <Button 
            onClick={onNextRound} 
            disabled={!isHost} 
            className={`w-full transition-all ${!isHost ? 'opacity-70 cursor-not-allowed bg-slate-800' : ''}`}
            icon={isHost ? <Home /> : <Loader2 className="animate-spin" />}
          >
            {isHost ? 'Lobiye Dön (Herkesi Taşı)' : 'Yönetici Bekleniyor...'}
          </Button>
        ) : (
          <Button onClick={onNextRound} className="w-full" icon={<RotateCcw />}>
            Sonraki Tur
          </Button>
        )}
      </div>
    </div>
  );
};

export default Scoreboard;