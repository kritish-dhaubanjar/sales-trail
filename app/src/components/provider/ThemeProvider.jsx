'use client';
import React from 'react';
import PropTypes from 'prop-types';

import { createContext, useContext, useEffect, useState } from 'react';

const ThemeProviderContext = createContext({});

export function ThemeProvider({ children, defaultTheme = 'light', storageKey = 'vite-ui-theme' }) {
  const [theme, setTheme] = useState(defaultTheme);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
  };

  return <ThemeProviderContext.Provider value={value}>{children}</ThemeProviderContext.Provider>;
}

ThemeProvider.propTypes = {
  children: PropTypes.any,
  defaultTheme: PropTypes.string,
  storageKey: PropTypes.string,
};

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
