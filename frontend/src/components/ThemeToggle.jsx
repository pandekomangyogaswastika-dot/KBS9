import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { motion } from 'framer-motion';

export function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      data-testid="theme-toggle-button"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`kti-focus relative flex items-center justify-center w-10 h-10 rounded-full border border-white/10 hover:bg-white/[0.06] transition-colors ${className}`}
    >
      <motion.div
        initial={false}
        animate={{
          scale: isDark ? 1 : 0,
          opacity: isDark ? 1 : 0,
          rotate: isDark ? 0 : 90,
        }}
        transition={{ duration: 0.2 }}
        className="absolute"
      >
        <Moon className="w-5 h-5" style={{ color: 'var(--kti-teal)' }} />
      </motion.div>
      <motion.div
        initial={false}
        animate={{
          scale: isDark ? 0 : 1,
          opacity: isDark ? 0 : 1,
          rotate: isDark ? -90 : 0,
        }}
        transition={{ duration: 0.2 }}
        className="absolute"
      >
        <Sun className="w-5 h-5" style={{ color: 'var(--kti-indigo)' }} />
      </motion.div>
    </button>
  );
}
