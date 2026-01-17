import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type Jurisdiction = {
  id: string;
  name: string;
};

export default async function ExplorePage() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("jurisdictions")
    .select("id,name")
    .eq("type", "COUNTRY")
    .order("name");

  if (error) {
    throw error;
  }

  const countries = (data ?? []) as Jurisdiction[];

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-16">
        <header className="space-y-4">
          <Link
            href="/"
            className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500"
          >
            Polyvox
          </Link>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
              Explore Countries
            </h1>
            <p className="text-base text-zinc-600">
              Start at the top level and drill down by jurisdiction.
            </p>
          </div>
        </header>

        <section className="grid gap-3">
          {countries.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No countries are available yet.
            </p>
          ) : (
            countries.map((country) => (
              <Link
                key={country.id}
                href={`/j/${country.id}`}
                className="rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-base font-semibold text-zinc-900 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md"
              >
                {country.name}
              </Link>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
