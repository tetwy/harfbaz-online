import { useState, useEffect } from 'react';

export interface ColorPalette {
  primary:      string;
  primaryLight: string;
  primaryMid:   string;
  amber:        string;
  amberLight:   string;
  emerald:      string;
  emeraldLight: string;
  emeraldBg:    string;
  error:        string;
  errorLight:   string;
  bg:           string;
  surface:      string;
  surfaceLow:   string;
  surfaceMid:   string;
  surfaceHigh:  string;
  onSurface:    string;
  onSurfaceVar: string;
  outline:      string;
  outlineVar:   string;
  isDark:       boolean;
}

const light: ColorPalette = {
  primary:      '#4648d4',
  primaryLight: '#e1e0ff',
  primaryMid:   '#6063ee',
  amber:        '#fea619',
  amberLight:   '#ffddb8',
  emerald:      '#059669',
  emeraldLight: '#d1fae5',
  emeraldBg:    '#00885d',
  error:        '#ba1a1a',
  errorLight:   '#ffdad6',
  bg:           '#f7f9fb',
  surface:      '#ffffff',
  surfaceLow:   '#f2f4f6',
  surfaceMid:   '#eceef0',
  surfaceHigh:  '#e6e8ea',
  onSurface:    '#191c1e',
  onSurfaceVar: '#464554',
  outline:      '#767586',
  outlineVar:   '#c7c4d7',
  isDark:       false,
};

const dark: ColorPalette = {
  primary:      '#a8aaff',
  primaryLight: '#1e1e4a',
  primaryMid:   '#7b7eff',
  amber:        '#ffb951',
  amberLight:   '#3d2800',
  emerald:      '#4edea3',
  emeraldLight: '#002f1e',
  emeraldBg:    '#00a870',
  error:        '#ffb4ab',
  errorLight:   '#3d0006',
  bg:           '#0f0f13',
  surface:      '#18181f',
  surfaceLow:   '#13131a',
  surfaceMid:   '#1e1e27',
  surfaceHigh:  '#252530',
  onSurface:    '#e8e6f0',
  onSurfaceVar: '#c4c2d4',
  outline:      '#8f8da0',
  outlineVar:   '#3a3848',
  isDark:       true,
};

const mq = typeof window !== 'undefined'
  ? window.matchMedia('(prefers-color-scheme: dark)')
  : null;

export function useTheme(): ColorPalette {
  const [isDark, setIsDark] = useState<boolean>(() => mq?.matches ?? false);

  useEffect(() => {
    if (!mq) return;
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return isDark ? dark : light;
}

export { light, dark };
