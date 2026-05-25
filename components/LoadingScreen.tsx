import React from 'react';
import { motion } from 'framer-motion';

type LoadingVariant = 'game' | 'waiting' | 'voting' | 'scoreboard' | 'default';

interface LoadingScreenProps {
    variant?: LoadingVariant;
    message?: string;
}

// Shimmer skeleton
const Skel: React.FC<{ className?: string; delay?: number }> = ({ className, delay = 0 }) => (
    <motion.div
        className={`rounded-xl ${className}`}
        style={{
            background: 'linear-gradient(90deg, rgba(124,58,237,0.06) 0%, rgba(124,58,237,0.12) 50%, rgba(124,58,237,0.06) 100%)',
            backgroundSize: '200% 100%',
        }}
        animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'linear', delay }}
    />
);

const WaitingRoomSkeleton = () => (
    <div className="flex flex-col lg:flex-row h-full gap-8 p-6">
        <div className="w-full lg:w-[320px] space-y-5">
            <Skel className="h-7 w-40" />
            <Skel className="h-28 w-full" />
            <Skel className="h-14 w-full" />
            <div className="space-y-3">
                <Skel className="h-5 w-24" />
                {[...Array(3)].map((_, i) => <Skel key={i} className="h-11 w-full" delay={i * 0.08} />)}
            </div>
        </div>
        <div className="flex-1">
            <Skel className="h-7 w-32 mb-5" />
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
                {[...Array(8)].map((_, i) => <Skel key={i} className="h-28" delay={i * 0.05} />)}
            </div>
        </div>
    </div>
);

const GamePhaseSkeleton = () => (
    <div className="max-w-4xl mx-auto w-full p-5 space-y-5">
        <div className="flex items-center gap-4">
            <Skel className="w-10 h-10 rounded-xl" />
            <Skel className="h-5 w-32" />
            <Skel className="h-5 w-20 ml-auto" />
        </div>
        <Skel className="h-1 w-full rounded-none" />
        <div className="grid grid-cols-2 gap-3">
            {[...Array(8)].map((_, i) => <Skel key={i} className="h-24" delay={i * 0.06} />)}
        </div>
        <Skel className="h-14 w-full" />
    </div>
);

const VotingPhaseSkeleton = () => (
    <div className="max-w-3xl mx-auto w-full p-5 space-y-5">
        <Skel className="h-28 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => <Skel key={i} className="h-20" delay={i * 0.08} />)}
        </div>
        <Skel className="h-14 w-full" />
    </div>
);

const ScoreboardSkeleton = () => (
    <div className="max-w-xl mx-auto w-full p-5 flex flex-col items-center space-y-6">
        <Skel className="w-20 h-20 rounded-full" />
        <Skel className="h-8 w-48" />
        <div className="w-full space-y-2.5">
            {[...Array(5)].map((_, i) => <Skel key={i} className="h-16 w-full" delay={i * 0.08} />)}
        </div>
        <Skel className="h-14 w-full" />
    </div>
);

const DefaultSkeleton = () => (
    <div className="flex items-center justify-center h-full">
        <div className="space-y-4 w-64 text-center">
            <Skel className="h-16 w-16 mx-auto rounded-2xl" />
            <Skel className="h-4 w-full" />
            <Skel className="h-4 w-3/4 mx-auto" />
        </div>
    </div>
);

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ variant = 'default', message }) => {
    const renderSkeleton = () => {
        switch (variant) {
            case 'waiting':   return <WaitingRoomSkeleton />;
            case 'game':      return <GamePhaseSkeleton />;
            case 'voting':    return <VotingPhaseSkeleton />;
            case 'scoreboard':return <ScoreboardSkeleton />;
            default:          return <DefaultSkeleton />;
        }
    };

    return (
        <div className="h-screen w-screen fixed inset-0 global-bg flex flex-col overflow-hidden">
            {/* Subtle glow */}
            <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(124,58,237,0.06) 0%, transparent 70%)' }} />

            {/* Top bar skeleton */}
            <div className="flex-shrink-0 p-5 flex items-center justify-between border-b"
                style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                <Skel className="h-5 w-28" />
                <Skel className="h-8 w-20" />
            </div>

            {/* Content skeleton */}
            <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
                {renderSkeleton()}
            </div>

            {message && (
                <motion.p
                    className="absolute bottom-8 left-0 right-0 text-center text-slate-600 text-xs font-medium"
                    animate={{ opacity: [0.4, 0.7, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                >
                    {message}
                </motion.p>
            )}
        </div>
    );
};

export default LoadingScreen;
