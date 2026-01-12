import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/authz";

export default async function ModerationPage({
  params,
}: {
  params: Promise<{ jurisdictionId: string }>;
}) {
  const { jurisdictionId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  try {
    await requireRole({
      userId: user.id,
      jurisdictionId,
      roles: ["moderator"],
    });
  } catch {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-6 py-10">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Moderation workspace
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Jurisdiction {jurisdictionId}
        </h1>
      </header>
      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">
          Moderation tools will appear here once jurisdiction workflows are
          implemented.
        </p>
      </section>
    </main>
  );
}
