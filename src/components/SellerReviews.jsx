import { prisma } from "@/lib/prisma";
import Avatar from "./Avatar";
const inc = { author: { select: { username: true, avatarUrl: true } } };
const Row = (r) => (
  <div key={r.id} className="flex gap-2 text-sm"><Avatar user={r.author} size={26} /><p><b>{r.author.username}</b> · {r.rating}/10<br />{r.text}</p></div>
);
export default async function SellerReviews({ sellerId }) {
  const [good, bad] = await Promise.all([
    prisma.review.findMany({ where: { targetId: sellerId, rating: { gte: 7 } }, orderBy: [{ rating: "desc" }, { createdAt: "desc" }], take: 3, include: inc }),
    prisma.review.findMany({ where: { targetId: sellerId, rating: { lte: 4 } }, orderBy: [{ rating: "asc" }, { createdAt: "desc" }], take: 3, include: inc }),
  ]);
  if (!good.length && !bad.length) return null;
  return (
    <div className="card space-y-3">
      <h2 className="font-semibold">Отзывы о продавце</h2>
      {good.length > 0 && <div className="space-y-2"><p className="text-xs text-emerald-500">Лучшие отзывы (7–10 из 10)</p>{good.map(Row)}</div>}
      {bad.length > 0 && <div className="space-y-2"><p className="text-xs text-hot">Худшие отзывы (1–4 из 10)</p>{bad.map(Row)}</div>}
    </div>
  );
}
