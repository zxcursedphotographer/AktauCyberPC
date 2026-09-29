import Link from "next/link";

export const metadata = { title: "Страница не найдена" };

export default function NotFound() {
  return (
    <div className="card mx-auto my-16 max-w-md space-y-3 text-center">
      <div className="text-5xl font-black text-accent">404</div>
      <h1 className="text-xl font-bold">Здесь ничего нет</h1>
      <p className="text-sm opacity-70">
        Страница не существует или объявление уже снято с публикации.
      </p>
      <Link href="/" className="btn w-full justify-center">К объявлениям</Link>
    </div>
  );
}
