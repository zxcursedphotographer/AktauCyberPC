import { resetPassword } from "@/app/actions";
export default function Reset({ searchParams: p }) {
  return (
    <form action={resetPassword} className="card mx-auto max-w-sm space-y-3">
      <h1 className="text-xl font-bold">Новый пароль</h1>
      <input type="hidden" name="token" value={p.token || ""} />
      <input name="password" type="password" required minLength={8} placeholder="Новый пароль (от 8 символов)" className="input" />
      {p.e && <p role="alert" className="text-sm text-hot">Ссылка устарела или пароль слишком короткий.</p>}
      <button className="btn w-full justify-center">Сохранить пароль</button>
    </form>
  );
}
