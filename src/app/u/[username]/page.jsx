import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import { updateProfile, removeMedia, setTrust, addReview, updateUsername } from "@/app/actions";
import TrustBadge from "@/components/TrustBadge";
import Avatar from "@/components/Avatar";
import ImageInput from "@/components/ImageInput";

export default async function Profile({ params }) {
  const u = await prisma.user.findUnique({
    where: { username: decodeURIComponent(params.username) },
    include: { listings: { where: { status: "PUBLISHED" }, include: { images: { take: 1 } } }, reviewsGot: { include: { author: true }, orderBy: [{ pinned: "desc" }, { createdAt: "desc" }] } },
  });
  if (!u) notFound();
  const me = await getUser();
  const sa = me?.role === "SUPER_ADMIN", own = me?.id === u.id, edit = own || sa;
  const canReview = me && !own && (sa || (await prisma.listing.count({ where: { userId: u.id, buyerId: me.id, status: "SOLD" } })) > 0);
  return (
    <div>
      <div className="h-40 overflow-hidden rounded-xl bg-gradient-to-r from-accent to-hot md:h-56">
        {u.bannerUrl && <img src={u.bannerUrl} alt="" className="h-full w-full object-cover" />}
      </div>
      <div className="flex flex-wrap gap-4 px-4">
        <div className="-mt-12 shrink-0 rounded-full border-4 border-slate-100 dark:border-ink"><Avatar user={u} size={96} /></div>
        <div className="min-w-0 flex-1 pt-3"><h1 className="text-2xl font-bold">{u.username}</h1>
          <p className="text-sm opacity-70">{[u.city, u.district].filter(Boolean).join(", ")} · ★ {u.rating.toFixed(1)}/10 · на сайте с {u.createdAt.toLocaleDateString("ru")}</p></div>
        <div className="pt-3"><TrustBadge score={u.trustScore} size={64} label /></div>
      </div>
      {u.bio && <p className="card mt-4">{u.bio}</p>}
      {u.status !== "ACTIVE" && <p className="mt-2 text-sm text-amber-500">Статус аккаунта: {u.status}</p>}

      {edit && (
        <details id="edit" className="card mt-4"><summary className="cursor-pointer font-semibold">Редактировать профиль</summary>
          <form action={updateUsername} className="mt-3 flex flex-wrap gap-2">
            <input name="username" defaultValue={u.username} placeholder="Новый ник" className="input flex-1" minLength={3} maxLength={20} required />
            <button className="btn">Сменить ник</button>
          </form>
          <p className="mt-1 text-xs opacity-60">Ник: 3–20 символов, только латиница, цифры и _</p>
          <hr className="my-3 border-white/10" />
          <form action={updateProfile} className="space-y-2">
            <input type="hidden" name="id" value={u.id} />
            <label className="block text-sm">Аватар: 400×400 px, до 5 МБ<ImageInput name="avatar" className="input" /></label>
            <label className="block text-sm">Баннер: 1500×400 px (15:4), до 5 МБ<ImageInput name="banner" className="input" /></label>
            <textarea name="bio" defaultValue={u.bio || ""} rows={3} maxLength={500} placeholder="О себе" className="input" />
            <div className="flex gap-2"><input name="city" defaultValue={u.city || ""} placeholder="Город" className="input" /><input name="district" defaultValue={u.district || ""} placeholder="Микрорайон" className="input" /></div>
            <button className="btn">Сохранить</button>
          </form>
          <form action={removeMedia} className="mt-2 flex gap-2"><input type="hidden" name="id" value={u.id} />
            <button name="field" value="avatarUrl" className="rounded-lg border border-white/20 px-3 py-1.5 text-sm">Удалить аватар</button>
            <button name="field" value="bannerUrl" className="rounded-lg border border-white/20 px-3 py-1.5 text-sm">Удалить баннер</button></form>
        </details>)}
      {sa && (
        <form action={setTrust} className="card mt-4 flex flex-wrap items-center gap-2 text-sm">
          <input type="hidden" name="id" value={u.id} />Траст-фактор (1–100):
          <input name="score" type="number" min={1} max={100} defaultValue={u.trustScore} className="input !w-24" />
          <button className="btn">Задать</button>
        </form>)}

      <h2 className="mb-2 mt-6 text-lg font-bold">Объявления ({u.listings.length})</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {u.listings.map((l) => (
          <Link key={l.id} href={`/listing/${l.id}`} className="card overflow-hidden !p-0 hover:border-accent">
            {l.images[0] && <img src={l.images[0].url} alt="" className="h-40 w-full object-cover" />}
            <div className="p-3"><b>{l.title}</b><p className="text-accent">{l.price.toLocaleString("ru")} ₸</p></div>
          </Link>))}
      </div>

      <h2 id="reviews" className="mb-2 mt-6 text-lg font-bold">Отзывы ({u.reviewsGot.length})</h2>
      {me && !own && !canReview && <p className="mb-3 text-sm opacity-70">Оставить отзыв можно после сделки: продавец отмечает объявление проданным и выбирает вас покупателем.</p>}
      {canReview && (
        <form action={addReview} className="card mb-3 flex flex-wrap gap-2">
          <input type="hidden" name="id" value={u.id} />
          <select name="rating" className="input !w-28">{[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} / 10</option>)}</select>
          <input name="text" required maxLength={500} placeholder="Ваш отзыв" className="input flex-1" /><button className="btn">Оставить отзыв</button>
        </form>)}
      {u.reviewsGot.length === 0 && <p className="opacity-70">Отзывов пока нет.</p>}
      {u.reviewsGot.map((r) => <div key={r.id} className={`card mb-2 flex gap-3 text-sm ${r.pinned ? "!border-accent" : ""}`}><Avatar user={r.author} size={32} /><div><b>{r.author.username}</b> · ★ {r.rating}/10{r.pinned && <span className="ml-2 rounded bg-accent px-1.5 text-xs text-white">Владелец платформы</span>}<br />{r.text}</div></div>)}
    </div>
  );
}