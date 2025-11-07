import React, { createContext, useContext, useState, useEffect } from "react";

type Theme = "default" | "ocean" | "sunset" | "forest";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("gradient-theme");
        return (saved as Theme) || "default";
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error);
    }
    return "default";
  });

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("gradient-theme", theme);
      }
    } catch (error) {
      console.error("Error setting theme:", error);
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
