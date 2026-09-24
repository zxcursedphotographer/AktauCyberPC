"use client";
import { Sun, Moon } from "lucide-react";
export default function ThemeToggle() {
  const toggle = () => {
    const dark = document.documentElement.classList.toggle("dark");
    try { localStorage.setItem("theme", dark ? "dark" : "light"); } catch {}
  };
  return <button onClick={toggle} aria-label="Сменить тему" className="p-2 rounded-lg hover:bg-white/10"><Sun className="hidden dark:block" size={18} /><Moon className="dark:hidden" size={18} /></button>;
}
