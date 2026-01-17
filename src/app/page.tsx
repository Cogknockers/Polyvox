import Link from "next/link";
import { ArrowRight } from "lucide-react";

import MarketingShell from "@/components/marketing/marketing-shell";
import { Button } from "@/components/ui/button";

const appLinks = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Explore", href: "/explore" },
  { label: "Forums", href: "/forums" },
  { label: "Notifications", href: "/notifications" },
  { label: "Profile", href: "/profile" },
  { label: "Settings", href: "/settings" },
  { label: "Help", href: "/help" },
  { label: "Admin", href: "/admin" },
];

export default function Home() {
  return (
    <MarketingShell>
      <main className="bg-background text-foreground">
        <section className="border-b border-border bg-gradient-to-b from-muted/30 via-background to-background">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-16 lg:py-24">
            <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-6">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                  Local civic momentum
                </p>
                <div className="space-y-4">
                  <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                    A public arena for leaders who do not start with money.
                  </h1>
                  <p className="text-base text-muted-foreground sm:text-lg">
                    Polyvox is a civic platform that helps communities surface issues,
                    test leadership, and converge before election day. It is built
                    for transparency, local context, and coordinated action.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button asChild>
                    <Link href="/register">
                      Join Polyvox
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/dashboard">Open dashboard</Link>
                  </Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-border bg-background/60 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      Focus
                    </p>
                    <p className="text-sm font-semibold">Local offices and issues</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-background/60 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      Format
                    </p>
                    <p className="text-sm font-semibold">Media, debate, consensus</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-background/60 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      Outcome
                    </p>
                    <p className="text-sm font-semibold">Write-in readiness</p>
                  </div>
                </div>
              </div>
              <div className="rounded-3xl border border-border bg-background/70 p-6 shadow-sm">
                <div className="space-y-6">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      What this enables
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                      The same microphone for every candidate.
                    </h2>
                    <p className="mt-3 text-sm text-muted-foreground">
                      Candidates build credibility in public. The platform rewards
                      preparation, community trust, and local fluency.
                    </p>
                  </div>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p>- Open declaration with clear jurisdictions</p>
                    <p>- Local issue workspaces with auditable history</p>
                    <p>- Debates that are live, public, and archived</p>
                    <p>- Community voting to converge on finalists</p>
                  </div>
                  <div className="rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                    This is a civic platform. It does not replace elections. It helps
                    communities prepare for them.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="border-b border-border py-16">
          <div className="mx-auto w-full max-w-6xl px-6">
            <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr]">
              <div className="space-y-4">
                <h2 className="text-3xl font-semibold tracking-tight">How it works</h2>
                <p className="text-sm text-muted-foreground">
                  Polyvox is a three-stage civic funnel that creates visibility,
                  consensus, and write-in readiness.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-border bg-background px-5 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Stage 1
                  </p>
                  <h3 className="mt-2 text-sm font-semibold">Open declaration</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Candidates publish media, clarify issues, and earn trust in public.
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-background px-5 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Stage 2
                  </p>
                  <h3 className="mt-2 text-sm font-semibold">Community convergence</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Supporters vote inside the platform to select finalists.
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-background px-5 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Stage 3
                  </p>
                  <h3 className="mt-2 text-sm font-semibold">Write-in readiness</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Finalists are organized, visible, and ready for election day.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="border-b border-border py-16">
          <div className="mx-auto w-full max-w-6xl px-6">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <h2 className="text-3xl font-semibold tracking-tight">
                  Built for civic visibility
                </h2>
                <p className="text-sm text-muted-foreground">
                  The platform is designed to surface local signal, not funding.
                </p>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li>- Jurisdiction-first discovery across city, county, and state.</li>
                  <li>- Issue workspaces with transparent timelines and sources.</li>
                  <li>- Follow offices, not just personalities.</li>
                  <li>- Debates, media, and endorsements in one place.</li>
                  <li>- Admin tools for safety, moderation, and auditability.</li>
                </ul>
              </div>
              <div className="rounded-3xl border border-border bg-muted/30 p-6">
                <h3 className="text-lg font-semibold">Explore the app</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Jump directly into the areas you want to review.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {appLinks.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition hover:border-muted-foreground"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="governance" className="border-b border-border py-16">
          <div className="mx-auto w-full max-w-6xl px-6">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
              <div className="space-y-3">
                <h2 className="text-3xl font-semibold tracking-tight">Governance</h2>
                <p className="text-sm text-muted-foreground">
                  Polyvox keeps the platform honest by design.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-background px-5 py-4">
                  <h3 className="text-sm font-semibold">Auditability</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Moderation actions and issue changes are traceable and reviewable.
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-background px-5 py-4">
                  <h3 className="text-sm font-semibold">Safety controls</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    RLS, policy gates, and admin oversight keep the space reliable.
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-background px-5 py-4">
                  <h3 className="text-sm font-semibold">Jurisdiction hierarchy</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    City, county, state, and national data stay distinct and composable.
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-background px-5 py-4">
                  <h3 className="text-sm font-semibold">Consensus checks</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Community votes are staged, clear, and time bound.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="py-16">
          <div className="mx-auto w-full max-w-6xl px-6">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="space-y-3">
                <h2 className="text-3xl font-semibold tracking-tight">FAQ</h2>
                <p className="text-sm text-muted-foreground">
                  Short answers to the most common questions.
                </p>
              </div>
              <div className="space-y-4">
                <div className="rounded-2xl border border-border bg-background px-5 py-4">
                  <h3 className="text-sm font-semibold">
                    Does Polyvox replace elections?
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    No. It creates visibility, coordination, and readiness before
                    election day.
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-background px-5 py-4">
                  <h3 className="text-sm font-semibold">Is this only for outsiders?</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    No. Party and independent candidates can both participate and
                    debate on the same stage.
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-background px-5 py-4">
                  <h3 className="text-sm font-semibold">How are write-ins handled?</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    The platform focuses on pre-election consensus and provides
                    education, not legal instruction.
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-background px-5 py-4">
                  <h3 className="text-sm font-semibold">
                    Where should I start?
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Explore your jurisdiction, follow an office, and track the issues
                    you care about.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </MarketingShell>
  );
}
