import { ManualGrantForm } from "@/components/manual-grant-form";

export default function NewGrantPage() {
  return (
    <div className="min-h-screen bg-slate-950 px-6 py-12">
      <div className="mx-auto w-full max-w-4xl">
        <ManualGrantForm />
      </div>
    </div>
  );
}
