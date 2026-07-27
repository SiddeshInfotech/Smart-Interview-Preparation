import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    const savedTheme = localStorage.getItem("app-theme");
    return savedTheme ? savedTheme : "light";
  });

  useEffect(() => {
    const path = window.location.pathname;

    // Admin panel is strictly light theme as requested
    if (path.startsWith("/my_admin_panel")) {
      document.documentElement.setAttribute("data-theme", "light");
      document.documentElement.classList.remove("dark", "dark-theme");
      document.body.classList.remove("dark", "dark-theme");
      return;
    }

    document.documentElement.setAttribute("data-theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark", "dark-theme");
      document.body.classList.add("dark", "dark-theme");
    } else {
      document.documentElement.classList.remove("dark", "dark-theme");
      document.body.classList.remove("dark", "dark-theme");
    }

    localStorage.setItem("app-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  const setTheme = (newTheme) => {
    if (newTheme === "light" || newTheme === "dark") {
      setThemeState(newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
