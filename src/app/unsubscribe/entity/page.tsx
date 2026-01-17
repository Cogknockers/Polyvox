import Link from "next/link";
import { redirect } from "next/navigation";

import AppFooter from "@/components/app/app-footer";
import AppHeaderShell from "@/components/app/app-header-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

type SubscriptionRow = {
  id: string;
  entity_id: string;
  contact_email: string;
  is_enabled: boolean;
  unsubscribed_at: string | null;
  public_entities?: { name: string | null }[] | null;
};

export default async function EntityUnsubscribePage({
  searchParams,
}: {
  searchParams?: { token?: string; resubscribed?: string };
}) {
  const token = typeof searchParams?.token === "string" ? searchParams.token : "";
  const resubscribed = searchParams?.resubscribed === "1";

  if (!token) {
    return (
      <Shell>
        <StateCard
          title="Invalid or expired link"
          description="We could not verify this unsubscribe link."
          primaryAction={{ href: "/dashboard", label: "Back to dashboard" }}
        />
      </Shell>
    );
  }

  const supabase = createSupabaseServiceClient();
  const { data: subscription } = await supabase
    .from("entity_contact_subscriptions")
    .select("id,entity_id,contact_email,is_enabled,unsubscribed_at,public_entities(name)")
    .eq("unsubscribe_token", token)
    .maybeSingle();

  if (!subscription) {
    return (
      <Shell>
        <StateCard
          title="Invalid or expired link"
          description="We could not verify this unsubscribe link."
          primaryAction={{ href: "/dashboard", label: "Back to dashboard" }}
        />
      </Shell>
    );
  }

  const entityName =
    subscription.public_entities?.[0]?.name ?? "this entity";
  const maskedEmail = maskEmail(subscription.contact_email);

  if (!resubscribed && !subscription.unsubscribed_at) {
    await supabase
      .from("entity_contact_subscriptions")
      .update({
        unsubscribed_at: new Date().toISOString(),
        is_enabled: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscription.id);
  }

  const alreadyUnsubscribed =
    Boolean(subscription.unsubscribed_at) || subscription.is_enabled === false;

  if (resubscribed) {
    return (
      <Shell>
        <StateCard
          title="You are resubscribed"
          description={`Updates for ${entityName} will be sent to ${maskedEmail}.`}
          primaryAction={{ href: "/dashboard", label: "Back to dashboard" }}
        />
      </Shell>
    );
  }

  return (
    <Shell>
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>
            {alreadyUnsubscribed
              ? "You are already unsubscribed"
              : "Unsubscribed successfully"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            {alreadyUnsubscribed
              ? `Updates for ${entityName} are currently paused for ${maskedEmail}.`
              : `You will no longer receive digest emails for ${entityName} at ${maskedEmail}.`}
          </p>
          <div className="flex flex-wrap gap-2">
            <form action={resubscribeAction}>
              <input type="hidden" name="token" value={token} />
              <Button type="submit" variant="outline">
                Resubscribe
              </Button>
            </form>
            <Button asChild variant="ghost">
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </Shell>
  );
}

async function resubscribeAction(formData: FormData) {
  "use server";
  const token = String(formData.get("token") ?? "");
  if (!token) {
    redirect("/unsubscribe/entity");
  }

  const supabase = createSupabaseServiceClient();
  const { data: subscription } = await supabase
    .from("entity_contact_subscriptions")
    .select("id")
    .eq("unsubscribe_token", token)
    .maybeSingle();

  if (!subscription) {
    redirect("/unsubscribe/entity");
  }

  await supabase
    .from("entity_contact_subscriptions")
    .update({
      unsubscribed_at: null,
      is_enabled: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", subscription.id);

  redirect(`/unsubscribe/entity?token=${encodeURIComponent(token)}&resubscribed=1`);
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AppHeaderShell showFilters={false} />
      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-10">
        {children}
      </main>
      <AppFooter />
    </div>
  );
}

function StateCard({
  title,
  description,
  primaryAction,
}: {
  title: string;
  description: string;
  primaryAction: { href: string; label: string };
}) {
  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
        <p>{description}</p>
        <Button asChild>
          <Link href={primaryAction.href}>{primaryAction.label}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!domain) return email;
  if (!name) return `***@${domain}`;
  if (name.length === 1) return `${name[0]}***@${domain}`;
  return `${name[0]}***@${domain}`;
}
