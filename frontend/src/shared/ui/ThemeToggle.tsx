import { useTheme } from "@/app/providers/ThemeProvider";
import type { MouseEvent } from "react";

type ThemeToggleProps = {
  className?: string;
};

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="themeToggleIcon">
      <circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 2.75v2.5M12 18.75v2.5M21.25 12h-2.5M5.25 12h-2.5M18.54 5.46l-1.77 1.77M7.23 16.77l-1.77 1.77M18.54 18.54l-1.77-1.77M7.23 7.23L5.46 5.46"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="themeToggleIcon">
      <path
        d="M14.5 2.75a8.85 8.85 0 1 0 6.75 14.59A9.35 9.35 0 0 1 14.5 2.75Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const classes = ["themeToggle", className].filter(Boolean).join(" ");

  function runThemeWave(event: MouseEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const root = document.documentElement;
    root.style.setProperty("--theme-wave-x", `${x}px`);
    root.style.setProperty("--theme-wave-y", `${y}px`);
    document.body.classList.remove("theme-wave-active");
    void document.body.offsetWidth;
    document.body.classList.add("theme-wave-active");
    window.setTimeout(() => {
      document.body.classList.remove("theme-wave-active");
    }, 850);
  }

  return (
    <button
      type="button"
      className={classes}
      onClick={(event) => {
        runThemeWave(event);
        toggleTheme();
      }}
      aria-label={theme === "dark" ? "Переключить на светлую тему" : "Переключить на тёмную тему"}
      title={theme === "dark" ? "Светлая тема" : "Тёмная тема"}
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
