import Link from "next/link";
import { requestReset } from "@/app/actions";

export const metadata = { title: "Сброс пароля" };

export default function Forgot({ searchParams: p }) {
  return (
    <div className="card mx-auto max-w-sm space-y-3">
      <h1 className="text-xl font-bold">Сброс пароля</h1>

      {p.sent ? (
        <>
          <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400">
            Если такая почта зарегистрирована, мы отправили на неё ссылку.
            Проверьте и папку «Спам».
          </p>
          <Link href="/login" className="btn w-full justify-center">
            Вернуться ко входу
          </Link>
        </>
      ) : (
        <form action={requestReset} className="space-y-3">
          <input name="email" type="email" required placeholder="Почта аккаунта" className="input" autoComplete="email" />
          <button className="btn w-full justify-center">Отправить ссылку</button>
          <Link href="/login" className="block text-center text-sm underline opacity-70">
            Вернуться ко входу
          </Link>
        </form>
      )}
    </div>
  );
}