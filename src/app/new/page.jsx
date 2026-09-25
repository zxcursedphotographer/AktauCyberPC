import { redirect } from "next/navigation";
import { getUser, mailOk } from "@/lib/auth";
import { createListing } from "@/app/actions";
import { CATS, TYPES } from "@/lib/constants";
import NewListingFormClient from "@/components/NewListingFormClient";

export const metadata = { title: "Создать объявление — AktauCyberPC" };

export default async function NewListing() {
  const me = await getUser();
  if (!me) redirect("/login");

  if (!mailOk(me)) {
    return (
      <div className="mx-auto max-w-xl my-12 p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center shadow-xl">
        <div className="text-amber-400 text-4xl mb-3">✉️</div>
        <h2 className="text-xl font-bold text-slate-100 mb-2">Подтвердите вашу почту</h2>
        <p className="text-slate-400 text-sm">
          Ссылка для подтверждения аккаунта отправлена на <span className="text-cyan-400 font-medium">{me.email}</span>.
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-screen py-8 pb-28 px-4 sm:px-6 bg-slate-950 text-slate-100 flex justify-center">
      <NewListingFormClient 
        action={createListing} 
        cats={CATS} 
        types={TYPES} 
        defaultCity={me.city || "Актау"} 
        defaultDistrict={me.district || ""} 
      />
    </main>
  );
}