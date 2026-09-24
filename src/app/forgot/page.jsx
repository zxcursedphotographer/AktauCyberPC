import { requestReset } from "@/app/actions";
export default function Forgot({ searchParams: p }) {
  return (
    <form action={requestReset} className="card mx-auto max-w-sm space-y-3">
      <h1 className="text-xl font-bold">Сброс пароля</h1>
      {p.sent ? <p className="text-sm text-emerald-500">Если такая почта зарегистрирована, мы отправили на неё ссылку. Проверьте и папку «Спам».</p> : <>
        <input name="email" type="email" required placeholder="Почта аккаунта" className="input" />
        <button className="btn w-full justify-center">Отправить ссылку</button></>}
    </form>
  );
}
