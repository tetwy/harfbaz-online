import React from 'react';
import { motion } from 'framer-motion';

type LoadingVariant = 'game' | 'waiting' | 'voting' | 'scoreboard' | 'default';

interface LoadingScreenProps {
    variant?: LoadingVariant;
    message?: string;
}

// Shimmer animation config
const shimmerStyle = {
    background: 'linear-gradient(90deg, #1a1a2e 0%, #2a2a4e 50%, #1a1a2e 100%)',
    backgroundSize: '200% 100%',
};

const shimmerAnimation = {
    animate: { backgroundPosition: ['200% 0', '-200% 0'] },
    transition: { duration: 1.5, repeat: Infinity, ease: 'linear' as const },
};

// Skeleton box component
const SkeletonBox: React.FC<{ className?: string; delay?: number }> = ({ className, delay = 0 }) => (
    <motion.div
        className={`rounded-xl ${className}`}
        style={shimmerStyle}
        animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', delay }}
    />
);

// WaitingRoom Skeleton
const WaitingRoomSkeleton = () => (
    <div className="flex flex-col lg:flex-row h-full">
        {/* Left Panel */}
        <div className="w-full lg:w-[400px] p-6 space-y-6">
            <SkeletonBox className="h-8 w-48" />
            <SkeletonBox className="h-24 w-full" />
            <div className="space-y-4">
                <SkeletonBox className="h-6 w-32" />
                <SkeletonBox className="h-12 w-full" />
                <SkeletonBox className="h-12 w-full" delay={0.1} />
                <SkeletonBox className="h-12 w-full" delay={0.2} />
            </div>
        </div>
        {/* Right Panel - Players */}
        <div className="flex-1 p-6">
            <SkeletonBox className="h-8 w-32 mb-6" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                    <SkeletonBox key={i} className="h-32" delay={i * 0.05} />
                ))}
            </div>
        </div>
    </div>
);

// GamePhase Skeleton
const GamePhaseSkeleton = () => (
    <div className="max-w-2xl mx-auto w-full p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
            <SkeletonBox className="w-16 h-16 rounded-2xl" />
            <div className="flex-1 space-y-2">
                <SkeletonBox className="h-4 w-24" />
                <SkeletonBox className="h-3 w-full" />
            </div>
        </div>
        {/* Category Cards */}
        <div className="grid grid-cols-2 gap-3">
            {[...Array(8)].map((_, i) => (
                <SkeletonBox key={i} className="h-24" delay={i * 0.08} />
            ))}
        </div>
        {/* Submit Button */}
        <SkeletonBox className="h-14 w-full rounded-2xl" style={{ background: 'linear-gradient(90deg, #2d1f4e 0%, #3d2a6e 50%, #2d1f4e 100%)' }} />
    </div>
);

// VotingPhase Skeleton
const VotingPhaseSkeleton = () => (
    <div className="max-w-2xl mx-auto w-full p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
            <SkeletonBox className="w-14 h-14 rounded-xl" />
            <div className="flex-1 space-y-2">
                <SkeletonBox className="h-8 w-32" />
                <div className="flex gap-1">
                    {[...Array(8)].map((_, i) => (
                        <SkeletonBox key={i} className="h-1 flex-1" delay={i * 0.05} />
                    ))}
                </div>
            </div>
        </div>
        {/* Player Cards */}
        <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
                <SkeletonBox key={i} className="h-20" delay={i * 0.1} />
            ))}
        </div>
        {/* Next Button */}
        <SkeletonBox className="h-12 w-full rounded-xl" />
    </div>
);

// Scoreboard Skeleton
const ScoreboardSkeleton = () => (
    <div className="max-w-md mx-auto w-full p-6 flex flex-col items-center justify-center h-full space-y-8">
        {/* Trophy/Title */}
        <SkeletonBox className="w-20 h-20 rounded-full" />
        <SkeletonBox className="h-8 w-48" />
        {/* Player Scores */}
        <div className="w-full space-y-3">
            {[...Array(5)].map((_, i) => (
                <SkeletonBox key={i} className="h-16 w-full" delay={i * 0.1} />
            ))}
        </div>
        {/* Buttons */}
        <div className="flex gap-3 w-full">
            <SkeletonBox className="h-12 flex-1" />
            <SkeletonBox className="h-12 flex-1" delay={0.1} />
        </div>
    </div>
);

// Default Skeleton
const DefaultSkeleton = () => (
    <div className="flex items-center justify-center h-full">
        <div className="space-y-4 w-64">
            <SkeletonBox className="h-16 w-16 mx-auto rounded-2xl" />
            <SkeletonBox className="h-4 w-full" />
            <SkeletonBox className="h-4 w-3/4 mx-auto" />
        </div>
    </div>
);

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ variant = 'default', message }) => {
    const renderSkeleton = () => {
        switch (variant) {
            case 'waiting': return <WaitingRoomSkeleton />;
            case 'game': return <GamePhaseSkeleton />;
            case 'voting': return <VotingPhaseSkeleton />;
            case 'scoreboard': return <ScoreboardSkeleton />;
            default: return <DefaultSkeleton />;
        }
    };

    return (
        <div className="h-screen w-screen fixed inset-0 bg-[#0a0a1a] flex flex-col overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-[#0a0a1a] to-pink-900/15" />

            {/* Skeleton Content */}
            <div className="relative z-10 flex-1 flex flex-col">
                {renderSkeleton()}
            </div>

            {/* Optional message */}
            {message && (
                <motion.p
                    className="absolute bottom-8 left-0 right-0 text-center text-slate-500 text-sm"
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
