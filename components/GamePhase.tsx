import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, User, MapPin, Cat, Flower2, Package, Star, Globe, Briefcase, Utensils, Clapperboard, LogOut, Check, Send } from 'lucide-react';
import { Button } from './UI';
import { CATEGORIES } from '../constants';

interface GamePhaseProps {
  letter: string;
  roundDuration: number;
  roomId: string;
  playerId: string;
  gameId: string; // Yeni: Oyun oturumu ID'si
  roundNumber: number; // Yeni: Mevcut tur numarası
  onTimeUp: (answers: Record<string, string>) => void;
  onLeave: () => void;
  categories: string[];
  roundStartTime?: string;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'İsim': return <User size={16} />;
    case 'Şehir': return <MapPin size={16} />;
    case 'Hayvan': return <Cat size={16} />;
    case 'Bitki': return <Flower2 size={16} />;
    case 'Eşya': return <Package size={16} />;
    case 'Ünlü': return <Star size={16} />;
    case 'Ülke': return <Globe size={16} />;
    case 'Meslek': return <Briefcase size={16} />;
    case 'Yemek': return <Utensils size={16} />;
    case 'Dizi/Film': return <Clapperboard size={16} />;
    default: return <User size={16} />;
  }
};

const GamePhase: React.FC<GamePhaseProps> = ({
  letter, roundDuration, roomId, playerId, gameId, roundNumber, onTimeUp, onLeave, categories, roundStartTime
}) => {

  const calculateInitialTime = () => {
    if (!roundStartTime) return roundDuration;
    const start = new Date(roundStartTime).getTime();
    const now = Date.now();
    const elapsedSeconds = (now - start) / 1000;
    const remaining = Math.ceil(roundDuration - elapsedSeconds);
    return remaining > 0 ? remaining : 0;
  };

  const [timeLeft, setTimeLeft] = useState(calculateInitialTime());
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const answersRef = useRef(answers);
  const submittedRef = useRef(submitted);

  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { submittedRef.current = submitted; }, [submitted]);

  // Track if component was mounted properly (for HMR detection)
  const mountedRef = useRef(false);

  // Track if timer has been initialized for current round
  const timerInitializedRef = useRef<string | null>(null);

  useEffect(() => {
    // Mark as mounted after a short delay to detect HMR
    const timeout = setTimeout(() => {
      mountedRef.current = true;
    }, 100);

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  // Yeni oyun veya tur başladığında state'i sıfırla
  useEffect(() => {
    setAnswers({});
    setSubmitted(false);
    submittedRef.current = false;
    setTimeLeft(calculateInitialTime());
  }, [gameId, roundNumber]);

  useEffect(() => {
    const initialTime = calculateInitialTime();

    // Timer interval'ı her zaman başlat
    const timer = setInterval(() => {
      const realRemainingTime = calculateInitialTime();
      setTimeLeft(realRemainingTime);

      if (realRemainingTime <= 0) {
        clearInterval(timer);
        // Sadece timer doğal olarak 0'a düştüğünde submit et
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
    setSubmitted(true);
    submittedRef.current = true;
    onTimeUp(answersRef.current);
  };

  // SafeGuard: roundDuration 0 veya undefined ise varsayılan 60
  const safeRoundDuration = roundDuration > 0 ? roundDuration : 60;
  const progressPercentage = Math.max(0, Math.min(100, (timeLeft / safeRoundDuration) * 100));
  const isUrgent = timeLeft <= 10;
  const displayCategories = categories && categories.length > 0 ? categories : CATEGORIES;

  return (
    <div className="min-h-screen w-full bg-[#0a0a1a] overflow-x-hidden">

      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-[#0a0a1a] to-pink-900/20" />
        {isUrgent && (
          <motion.div
            className="absolute inset-0 bg-red-500/5"
            animate={{ opacity: [0, 0.1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
        )}
      </div>

      {/* Leave Button */}
      <motion.button
        onClick={onLeave}
        className="fixed top-4 right-4 z-50 flex items-center gap-1.5 text-slate-500 hover:text-red-400 transition-all text-sm px-3 py-2 rounded-xl bg-white/5 hover:bg-red-500/10 safe-top safe-right"
        whileTap={{ scale: 0.95 }}
      >
        <LogOut size={16} /> Çık
      </motion.button>

      <div className="relative z-10 min-h-screen flex flex-col p-4 pt-14 md:pt-6 md:p-6 pb-32">
        <div className="max-w-2xl mx-auto w-full flex flex-col gap-4">

          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            {/* Letter */}
            <motion.div
              className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <span className="text-3xl md:text-4xl font-black text-white">{letter}</span>
            </motion.div>

            {/* Timer */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-slate-400">
                  <Timer size={16} />
                  <span className="text-sm">Kalan Süre</span>
                </div>
                <motion.span
                  className={`text-2xl md:text-3xl font-black tabular-nums ${isUrgent ? 'text-red-400' : 'text-white'}`}
                  animate={isUrgent ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.5, repeat: isUrgent ? Infinity : 0 }}
                >
                  {timeLeft}s
                </motion.span>
              </div>
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${progressPercentage}%`,
                    transition: 'width 1s linear',
                    minWidth: progressPercentage > 0 ? '4px' : '0px',
                    background: isUrgent
                      ? 'linear-gradient(to right, #ef4444, #f97316)'
                      : 'linear-gradient(to right, #a855f7, #ec4899)'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Categories Grid */}
          <div className="w-full">
            <div className="grid grid-cols-2 gap-3 w-full">
              {displayCategories.map((category, index) => (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="bg-[#12121f]/80 rounded-xl border border-white/5 p-3"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-lg bg-white/5 text-slate-400">
                      {getCategoryIcon(category)}
                    </div>
                    <span className="text-sm font-bold text-slate-300">{category}</span>
                    {answers[category] && (
                      <div className="w-2 h-2 rounded-full bg-green-500 ml-auto" />
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder={`${category} yaz...`}
                    value={answers[category] || ''}
                    onChange={(e) => handleInputChange(category, e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                    disabled={submitted}
                    className="w-full bg-white/5 rounded-lg px-3 py-2.5 text-white placeholder-slate-600 outline-none text-sm font-medium border border-white/5 focus:border-purple-500/50"
                  />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Submit Button - Erken gönderim için */}
          {/* Submit Button - Erken gönderim için - Fixed Bottom */}
          {!submitted && (
            <>
              {/* Spacer div to prevent content hidden behind fixed button */}
              <div className="h-32" />

              <div className="fixed bottom-0 left-0 right-0 p-4 pt-8 bg-gradient-to-t from-[#0f0c29] via-[#0f0c29] to-transparent z-50 pb-safe">
                <div className="max-w-md mx-auto">
                  <Button
                    onClick={() => {
                      if (!submittedRef.current) {
                        handleFinish();
                      }
                    }}
                    disabled={submitted}
                    className="w-full py-3.5 text-base font-bold shadow-lg shadow-purple-500/20 active:scale-[0.98] transition-all"
                    icon={<Send size={20} />}
                  >
                    Cevapları Gönder ({Object.keys(answers).filter(k => answers[k]).length}/{displayCategories.length})
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Toast notification - Cevaplar gönderildi */}
          <AnimatePresence>
            {submitted && (
              <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                className="fixed top-16 left-0 right-0 z-[100] flex justify-center p-2"
              >
                <div className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium shadow-lg bg-green-500/90 text-white">
                  <Check size={16} />
                  <span>Cevaplar gönderildi!</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default GamePhase;
