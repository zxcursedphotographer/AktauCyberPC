import { updateListing, addListingImage, removeListingImage, deleteListing, markSold } from "@/app/actions";
import ImageInput from "./ImageInput";
export default function ListingTools({ l, sa, buyers = [] }) {
  return (
    <section className="card space-y-3 !border-hot/50">
      <h2 className="font-semibold">Управление объявлением</h2>
      <form action={updateListing} className="space-y-2">
        <input type="hidden" name="id" value={l.id} />
        <input name="title" defaultValue={l.title} className="input" />
        <textarea name="description" defaultValue={l.description} rows={4} className="input" />
        <input name="price" type="number" defaultValue={l.price} className="input" />
        <button className="btn">Сохранить изменения</button>
      </form>
      <div className="flex flex-wrap gap-2">
        {l.images.map((i) => (
          <form key={i.id} action={removeListingImage} className="relative">
            <input type="hidden" name="id" value={i.id} /><img src={i.url} alt="" className="h-16 rounded" />
            <button title="Удалить фото" className="absolute right-0 top-0 rounded bg-hot px-1.5 text-xs text-white">✕</button>
          </form>))}
      </div>
      <form action={addListingImage} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="id" value={l.id} /><ImageInput name="photo" required className="text-sm" />
        <button className="btn">Добавить фото</button>
      </form>
      {l.status === "SOLD" ? <p className="text-sm text-emerald-500">Продано{buyers.find((b) => b.id === l.buyerId) ? `: ${buyers.find((b) => b.id === l.buyerId).username}` : ""}</p> : (
        <form action={markSold} className="flex flex-wrap gap-2 border-t border-white/10 pt-3"><input type="hidden" name="id" value={l.id} />
          <select name="buyerId" className="input !w-56"><option value="">Покупатель…</option>{buyers.map((b) => <option key={b.id} value={b.id}>{b.username}</option>)}</select>
          <button className="btn !bg-emerald-600">Отметить как продано</button></form>)}
      {sa && (
        <form action={deleteListing} className="flex flex-wrap gap-2 border-t border-white/10 pt-3">
          <input type="hidden" name="id" value={l.id} /><input type="hidden" name="back" value="/admin" />
          <select name="reason" required className="input !w-72"><option value="">Причина удаления…</option>
            <option value="1">Не соответствует проверкам / недействительные тесты</option>
            <option value="2">Неправильное оформление объявления</option>
            <option value="3">Мошенничество или неадекватное поведение</option></select>
          <button className="btn !bg-hot">Удалить объявление</button>
        </form>)}
    </section>
  );
}
