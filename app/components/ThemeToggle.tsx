'use client';

import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import ThemeButton from './ThemeButton';

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <ThemeButton 
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      isDark={theme === 'dark'}
    />
  );
} 