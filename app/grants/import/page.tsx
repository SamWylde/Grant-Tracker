import { CsvImporter } from "@/components/csv-importer";

export default function GrantImportPage() {
  return (
    <div className="min-h-screen bg-slate-950 px-6 py-12">
      <div className="mx-auto w-full max-w-5xl">
        <CsvImporter />
      </div>
    </div>
  );
}
