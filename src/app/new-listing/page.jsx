import NewListingForm from "@/components/NewListingForm";

export default function NewListingPage() {
  return (
    <main className="min-h-screen p-4 sm:p-8 bg-slate-950 flex items-center justify-center">
      <NewListingForm userCity="Актау" />
    </main>
  );
}