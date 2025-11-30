import React, { useState, useEffect, useRef } from 'react';
import { Timer, Send, User, MapPin, Cat, Flower2, Package, Star, Globe, Briefcase, Utensils, Clapperboard, LogOut } from 'lucide-react';
import { Button } from './UI'; // Dosya yolu düzeltildi
import { CATEGORIES } from '../constants'; // Dosya yolu düzeltildi

interface GamePhaseProps {
  letter: string;
  roundDuration: number;
  roomId: string;
  playerId: string;
  onTimeUp: (answers: Record<string, string>) => void;
  onLeave: () => void;
  categories: string[];
  roundStartTime?: string; 
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'İsim': return <User className="group-focus-within:text-brand-400 text-slate-500 transition-colors" size={18} />;
    case 'Şehir': return <MapPin className="group-focus-within:text-brand-400 text-slate-500 transition-colors" size={18} />;
    case 'Hayvan': return <Cat className="group-focus-within:text-brand-400 text-slate-500 transition-colors" size={18} />;
    case 'Bitki': return <Flower2 className="group-focus-within:text-brand-400 text-slate-500 transition-colors" size={18} />;
    case 'Eşya': return <Package className="group-focus-within:text-brand-400 text-slate-500 transition-colors" size={18} />;
    case 'Ünlü': return <Star className="group-focus-within:text-brand-400 text-slate-500 transition-colors" size={18} />;
    case 'Ülke': return <Globe className="group-focus-within:text-brand-400 text-slate-500 transition-colors" size={18} />;
    case 'Meslek': return <Briefcase className="group-focus-within:text-brand-400 text-slate-500 transition-colors" size={18} />;
    case 'Yemek': return <Utensils className="group-focus-within:text-brand-400 text-slate-500 transition-colors" size={18} />;
    case 'Dizi/Film': return <Clapperboard className="group-focus-within:text-brand-400 text-slate-500 transition-colors" size={18} />;
    default: return <User size={18} />;
  }
};

