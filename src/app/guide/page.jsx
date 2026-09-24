export const metadata = {
  title: "Гайд на проверку компонентов — AktauCyberPC",
};

const components = [
  {
    name: "Видеокарта",
    video: "https://youtu.be/3MbZN8CyedM",
  },
  { name: "Процессор" },
  { name: "Оперативная память" },
  { name: "SSD / HDD" },
  { name: "Блок питания" },
  { name: "Корпус и охлаждение" },
];

export default function GuidePage() {
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
        {components.map((c) => (
          <div
            key={c.name}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4"
          >
            <span className="font-semibold">{c.name}</span>
            {c.video ? (
              <a
                href={c.video}
                target="_blank"
                rel="noopener noreferrer"
                className="btn"
              >
                Смотреть видео
              </a>
            ) : (
              <span className="text-sm text-slate-500">скоро</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}