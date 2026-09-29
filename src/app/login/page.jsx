"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { login, register, newCaptcha } from "@/app/actions";
import { CITIES } from "@/lib/constants";

function Submit({ children }) {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className="btn w-full justify-center disabled:opacity-60">
      {pending ? "Подождите…" : children}
    </button>
  );
}

export default function LoginPage() {
  const [mode, setMode] = useState("login");
  const [ls, la] = useFormState(login, null);
  const [rs, ra] = useFormState(register, null);
  const [cap, setCap] = useState(null);

  // Капча подписывается сервером — подделать числа на клиенте нельзя
  useEffect(() => {
    let alive = true;
    newCaptcha().then((c) => alive && setCap(c)).catch(() => {});
    return () => { alive = false; };
  }, []);

  // После ошибки ответ на капчу уже потрачен — берём новую пару чисел
  const errText = (mode === "login" ? ls : rs)?.error;
  useEffect(() => {
    if (!errText) return;
    newCaptcha().then(setCap).catch(() => {});
  }, [errText, ls, rs]);

  const isL = mode === "login";
  const state = isL ? ls : rs;

  return (
    <form action={isL ? la : ra} className="card mx-auto max-w-sm space-y-3">
      <h1 className="text-xl font-bold">{isL ? "Вход" : "Регистрация"}</h1>

      <input name="email" type="email" required placeholder="Почта" className="input" autoComplete="email" />

      {!isL && (
        <>
          <div>
            <input
              name="username"
              required
              placeholder="Ник (латиница, цифры, _)"
              className="input"
              minLength={3}
              maxLength={20}
              pattern="[A-Za-z0-9_]{3,20}"
              title="3–20 символов: латиница, цифры и _"
              autoComplete="username"
            />
          </div>

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

      {cap && (
        <>
          <input type="hidden" name="a" value={cap.a} />
          <input type="hidden" name="b" value={cap.b} />
          <input type="hidden" name="t" value={cap.t} />
          <input type="hidden" name="sig" value={cap.sig} />
        </>
      )}
      <label className="block text-sm">
        {cap ? `Сколько будет ${cap.a} + ${cap.b}?` : "Загружаем проверку…"}
        <input name="answer" type="number" required disabled={!cap} className="input mt-1" inputMode="numeric" />
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

      <Submit>{isL ? "Войти" : "Создать аккаунт"}</Submit>

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
