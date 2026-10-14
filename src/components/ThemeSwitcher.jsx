import { motion } from 'framer-motion';
import { Button } from 'pixel-retroui';
import { useTheme } from '../context/ThemeContext';
import { themes } from '../config/themes.config';

export default function ThemeSwitcher() {
  const { theme, changeTheme } = useTheme();

  return (
    <motion.div 
      className="flex items-center gap-2 flex-wrap"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
    >
      <motion.span 
        className="text-xs uppercase tracking-wide font-black"
        style={{ color: theme.textColor }}
        whileHover={{ scale: 1.1 }}
      >
        🎨 Theme
      </motion.span>
      <div className="flex gap-2 flex-wrap">
        {Object.values(themes).map((themeOption, index) => {
          const isActive = theme.key === themeOption.key;
          return (
            <motion.div
              key={themeOption.key}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + index * 0.1, type: "spring", stiffness: 200 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Button
                onClick={() => changeTheme(themeOption.key)}
                bg={isActive ? themeOption.textColor : themeOption.bg}
                textColor={isActive ? themeOption.bg : themeOption.textColor}
                borderColor={themeOption.borderColor}
                shadow={isActive ? themeOption.borderColor : undefined}
                className="px-3 py-1.5 text-xs uppercase tracking-wide font-black border-2"
              >
                <motion.span
                  animate={isActive ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  {isActive && '✓ '}
                  {themeOption.key.toUpperCase().replace('THEME', '')}
                </motion.span>
              </Button>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
