import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Check } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    variant?: 'danger' | 'warning' | 'default';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    title,
    message,
    confirmText = 'Tamam',
    cancelText = 'İptal',
    onConfirm,
    onCancel,
    variant = 'danger'
}) => {
    const variantClasses = {
        danger: {
            icon: 'text-red-400',
            iconBg: 'bg-red-500/10',
            confirmBtn: 'bg-red-500 hover:bg-red-600 text-white'
        },
        warning: {
            icon: 'text-yellow-400',
            iconBg: 'bg-yellow-500/10',
            confirmBtn: 'bg-yellow-500 hover:bg-yellow-600 text-black'
        },
        default: {
            icon: 'text-purple-400',
            iconBg: 'bg-purple-500/10',
            confirmBtn: 'bg-purple-500 hover:bg-purple-600 text-white'
        }
    };

    const styles = variantClasses[variant];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onCancel}
                    />

                    {/* Dialog */}
                    <motion.div
                        className="fixed inset-0 flex items-center justify-center z-[101] p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-[#12121f] border border-white/10 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="p-5">
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-xl ${styles.iconBg}`}>
                                        <AlertTriangle size={24} className={styles.icon} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
                                        <p className="text-sm text-slate-400">{message}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 p-4 pt-0">
                                <button
                                    onClick={onCancel}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-medium hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                                >
                                    <X size={16} />
                                    {cancelText}
                                </button>
                                <button
                                    onClick={onConfirm}
                                    className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${styles.confirmBtn}`}
                                >
                                    <Check size={16} />
                                    {confirmText}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ConfirmDialog;
