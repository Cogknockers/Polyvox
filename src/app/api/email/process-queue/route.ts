import { NextResponse } from "next/server";

import { processEmailOutbox } from "@/lib/email/outbox";
import { sendResendEmail } from "@/lib/email/resend";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const internalKey = request.headers.get("x-internal-key");
  if (!internalKey || internalKey !== process.env.INTERNAL_QUEUE_KEY) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = createSupabaseServiceClient();

  try {
    const result = await processEmailOutbox({
      supabase,
      sendEmail: ({ to, subject, html }) =>
        sendResendEmail({ to, subject, html }),
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
