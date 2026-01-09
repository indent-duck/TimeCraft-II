import React, { createContext, useContext, useState } from 'react';

const themes = {
  blue: {
    primary: '#007AFF',
    headerBackground: '#007AFF',
    background: '#fff',
  },
  green: {
    primary: '#34C759',
    headerBackground: '#34C759',
    background: '#fff',
  },
  purple: {
    primary: '#AF52DE',
    headerBackground: '#AF52DE',
    background: '#fff',
  },
  orange: {
    primary: '#FF9500',
    headerBackground: '#FF9500',
    background: '#fff',
  },
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('blue');

  const theme = themes[currentTheme];

  return (
    <ThemeContext.Provider value={{ theme, currentTheme, setCurrentTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);