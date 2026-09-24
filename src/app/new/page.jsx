import { redirect } from "next/navigation";
import ImageInput from "@/components/ImageInput";
import { getUser, mailOk } from "@/lib/auth";
import { createListing } from "@/app/actions";
import { CATS, TYPES } from "@/lib/constants";

export const metadata = { title: "Создать объявление — AktauCyberPC" };

export default async function NewListing() {
  const me = await getUser(); if (!me) redirect("/login");
  if (!mailOk(me)) return <p className="card">Сначала подтвердите почту: ссылка отправлена на {me.email}.</p>;
  return (
    <form action={createListing} className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">Новое объявление</h1>
      <div className="card space-y-3">
        <input name="title" required maxLength={120} placeholder="Заголовок: RTX 3070 Gigabyte Gaming OC" className="input" />
        <select name="category" required className="input"><option value="">Категория</option>{CATS.map((c) => <option key={c}>{c}</option>)}</select>
        <input name="price" type="number" required min={0} placeholder="Цена, ₸" className="input" />
        <textarea name="description" required rows={5} maxLength={5000} placeholder="Состояние, гарантия, комплектация, причина продажи" className="input" />
        <div className="flex gap-2"><input name="city" defaultValue={me.city || "Актау"} placeholder="Город" className="input" /><input name="district" defaultValue={me.district || ""} placeholder="Микрорайон (без улицы и дома)" className="input" /></div>
        <label className="block text-sm">Фотографии товара<ImageInput name="photos" multiple className="input" /></label>
      </div>
      <h2 className="text-lg font-bold">Проверенные компоненты</h2>
      <p className="text-sm opacity-70">Заполните только то, что вы проверили. Пустые блоки не публикуются.</p>
      {TYPES.map(([k, name, hint]) => (
        <details key={k} className="card"><summary className="cursor-pointer font-semibold">{name}</summary>
          <div className="mt-3 space-y-2">
            <input name={`t_${k}_title`} placeholder={`Название теста (${hint})`} className="input" />
            <select name={`t_${k}_result`} className="input"><option value="PASSED">Тест пройден</option><option value="FAILED">Тест не пройден</option></select>
            <textarea name={`t_${k}_metrics`} rows={4} className="input" placeholder={"Показатели, каждый с новой строки:\nТемпература GPU, °C: 71\nHot Spot, °C: 83\nМайнинг: не использовалась"} />
            <label className="block text-sm">Скриншоты и фото тестов<ImageInput name={`t_${k}_shots`} multiple className="input" /></label>
          </div></details>))}
      <button className="btn w-full justify-center">Опубликовать</button>
    </form>
  );
}
