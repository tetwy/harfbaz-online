import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

// Animation variants
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 }
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Button Component
interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  className = '',
  icon,
  disabled,
  ...props
}) => {
  const baseStyles = `
    relative inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold
    transition-all duration-300 overflow-hidden
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900
  `;

  const variants = {
    primary: `
      bg-gradient-to-r from-brand-600 via-brand-500 to-purple-500
      hover:from-brand-500 hover:via-brand-400 hover:to-purple-400
      text-white shadow-lg shadow-brand-500/30
      hover:shadow-brand-500/50 hover:shadow-xl
      focus:ring-brand-500
      btn-shine
    `,
    secondary: `
      bg-slate-800/80 hover:bg-slate-700/80 text-slate-100
      border border-slate-700 hover:border-slate-600
      backdrop-blur-sm
      focus:ring-slate-500
    `,
    danger: `
      bg-gradient-to-r from-red-600 to-red-500
      hover:from-red-500 hover:to-red-400
      text-white shadow-lg shadow-red-500/30
      focus:ring-red-500
    `,
    ghost: `
      bg-transparent hover:bg-white/5 text-slate-300 hover:text-white
      focus:ring-slate-500
    `
  };

  return (
    <motion.button
      type="button"
      className={`${baseStyles} ${variants[variant]} ${className}`}
      whileHover={disabled ? {} : { scale: 1.02, y: -2 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      disabled={disabled}
      {...props}
    >
      {/* Shimmer effect */}
      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shimmer" />

      {/* Content */}
      <span className="relative z-10 flex items-center gap-2">
        {icon}
        {children}
      </span>
    </motion.button>
  );
};

// Input Component
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, icon, className = '', ...props }) => {
  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {label && (
        <label className="block text-sm font-medium text-slate-400 mb-2 ml-1">
          {label}
        </label>
      )}
      <div className="relative group">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-400 transition-colors">
            {icon}
          </div>
        )}
        <input
          className={`
            w-full bg-slate-900/50 
            border-2 border-slate-700/50 
            focus:border-brand-500 focus:bg-slate-900/80
            rounded-xl px-4 py-3.5 
            ${icon ? 'pl-12' : ''}
            text-white placeholder-slate-500 
            transition-all duration-300 
            outline-none
            focus:ring-4 focus:ring-brand-500/20
            backdrop-blur-sm
            ${className}
          `}
          {...props}
        />
        {/* Animated border glow */}
        <div className="absolute inset-0 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-brand-500/20 via-purple-500/20 to-pink-500/20 blur-sm" />
        </div>
      </div>
    </motion.div>
  );
};

// Card Component
interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'interactive';
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  hover = false
}) => {
  const variants = {
    default: 'bg-slate-800/60 border-slate-700/50',
    glass: 'glass border-white/10',
    interactive: 'bg-slate-800/40 border-slate-700/50 card-interactive'
  };

  return (
    <motion.div
      className={`
        backdrop-blur-xl border rounded-2xl p-6 
        ${variants[variant]}
        ${className}
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hover ? { scale: 1.02, y: -4 } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {children}
    </motion.div>
  );
};

// Badge Component
interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  pulse?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  color = "bg-slate-700",
  pulse = false
}) => (
  <motion.span
    className={`
      px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white
      ${color}
      ${pulse ? 'animate-pulse-glow' : ''}
    `}
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    transition={{ type: "spring", stiffness: 500, damping: 25 }}
  >
    {children}
  </motion.span>
);

// Animated Container for page transitions
export const AnimatedContainer: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ''
}) => (
  <motion.div
    className={className}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
);

// Floating element wrapper
export const FloatingElement: React.FC<{ children: React.ReactNode; delay?: number }> = ({
  children,
  delay = 0
}) => (
  <motion.div
    animate={{ y: [0, -10, 0] }}
    transition={{
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
      delay
    }}
  >
    {children}
  </motion.div>
);
