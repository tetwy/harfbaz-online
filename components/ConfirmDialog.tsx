import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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

const T = {
  bg: '#07090f',
  surface: '#0d1117',
  surface2: '#161b27',
  primary: '#8b5cf6',
  amber: '#fbbf24',
  red: '#f87171',
  text: '#e2e8f0',
  textMuted: '#94a3b8',
  border: 'rgba(255,255,255,0.06)',
};

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
    const variantConfig = {
        danger: {
            color: T.red,
            icon: 'report',
            bg: 'rgba(248,113,113,0.1)',
            btnBg: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
            shadow: 'rgba(239,68,68,0.3)',
        },
        warning: {
            color: T.amber,
            icon: 'warning',
            bg: 'rgba(251,191,36,0.1)',
            btnBg: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
            shadow: 'rgba(251,191,36,0.25)',
        },
        default: {
            color: T.primary,
            icon: 'info',
            bg: 'rgba(139,92,246,0.1)',
            btnBg: 'linear-gradient(135deg, #8b5cf6 0%, #5b21b6 100%)',
            shadow: 'rgba(139,92,246,0.3)',
        }
    };

    const cfg = variantConfig[variant];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        style={{
                          position: 'fixed', inset: 0, zIndex: 1000,
                          background: 'rgba(7,9,15,0.85)',
                          backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)'
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onCancel}
                    />

                    {/* Dialog Container */}
                    <div style={{
                      position: 'fixed', inset: 0, zIndex: 1001,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: 24, pointerEvents: 'none'
                    }}>
                      <motion.div
                          style={{
                              width: '100%', maxWidth: 400,
                              background: '#0d1117',
                              borderRadius: 24, overflow: 'hidden',
                              border: `1px solid ${T.border}`,
                              boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
                              pointerEvents: 'auto',
                              display: 'flex', flexDirection: 'column'
                          }}
                          initial={{ opacity: 0, scale: 0.9, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: 20 }}
                          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                          onClick={(e) => e.stopPropagation()}
                      >
                          {/* Content */}
                          <div style={{ padding: '32px 32px 24px', display: 'flex', gap: 20 }}>
                              <div style={{
                                width: 52, height: 52, borderRadius: 16, flexShrink: 0,
                                background: cfg.bg, border: `1px solid ${cfg.color}30`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: cfg.color
                              }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 28 }}>{cfg.icon}</span>
                              </div>
                              
                              <div style={{ flex: 1 }}>
                                <h3 style={{ 
                                  fontSize: 18, fontWeight: 900, color: '#fff', 
                                  margin: '0 0 8px', letterSpacing: '-0.02em' 
                                }}>{title}</h3>
                                <p style={{ 
                                  fontSize: 14, color: T.textMuted, 
                                  margin: 0, lineHeight: 1.6, fontWeight: 500 
                                }}>{message}</p>
                              </div>
                          </div>

                          {/* Footer Actions */}
                          <div style={{ 
                            padding: '0 24px 24px', display: 'flex', gap: 12 
                          }}>
                              <button
                                  onClick={onCancel}
                                  style={{
                                    flex: 1, height: 48, borderRadius: 14,
                                    background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}`,
                                    color: T.textMuted, fontSize: 14, fontWeight: 700,
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    gap: 8, transition: 'all 0.2s'
                                  }}
                                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; }}
                                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = T.textMuted; }}
                              >
                                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                                  {cancelText}
                              </button>
                              
                              <button
                                  onClick={onConfirm}
                                  style={{
                                    flex: 1, height: 48, borderRadius: 14,
                                    background: cfg.btnBg, border: 'none',
                                    color: variant === 'warning' ? '#1c1200' : '#fff', 
                                    fontSize: 14, fontWeight: 900,
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    gap: 8, transition: 'all 0.2s',
                                    boxShadow: `0 8px 20px ${cfg.shadow}`
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                              >
                                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check</span>
                                  {confirmText}
                              </button>
                          </div>
                      </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ConfirmDialog;
