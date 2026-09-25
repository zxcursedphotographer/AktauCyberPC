"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useFormState } from "react-dom";
import { login, register } from "@/app/actions";
import { CITIES } from "@/lib/constants";

export default function LoginPage() {
  const [mode, setMode] = useState("login");
  const [ls, la] = useFormState(login, null);
  const [rs, ra] = useFormState(register, null);
  const [n, setN] = useState(null);

  useEffect(() => {
    // Берём капчу из sessionStorage, чтобы не сбрасывалась при ошибке
    let saved = null;
    try {
      saved = JSON.parse(sessionStorage.getItem("captcha") || "null");
    } catch {}
    if (!saved || Date.now() - saved.t > 3600e3) {
      saved = {
        a: 1 + Math.floor(Math.random() * 9),
        b: 1 + Math.floor(Math.random() * 9),
        t: Date.now(),
      };
      sessionStorage.setItem("captcha", JSON.stringify(saved));
    }
    setN(saved);
  }, []);

  if (!n) return null;

  const isL = mode === "login";
  const state = isL ? ls : rs;

  return (
    <form action={isL ? la : ra} className="card mx-auto max-w-sm space-y-3">
      <h1 className="text-xl font-bold">{isL ? "Вход" : "Регистрация"}</h1>

      <input name="email" type="email" required placeholder="Почта" className="input" autoComplete="email" />

      {!isL && (
        <>
          <input name="username" required placeholder="Ник" className="input" minLength={3} maxLength={20} autoComplete="username" />

          <select name="city" defaultValue="Актау" className="input cursor-pointer">
            {CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <input name="district" placeholder="Микрорайон (без улицы и дома)" className="input" maxLength={100} />
        </>
      )}

      <input
        name="password"
        type="password"
        required
        minLength={isL ? undefined : 8}
        placeholder={isL ? "Пароль" : "Пароль (от 8 символов)"}
        className="input"
        autoComplete={isL ? "current-password" : "new-password"}
      />

      <input type="hidden" name="a" value={n.a} />
      <input type="hidden" name="b" value={n.b} />
      <label className="block text-sm">
        Сколько будет {n.a} + {n.b}?
        <input name="answer" type="number" required className="input mt-1" inputMode="numeric" />
      </label>

      {isL && (
        <Link href="/forgot" className="block text-sm underline opacity-70 hover:opacity-100">
          Забыли пароль?
        </Link>
      )}

      {state?.error && (
        <p role="alert" className="rounded-lg border border-hot/40 bg-hot/10 p-2 text-sm text-hot">
          {state.error}
        </p>
      )}

      <button className="btn w-full justify-center">
        {isL ? "Войти" : "Создать аккаунт"}
      </button>

      <button
        type="button"
        className="w-full text-sm underline opacity-70 hover:opacity-100"
        onClick={() => setMode(isL ? "register" : "login")}
      >
        {isL ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}
      </button>
    </form>
  );
}