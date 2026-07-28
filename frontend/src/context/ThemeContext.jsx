import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

// Pages that must always render in light mode regardless of user preference
const LIGHT_MODE_ONLY_PATHS = ["/my_admin_panel", "/"];

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    const savedTheme = localStorage.getItem("app-theme");
    return savedTheme ? savedTheme : "light";
  });

  const applyTheme = (currentTheme) => {
    const path = window.location.pathname;

    // Force light mode on specific pages (landing page & admin panel)
    const isLightModeOnly =
      LIGHT_MODE_ONLY_PATHS.some((p) =>
        p === "/" ? path === "/" : path.startsWith(p)
      );

    if (isLightModeOnly) {
      document.documentElement.setAttribute("data-theme", "light");
      document.documentElement.classList.remove("dark", "dark-theme");
      document.body.classList.remove("dark", "dark-theme");
      return;
    }

    document.documentElement.setAttribute("data-theme", currentTheme);
    if (currentTheme === "dark") {
      document.documentElement.classList.add("dark", "dark-theme");
      document.body.classList.add("dark", "dark-theme");
    } else {
      document.documentElement.classList.remove("dark", "dark-theme");
      document.body.classList.remove("dark", "dark-theme");
    }
  };

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem("app-theme", theme);
  }, [theme]);

  // Re-apply theme on every client-side navigation (popstate / pushstate)
  useEffect(() => {
    const handleRouteChange = () => applyTheme(theme);

    window.addEventListener("popstate", handleRouteChange);

    // Patch history methods so pushState/replaceState also trigger the check
    const origPush = window.history.pushState.bind(window.history);
    const origReplace = window.history.replaceState.bind(window.history);

    window.history.pushState = (...args) => {
      origPush(...args);
      handleRouteChange();
    };
    window.history.replaceState = (...args) => {
      origReplace(...args);
      handleRouteChange();
    };

    return () => {
      window.removeEventListener("popstate", handleRouteChange);
      window.history.pushState = origPush;
      window.history.replaceState = origReplace;
    };
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
