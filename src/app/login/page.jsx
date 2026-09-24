"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useFormState } from "react-dom";
import { login, register } from "@/app/actions";

export default function LoginPage() {
  const [mode, setMode] = useState("login");
  const [ls, la] = useFormState(login, null);
  const [rs, ra] = useFormState(register, null);
  const [n, setN] = useState(null);
  useEffect(() => setN([1 + Math.floor(Math.random() * 9), 1 + Math.floor(Math.random() * 9)]), []);
  if (!n) return null;
  const isL = mode === "login", state = isL ? ls : rs;
  return (
    <form action={isL ? la : ra} className="card mx-auto max-w-sm space-y-3">
      <h1 className="text-xl font-bold">{isL ? "Вход" : "Регистрация"}</h1>
      <input name="email" type="email" required placeholder="Почта" className="input" />
      {!isL && <>
        <input name="username" required placeholder="Ник" className="input" />
        <input name="city" defaultValue="Актау" placeholder="Город" className="input" />
        <input name="district" placeholder="Микрорайон (без улицы и дома)" className="input" /></>}
      <input name="password" type="password" required placeholder="Пароль" className="input" />
      <input type="hidden" name="a" value={n[0]} /><input type="hidden" name="b" value={n[1]} />
      <label className="block text-sm">Сколько будет {n[0]} + {n[1]}?<input name="answer" type="number" required className="input mt-1" /></label>
      {isL && <Link href="/forgot" className="block text-sm underline">Забыли пароль?</Link>}
      {state?.error && <p role="alert" className="text-sm text-hot">{state.error}</p>}
      <button className="btn w-full justify-center">{isL ? "Войти" : "Создать аккаунт"}</button>
      <button type="button" className="text-sm underline" onClick={() => setMode(isL ? "register" : "login")}>{isL ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}</button>
    </form>
  );
}
