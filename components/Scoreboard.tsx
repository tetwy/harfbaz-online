import React from 'react';
import { Trophy, RotateCcw, Home, Loader2, LogOut } from 'lucide-react';
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

  return (
    <div className="max-w-md w-full mx-auto space-y-8 animate-fade-in text-center pb-32 relative px-4 md:px-0">
      
      {/* Üst Başlık ve Bilgi */}
      <div className="space-y-2 mt-6 md:mt-0">
        <h2 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600">
          {isGameOver ? 'OYUN BİTTİ!' : `${roundNumber}. TUR SONUCU`}
        </h2>
        <p className="text-sm md:text-base text-slate-400">Puan durumu güncellendi.</p>
      </div>

      {/* Kazanan Gösterimi (Sadece Oyun Bittiğinde) */}
      {isGameOver && (
        <div className="relative inline-block mx-auto py-4 md:py-8">
           <div className="absolute inset-0 bg-yellow-500/20 blur-3xl rounded-full"></div>
           <Trophy size={60} className="text-yellow-400 relative z-10 mx-auto mb-2 md:mb-4 drop-shadow-lg md:w-20 md:h-20" />
           <div className="text-xl md:text-2xl font-bold text-white relative z-10">Kazanan</div>
           <div className="text-3xl md:text-4xl font-black text-yellow-300 relative z-10">{winner.name}</div>
        </div>
      )}

      {/* Skor Listesi */}
      <div className="space-y-3">
        {sortedPlayers.map((player, index) => (
          <Card key={player.id} className="!p-3 md:!p-4 flex items-center justify-between border-l-4 border-l-transparent data-[rank='0']:border-l-yellow-400 data-[rank='1']:border-l-slate-400 data-[rank='2']:border-l-amber-700" data-rank={index}>
            <div className="flex items-center gap-3 md:gap-4">
              <span className="text-base md:text-lg font-mono font-bold text-slate-500 w-4 md:w-6">#{index + 1}</span>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-700 flex items-center justify-center text-lg md:text-xl">
                {player.avatar}
              </div>
              <div className="text-left">
                <div className="font-bold text-white text-sm md:text-base">{player.name}</div>
              </div>
            </div>
            <div className="font-mono font-bold text-xl md:text-2xl text-brand-400">
              {player.score}
            </div>
          </Card>
        ))}
      </div>

      {/* FOOTER ACTION (Sabit Alt Çubuk - Mobil Uyumlu) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent z-20 backdrop-blur-[2px]">
        <div className="flex gap-3 max-w-md mx-auto w-full items-stretch">
            
            {/* SOL: ÇIKIŞ BUTONU (Kare İkon) */}
            <button
                onClick={onLeave}
                className="flex-none w-12 md:w-16 flex items-center justify-center rounded-xl md:rounded-2xl bg-slate-800/80 border border-slate-700 text-slate-400 hover:text-red-400 hover:bg-slate-800 hover:border-red-500/50 transition-all shadow-xl backdrop-blur-sm active:scale-95"
                title="Odadan Ayrıl"
            >
                <LogOut className="w-5 h-5 md:w-6 md:h-6" />
            </button>

            {/* SAĞ: ANA AKSİYON BUTONU */}
            {isGameOver ? (
              <Button 
                onClick={onNextRound} 
                disabled={!isHost} 
                className={`
                  flex-1 shadow-2xl !py-3 md:!py-4 text-base md:text-lg tracking-wide font-bold transition-all duration-500 rounded-xl md:rounded-2xl
                  ${!isHost ? 'opacity-70 cursor-not-allowed bg-slate-800' : ''}
                `}
                icon={isHost ? <Home className="w-5 h-5" /> : <Loader2 className="animate-spin w-5 h-5" />}
              >
                {isHost ? 'Lobiye Dön' : 'Yönetici Bekleniyor...'}
              </Button>
            ) : (
              <Button 
                onClick={onNextRound} 
                className="flex-1 shadow-2xl !py-3 md:!py-4 text-base md:text-lg tracking-wide font-bold transition-all duration-500 rounded-xl md:rounded-2xl" 
                icon={<RotateCcw className="w-5 h-5" />}
              >
                Sonraki Tur
              </Button>
            )}
        </div>
      </div>

    </div>
  );
};

export default Scoreboard;