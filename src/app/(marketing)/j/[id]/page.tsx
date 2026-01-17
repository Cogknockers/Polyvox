import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type Jurisdiction = {
  id: string;
  name: string;
  type: string;
  parent_id: string | null;
};

type ChildJurisdiction = {
  id: string;
  name: string;
  type: string;
};

type Office = {
  id: string;
  name: string;
  office_type: string;
};

function formatType(type: string) {
  return type.toLowerCase();
}

export default async function JurisdictionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const parsedId = z.string().uuid().safeParse(id);
  if (!parsedId.success) {
    notFound();
  }

  const jurisdictionId = parsedId.data;
  const supabase = await createSupabaseServerClient();
  const { data: jurisdiction, error } = await supabase
    .from("jurisdictions")
    .select("id,name,type,parent_id")
    .eq("id", jurisdictionId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!jurisdiction) {
    notFound();
  }

  const { data: children, error: childrenError } = await supabase
    .from("jurisdictions")
    .select("id,name,type")
    .eq("parent_id", jurisdictionId)
    .order("name");

  if (childrenError) {
    throw childrenError;
  }

  const { data: offices, error: officesError } = await supabase
    .from("offices")
    .select("id,name,office_type")
    .eq("jurisdiction_id", jurisdictionId)
    .order("name");

  if (officesError) {
    throw officesError;
  }

  let parent: ChildJurisdiction | null = null;
  if (jurisdiction.parent_id) {
    const { data: parentData, error: parentError } = await supabase
      .from("jurisdictions")
      .select("id,name,type")
      .eq("id", jurisdiction.parent_id)
      .maybeSingle();
    if (parentError) {
      throw parentError;
    }
    parent = parentData ?? null;
  }

  const childList = (children ?? []) as ChildJurisdiction[];
  const officeList = (offices ?? []) as Office[];

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-16">
        <header className="space-y-3">
          <div className="flex items-center gap-3 text-sm text-zinc-500">
            <Link href="/" className="font-semibold uppercase tracking-[0.2em]">
              Polyvox
            </Link>
            <span>/</span>
            <Link href="/explore" className="font-medium">
              Explore
            </Link>
            {parent ? (
              <>
                <span>/</span>
                <Link href={`/j/${parent.id}`} className="font-medium">
                  {parent.name}
                </Link>
              </>
            ) : null}
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
              {formatType(jurisdiction.type)}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
              {jurisdiction.name}
            </h1>
          </div>
        </header>

        <section className="grid gap-4">
          <h2 className="text-lg font-semibold text-zinc-900">
            Child jurisdictions
          </h2>
          {childList.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No child jurisdictions yet.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {childList.map((child) => (
                <Link
                  key={child.id}
                  href={`/j/${child.id}`}
                  className="rounded-2xl border border-zinc-200 bg-white px-5 py-4 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    {formatType(child.type)}
                  </p>
                  <p className="text-base font-semibold text-zinc-900">
                    {child.name}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="grid gap-4">
          <h2 className="text-lg font-semibold text-zinc-900">Offices</h2>
          {officeList.length === 0 ? (
            <p className="text-sm text-zinc-500">No offices yet.</p>
          ) : (
            <div className="grid gap-3">
              {officeList.map((office) => (
                <Link
                  key={office.id}
                  href={`/o/${office.id}`}
                  className="rounded-2xl border border-zinc-200 bg-white px-5 py-4 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    {office.office_type}
                  </p>
                  <p className="text-base font-semibold text-zinc-900">
                    {office.name}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
