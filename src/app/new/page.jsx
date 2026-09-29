import { redirect } from "next/navigation";
import { getUser, mailOk } from "@/lib/auth";
import { createListing } from "@/app/actions";
import { CATS, TYPES, CITIES } from "@/lib/constants";
import NewListingFormClient from "@/components/NewListingFormClient";

export const metadata = { title: "Создать объявление" };

export default async function NewListing() {
  const me = await getUser();
  if (!me) redirect("/login");

  if (!mailOk(me)) {
    return (
      <div className="mx-auto my-12 max-w-xl p-6 text-center">
        <div className="card">
          <div className="mb-3 text-4xl text-amber-400">✉️</div>
          <h2 className="mb-2 text-xl font-bold">Подтвердите вашу почту</h2>
          <p className="text-sm text-slate-400">
            Ссылка отправлена на{" "}
            <span className="font-medium text-accent">{me.email}</span>.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Не пришло? Проверьте «Спам» или нажмите «Отправить письмо ещё раз» в жёлтой полосе сверху.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center px-0 py-4 pb-28 sm:px-2">
      <NewListingFormClient
        action={createListing}
        cats={CATS}
        types={TYPES}
        cities={CITIES}
        defaultCity={me.city || "Актау"}
        defaultDistrict={me.district || ""}
      />
    </div>
  );
}