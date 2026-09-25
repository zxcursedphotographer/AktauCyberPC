import Link from "next/link";
import { resetPassword } from "@/app/actions";

export const metadata = { title: "Новый пароль" };

export default function Reset({ searchParams: p }) {
  return (
    <form action={resetPassword} className="card mx-auto max-w-sm space-y-3">
      <h1 className="text-xl font-bold">Новый пароль</h1>
      <input type="hidden" name="token" value={p.token || ""} />
      <input
        name="password"
        type="password"
        required
        minLength={8}
        placeholder="Новый пароль (от 8 символов)"
        className="input"
        autoComplete="new-password"
      />
      {p.e && (
        <p role="alert" className="rounded-lg border border-hot/40 bg-hot/10 p-2 text-sm text-hot">
          Ссылка устарела или пароль слишком короткий.
        </p>
      )}
      <button className="btn w-full justify-center">Сохранить пароль</button>
      <Link href="/login" className="block text-center text-sm underline opacity-70">
        Вернуться ко входу
      </Link>
    </form>
  );
}