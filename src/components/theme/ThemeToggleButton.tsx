'use client';

import { useSyncExternalStore } from 'react';
import { MoonIcon, SunIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

interface ThemeToggleButtonProps {
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export default function ThemeToggleButton({ size = 'sm' }: ThemeToggleButtonProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const isDarkTheme = (resolvedTheme ?? theme) === 'dark';
  const label = mounted
    ? (isDarkTheme ? 'Switch to light mode' : 'Switch to dark mode')
    : 'Toggle theme';

  return (
    <Button
      type="button"
      size={size}
      variant="ghost"
      onClick={() => setTheme(isDarkTheme ? 'light' : 'dark')}
      title={label}
      aria-label={label}
    >
      {mounted ? (isDarkTheme ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />) : <MoonIcon className="w-4 h-4" />}
    </Button>
  );
}
