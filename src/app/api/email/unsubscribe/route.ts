import { NextResponse } from "next/server";

import { verifyUnsubscribeToken } from "@/lib/email/token";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token." }, { status: 400 });
  }

  try {
    const { contactId } = verifyUnsubscribeToken(token);
    const supabase = createSupabaseServiceClient();

    const { error } = await supabase
      .from("public_entity_contacts")
      .update({ email_suppressed: true, updated_at: new Date().toISOString() })
      .eq("id", contactId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Unsubscribed</title>
  </head>
  <body style="font-family: Arial, sans-serif; padding: 32px; color: #0f172a;">
    <h1>You have been unsubscribed</h1>
    <p style="color: #475569;">You will no longer receive email notifications for this entity.</p>
    <p><a href="/" style="color: #2563eb;">Back to Polyvox</a></p>
  </body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid unsubscribe token.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}