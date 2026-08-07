export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-12">
      <section className="w-full rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold text-blue-700">Foundation scaffold</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">NICE Electrolyte CDS</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700">
          This repository is ready for the deterministic NICE rule engine, validated assessment
          workflow, optional browser-only extraction support, and evidence-resource interfaces.
        </p>
        <div className="mt-6 rounded-md border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-950">
          Educational prototype only. Do not enter real patient-identifiable information.
        </div>
      </section>
    </main>
  );
}