const GamePhase: React.FC<GamePhaseProps> = ({ 
  letter, 
  roundDuration, 
  roomId, 
  playerId, 
  onTimeUp, 
  onLeave, 
  categories,
  roundStartTime 
}) => {
  
  // Süre hesaplama fonksiyonu
  const calculateInitialTime = () => {
    if (!roundStartTime) return roundDuration;

    const start = new Date(roundStartTime).getTime();
    const now = Date.now();
    const elapsedSeconds = (now - start) / 1000;
    const remaining = Math.ceil(roundDuration - elapsedSeconds);

    return remaining > 0 ? remaining : 0;
  };

  // State
  const [timeLeft, setTimeLeft] = useState(calculateInitialTime());
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  
  // Refs (Güncel verilere erişim için)
  const answersRef = useRef(answers);
  const submittedRef = useRef(submitted);

  // Ref'leri senkronize et
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    submittedRef.current = submitted;
  }, [submitted]);

  // UNMOUNT KORUMASI: Bileşen ekrandan kalkarken (örn: Host oylamayı başlattığında)
  // eğer hala cevapları göndermediysek, otomatik gönder.
  // Not: Strict Mode kontrolünü (1000ms) kaldırdık çünkü canlıda sorun yaratabilir
  // ve merkezi zamanlama zaten yanlış gönderimleri engelliyor.
  useEffect(() => {
    return () => {
      if (!submittedRef.current) {
        // console.log("Unmount tetiklendi, cevaplar gönderiliyor...");
        onTimeUp(answersRef.current);
      }
    };
  }, []); 

  // ZAMANLAMA VE OTOMATİK BİTİŞ
  useEffect(() => {
    // Eğer component mount olduğunda süre zaten bitikse hemen bitir
    if (calculateInitialTime() <= 0) {
        if (!submittedRef.current) handleFinish();
        return;
    }

    const timer = setInterval(() => {
      const realRemainingTime = calculateInitialTime();
      setTimeLeft(realRemainingTime);

      if (realRemainingTime <= 0) {
        clearInterval(timer);
        if (!submittedRef.current) {
           handleFinish();
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [roundStartTime, roundDuration]);

  const handleInputChange = (category: string, value: string) => {
    setAnswers(prev => ({ ...prev, [category]: value }));
  };

  const handleFinish = () => {
    if (submittedRef.current) return;
    
    // Optimistik güncelleme: Hemen butonun durumunu değiştir
    setSubmitted(true);
    submittedRef.current = true;
    
    // Cevapları gönder
    onTimeUp(answersRef.current);
  };

  const progressPercentage = Math.max(0, Math.min(100, (timeLeft / roundDuration) * 100));
  const isUrgent = timeLeft <= 10;
  const displayCategories = categories && categories.length > 0 ? categories : CATEGORIES;

  return (
    <div className="max-w-5xl w-full mx-auto pb-32 animate-fade-in px-4 relative">
      
      {/* HUD HEADER */}
      <div className="sticky top-2 md:top-4 z-30 mb-4 md:mb-8">
        <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 shadow-2xl shadow-black/50 rounded-xl md:rounded-2xl p-3 md:p-4 flex items-center gap-3 md:gap-6 relative overflow-hidden">
          
          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 h-1 bg-slate-800 w-full">
            <div 
              className={`h-full transition-all duration-1000 ease-linear ${isUrgent ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'bg-brand-500'}`}
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>

          {/* Letter Box */}
          <div className="flex-shrink-0 relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-400 to-purple-600 rounded-lg md:rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity animate-pulse"></div>
            <div className="relative w-12 h-12 md:w-20 md:h-20 bg-slate-900 rounded-lg md:rounded-xl border border-white/10 flex flex-col items-center justify-center shadow-2xl">
              <span className="text-[8px] md:text-[10px] text-slate-400 font-bold tracking-widest uppercase mb-[-2px] md:mb-[-4px]">HARF</span>
              <span className="text-2xl md:text-5xl font-black text-white drop-shadow-md leading-none pb-1 md:pb-0">
                {letter}
              </span>
            </div>
          </div>

          {/* Info & Timer */}
          <div className="flex-1 flex items-center justify-between">
            <div className="flex flex-col justify-center">
               <h3 className="text-white font-bold text-sm md:text-lg leading-tight">Kelimeleri Bul!</h3>
               <p className="text-slate-400 text-[10px] md:text-sm hidden sm:block">Baş harfi <span className="text-brand-400 font-bold">{letter}</span> olan kelimeler yaz.</p>
               <p className="text-slate-400 text-[10px] sm:hidden">Harf: <span className="text-brand-400 font-bold">{letter}</span></p>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              <div className="text-right">
                <div className={`text-2xl md:text-4xl font-mono font-black tabular-nums tracking-tighter leading-none ${isUrgent ? 'text-red-500 animate-[pulse_1s_infinite]' : 'text-white'}`}>
                  {timeLeft}
                </div>
                <div className="text-[8px] md:text-[10px] font-bold text-slate-500 tracking-widest uppercase text-right">SANİYE</div>
              </div>
              <div className={`p-2 md:p-3 rounded-full bg-slate-800 hidden sm:block ${isUrgent ? 'animate-spin text-red-500' : 'text-brand-400'}`}>
                <Timer size={20} className="md:w-6 md:h-6" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* INPUTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
        {displayCategories.map((category) => (
          <div 
            key={category}
            className="group relative bg-slate-800/40 hover:bg-slate-800/60 border border-slate-700/50 rounded-xl md:rounded-2xl p-3 md:p-4 transition-all duration-300 focus-within:border-brand-500 focus-within:bg-slate-900 focus-within:shadow-[0_0_20px_rgba(124,58,237,0.25)]"
          >
            <div className="flex flex-row md:flex-col h-full justify-between items-center md:items-stretch gap-3 md:gap-2">
              
              {/* Label & Icon */}
              <div className="flex items-center gap-2 md:justify-between min-w-[80px] md:min-w-0">
                <div className="md:hidden text-slate-500 group-focus-within:text-brand-400">
                    {getCategoryIcon(category)}
                </div>
                
                <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest group-focus-within:text-brand-400 transition-colors truncate">
                  {category}
                </label>

                <div className="hidden md:block">
                    {getCategoryIcon(category)}
                </div>
              </div>
              
              {/* Input */}
              <input
                type="text"
                value={answers[category] || ''}
                onChange={(e) => handleInputChange(category, e.target.value)}
                disabled={submitted}
                className="w-full bg-transparent border-none outline-none text-white p-0 focus:ring-0 placeholder-slate-700 text-base md:text-2xl font-semibold tracking-tight caret-brand-500"
                placeholder={`${letter}...`}
                autoComplete="off"
              />
            </div>
          </div>
        ))}
      </div>

      {/* FOOTER ACTION */}
      <div className="fixed bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent z-20 backdrop-blur-[2px]">
        <div className="flex gap-3 max-w-lg mx-auto w-full items-stretch">
            
            <button
                onClick={onLeave}
                className="flex-none w-12 md:w-16 flex items-center justify-center rounded-xl md:rounded-2xl bg-slate-800/80 border border-slate-700 text-slate-400 hover:text-red-400 hover:bg-slate-800 hover:border-red-500/50 transition-all shadow-xl backdrop-blur-sm active:scale-95"
                title="Odadan Ayrıl"
            >
                <LogOut className="w-5 h-5 md:w-6 md:h-6" />
            </button>

            <Button 
              onClick={handleFinish} 
              disabled={submitted}
              className={`
                flex-1 shadow-2xl !py-3 md:!py-4 text-base md:text-xl tracking-wide uppercase font-black transition-all duration-500 rounded-xl md:rounded-2xl
                ${submitted ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-brand-600 hover:bg-brand-500 hover:shadow-brand-500/40 hover:-translate-y-1'}
              `}
            >
              {submitted ? (
                <span className="flex items-center gap-2 md:gap-3 text-sm md:text-base">
                  <Timer className="animate-spin w-4 h-4 md:w-5 md:h-5" /> <span className="hidden sm:inline">Diğerleri Bekleniyor...</span><span className="sm:hidden">Bekleniyor...</span>
                </span>
              ) : (
                <span className="flex items-center gap-2 md:gap-3 text-sm md:text-base">
                  <Send className="fill-current w-4 h-4 md:w-5 md:h-5" /> Cevapları Gönder
                </span>
              )}
            </Button>
        </div>
      </div>

    </div>
  );
};

export default GamePhase;