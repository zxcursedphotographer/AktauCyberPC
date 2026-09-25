import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import GuideEditor from "@/components/GuideEditor";
import { seedGuidesIfEmpty } from "@/app/actions";

export const metadata = {
  title: "Гайд на проверку компонентов — AktauCyberPC",
};

export default async function GuidePage() {
  // Заполняем БД дефолтными гайдами при первом заходе
  await seedGuidesIfEmpty();

  const [me, guides] = await Promise.all([
    getUser(),
    prisma.guideVideo.findMany({ orderBy: { order: "asc" } }),
  ]);

  const isAdmin = me?.role === "SUPER_ADMIN";

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-6">
      <div>
        <h1 className="text-3xl font-bold">Гайд на проверку компонентов</h1>
        <p className="mt-2 text-slate-400">
          Перед публикацией объявления вы обязаны приложить видеоматериал или
          фотографии тестов компонентов. Ниже — инструкции по каждому компоненту.
        </p>
      </div>

      <div className="space-y-3">
        {guides.map((g) => (
          <GuideEditor
            key={g.id}
            item={{
              id: g.id,
              slug: g.slug,
              title: g.title,
              videoUrl: g.videoUrl,
            }}
            isAdmin={isAdmin}
          />
        ))}
      </div>

      {isAdmin && (
        <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 text-sm">
          <p className="font-semibold text-accent">🛡️ Режим администратора</p>
          <p className="mt-1 opacity-80">
            Вы можете редактировать ссылки на видео. Изменения сохраняются в базе
            и сразу видны всем пользователям — перезагрузка страницы не нужна.
          </p>
        </div>
      )}
    </div>
  );
}