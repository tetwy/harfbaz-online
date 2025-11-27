import React, { useState, useEffect } from 'react';
import { Timer, Send, User, MapPin, Cat, Flower2, Package, Star, Globe, Briefcase, Utensils, Clapperboard } from 'lucide-react';
import { Button } from './UI';
import { CATEGORIES } from '../constants';

// gameService importuna gerek kalmadı, kaldırdık.

interface GamePhaseProps {
  letter: string;
  roundDuration: number;
  roomId: string;
  playerId: string;
  onTimeUp: (answers: Record<string, string>) => void;
}

// Kategori ikonları (Aynı kalıyor)
const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'İsim': return <User className="group-focus-within:text-brand-400 text-slate-500 transition-colors" size={20} />;
    case 'Şehir': return <MapPin className="group-focus-within:text-brand-400 text-slate-500 transition-colors" size={20} />;
    case 'Hayvan': return <Cat className="group-focus-within:text-brand-400 text-slate-500 transition-colors" size={20} />;
    case 'Bitki': return <Flower2 className="group-focus-within:text-brand-400 text-slate-500 transition-colors" size={20} />;
    case 'Eşya': return <Package className="group-focus-within:text-brand-400 text-slate-500 transition-colors" size={20} />;
    case 'Ünlü': return <Star className="group-focus-within:text-brand-400 text-slate-500 transition-colors" size={20} />;
    case 'Ülke': return <Globe className="group-focus-within:text-brand-400 text-slate-500 transition-colors" size={20} />;
    case 'Meslek': return <Briefcase className="group-focus-within:text-brand-400 text-slate-500 transition-colors" size={20} />;
    case 'Yemek': return <Utensils className="group-focus-within:text-brand-400 text-slate-500 transition-colors" size={20} />;
    case 'Dizi/Film': return <Clapperboard className="group-focus-within:text-brand-400 text-slate-500 transition-colors" size={20} />;
    default: return <User />;
  }
};

const GamePhase: React.FC<GamePhaseProps> = ({ letter, roundDuration, roomId, playerId, onTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState(roundDuration);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      handleFinish(); // Süre bitince otomatik gönder
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleInputChange = (category: string, value: string) => {
    setAnswers(prev => ({ ...prev, [category]: value }));
  };

  const handleFinish = () => {
    if (submitted) return;
    setSubmitted(true);
    
    // HATALI OLAN SATIR BURADAYDI VE SİLİNDİ:
    // await gameService.submitAnswers(roomId, playerId, answers); 
    
    // Sadece üst bileşene (App.tsx) haber veriyoruz, kaydı o yapacak.
    onTimeUp(answers);
  };

  const progressPercentage = (timeLeft / roundDuration) * 100;
  const isUrgent = timeLeft <= 10;

  return (
    <div className="max-w-5xl w-full mx-auto pb-32 animate-fade-in px-4">
      
      {/* HUD HEADER */}
      <div className="sticky top-4 z-30 mb-8">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 shadow-2xl shadow-black/50 rounded-2xl p-4 flex items-center gap-4 sm:gap-6 relative overflow-hidden">
          
          {/* Progress Bar Background */}
          <div className="absolute bottom-0 left-0 h-1 bg-slate-800 w-full">
            <div 
              className={`h-full transition-all duration-1000 ease-linear ${isUrgent ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'bg-brand-500'}`}
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>

          {/* Letter Box */}
          <div className="flex-shrink-0 relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-400 to-purple-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity animate-pulse"></div>
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-slate-900 rounded-xl border border-white/10 flex flex-col items-center justify-center shadow-2xl">
              <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mb-[-4px]">HARF</span>
              {/* Harf Görünüm Düzeltmesi */}
              <span className="text-4xl sm:text-5xl font-black text-white drop-shadow-md">
                {letter}
              </span>
            </div>
          </div>

          {/* Info & Timer */}
          <div className="flex-1 flex items-center justify-between">
            <div className="hidden sm:block">
               <h3 className="text-white font-bold text-lg">Kelimeleri Bul!</h3>
               <p className="text-slate-400 text-sm">Baş harfi <span className="text-brand-400 font-bold">{letter}</span> olan kelimeler yaz.</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className={`text-4xl font-mono font-black tabular-nums tracking-tighter leading-none ${isUrgent ? 'text-red-500 animate-[pulse_1s_infinite]' : 'text-white'}`}>
                  {timeLeft}
                </div>
                <div className="text-[10px] font-bold text-slate-500 tracking-widest uppercase text-right">SANİYE</div>
              </div>
              <div className={`p-3 rounded-full bg-slate-800 hidden sm:block ${isUrgent ? 'animate-spin text-red-500' : 'text-brand-400'}`}>
                <Timer size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* INPUTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {CATEGORIES.map((category) => (
          <div 
            key={category}
            className="group relative bg-slate-800/40 hover:bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 transition-all duration-300 focus-within:border-brand-500 focus-within:bg-slate-900 focus-within:shadow-[0_0_20px_rgba(124,58,237,0.25)]"
          >
            <div className="flex flex-col h-full justify-between gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest group-focus-within:text-brand-400 transition-colors">
                  {category}
                </label>
                {getCategoryIcon(category)}
              </div>
              
              <input
                type="text"
                value={answers[category] || ''}
                onChange={(e) => handleInputChange(category, e.target.value)}
                disabled={submitted}
                className="w-full bg-transparent border-none outline-none text-white p-0 focus:ring-0 placeholder-slate-700 text-xl sm:text-2xl font-semibold tracking-tight caret-brand-500"
                placeholder={`${letter}...`}
                autoComplete="off"
              />
            </div>
          </div>
        ))}
      </div>

      {/* FOOTER ACTION */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent z-20 flex justify-center">
        <Button 
          onClick={handleFinish} 
          disabled={submitted}
          className={`
            w-full max-w-lg shadow-2xl !py-4 text-xl tracking-wide uppercase font-black transition-all duration-500 rounded-2xl
            ${submitted ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-brand-600 hover:bg-brand-500 hover:shadow-brand-500/40 hover:-translate-y-1'}
          `}
        >
          {submitted ? (
            <span className="flex items-center gap-3">
              <Timer className="animate-spin" /> Diğerleri Bekleniyor...
            </span>
          ) : (
            <span className="flex items-center gap-3">
              <Send className="fill-current" /> Cevapları Gönder
            </span>
          )}
        </Button>
      </div>

    </div>
  );
};

export default GamePhase;