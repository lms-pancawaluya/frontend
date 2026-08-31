"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type ThemeMode = "light" | "dark" | "system";
type LanguageMode = "id" | "en";

interface AppContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  language: LanguageMode;
  setLanguage: (lang: LanguageMode) => void;
  t: (idText: string, enText: string) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("light");
  const [language, setLanguageState] = useState<LanguageMode>("id");

  const applyTheme = (mode: ThemeMode) => {
    const root = document.documentElement;
    if (
      mode === "dark" ||
      (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  useEffect(() => {
    const savedTheme = (localStorage.getItem("theme") as ThemeMode) || "light";
    const savedLang = (localStorage.getItem("lang") as LanguageMode) || "id";

    queueMicrotask(() => {
      setThemeState(savedTheme);
      setLanguageState(savedLang);
    });
    applyTheme(savedTheme);
  }, []);

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    localStorage.setItem("theme", mode);
    applyTheme(mode);
  };

  const setLanguage = (lang: LanguageMode) => {
    setLanguageState(lang);
    localStorage.setItem("lang", lang);
  };

  const t = (idText: string, enText: string) => {
    return language === "en" ? enText : idText;
  };

  return (
    <AppContext.Provider value={{ theme, setTheme, language, setLanguage, t }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
