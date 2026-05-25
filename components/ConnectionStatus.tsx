import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface ConnectionStatusProps {
    isConnected: boolean;
    isReconnecting?: boolean;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
    isConnected,
    isReconnecting = false
}) => {
    const [showConnected, setShowConnected] = useState(false);
    const [wasDisconnected, setWasDisconnected] = useState(false);

    useEffect(() => {
        if (!isConnected) {
            setWasDisconnected(true);
        } else if (wasDisconnected) {
            // Tekrar bağlandığında kısa süre göster
            setShowConnected(true);
            const timer = setTimeout(() => {
                setShowConnected(false);
                setWasDisconnected(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isConnected, wasDisconnected]);

    // Bağlantı kopmuşsa veya yeniden bağlanıyorsa göster
    const shouldShow = !isConnected || isReconnecting || showConnected;

    return (
        <AnimatePresence>
            {shouldShow && (
                <motion.div
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                    className="fixed top-0 left-0 right-0 z-[200] flex justify-center p-2"
                >
                    <motion.div
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium shadow-lg ${!isConnected
                                ? 'bg-red-500/90 text-white'
                                : isReconnecting
                                    ? 'bg-yellow-500/90 text-black'
                                    : 'bg-green-500/90 text-white'
                            }`}
                        animate={isReconnecting ? { scale: [1, 1.02, 1] } : {}}
                        transition={{ duration: 1, repeat: isReconnecting ? Infinity : 0 }}
                    >
                        {!isConnected ? (
                            <>
                                <WifiOff size={16} />
                                <span>Bağlantı Kesildi</span>
                            </>
                        ) : isReconnecting ? (
                            <>
                                <RefreshCw size={16} className="animate-spin" />
                                <span>Yeniden Bağlanıyor...</span>
                            </>
                        ) : (
                            <>
                                <Wifi size={16} />
                                <span>Bağlantı Kuruldu</span>
                            </>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ConnectionStatus;
