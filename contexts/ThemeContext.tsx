import React, { createContext, useContext } from 'react';
import { ColorPalette, useTheme } from '../hooks/useTheme';

const ThemeContext = createContext<ColorPalette | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const palette = useTheme();
  return (
    <ThemeContext.Provider value={palette}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useColors(): ColorPalette {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useColors must be used within ThemeProvider');
  return ctx;
}
