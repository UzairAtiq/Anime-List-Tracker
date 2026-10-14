/** @fileoverview Manages application theme state, CSS variable synchronization, and local storage persistence. */

import { createContext, useContext, useState, useEffect } from 'react';
import { themes } from '../config/themes.config';

/**
 * Resolves a theme object by its key, defaulting to theme1.
 *
 * Steps:
 * 1. Look up the given key in the themes registry.
 * 2. Return the matching theme, or fallback to theme1 if not found.
 *
 * @param {string} key - Theme key identifier.
 * @returns {{ name: string, key: string, bg: string, textColor: string, borderColor: string }} Resolved theme.
 */
export const getTheme = (key) => {
  return themes[key] || themes.theme1;
};

/**
 * Retrieves the user's previously saved theme from localStorage, or defaults to theme1.
 *
 * Steps:
 * 1. Read 'retroTheme' key from window.localStorage.
 * 2. Verify whether the saved key exists in the themes configuration.
 * 3. Return the stored theme if valid, or fallback to theme1.
 *
 * @returns {{ name: string, key: string, bg: string, textColor: string, borderColor: string }} Default theme.
 */
export const getDefaultTheme = () => {
  try {
    const saved = localStorage.getItem('retroTheme');
    return saved && themes[saved] ? themes[saved] : themes.theme1;
  } catch {
    return themes.theme1;
  }
};

const ThemeContext = createContext(null);

/**
 * React context provider component that distributes the active theme and handles CSS variable injection.
 *
 * Steps:
 * 1. Initialize state with the default or saved theme.
 * 2. In a side effect, inject CSS custom properties (--theme-bg, --theme-text, --theme-border) onto document root.
 * 3. Save the active theme key to localStorage.
 * 4. Render children within the ThemeContext.Provider.
 *
 * @param {Object} props - Component properties.
 * @param {React.ReactNode} props.children - Child elements to wrap with theme context.
 * @returns {JSX.Element} Context provider element.
 */
export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(() => getDefaultTheme());

  useEffect(() => {
    document.documentElement.style.setProperty('--theme-bg', currentTheme.bg);
    document.documentElement.style.setProperty('--theme-text', currentTheme.textColor);
    document.documentElement.style.setProperty('--theme-border', currentTheme.borderColor);

    try {
      localStorage.setItem('retroTheme', currentTheme.key);
    } catch (err) {
      console.warn('[ThemeProvider] Could not persist theme:', err);
    }
  }, [currentTheme]);

  /**
   * Switches the active theme by key.
   *
   * Steps:
   * 1. Look up theme configuration for the requested key.
   * 2. If valid, update the currentTheme state.
   *
   * @param {string} themeKey - Key of the target theme.
   */
  const changeTheme = (themeKey) => {
    const theme = getTheme(themeKey);
    if (theme) {
      setCurrentTheme(theme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme: currentTheme, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Custom hook to access the active theme and theme changer function.
 *
 * Steps:
 * 1. Retrieve the ThemeContext value.
 * 2. Throw an error if called outside a ThemeProvider.
 * 3. Return the theme context value.
 *
 * @returns {{ theme: Object, changeTheme: (key: string) => void }} Theme context object.
 * @throws {Error} When invoked outside ThemeProvider.
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
