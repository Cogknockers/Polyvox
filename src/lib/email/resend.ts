import "server-only";

import type { ReactElement } from "react";
import { Resend } from "resend";

type SendEmailParams = {
  to: string;
  subject: string;
  react?: ReactElement;
  html?: string;
  headers?: Record<string, string>;
};

export async function sendResendEmail({
  to,
  subject,
  react,
  html,
  headers,
}: SendEmailParams) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;

  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY environment variable.");
  }

  if (!from) {
    throw new Error("Missing RESEND_FROM environment variable.");
  }

  const resend = new Resend(apiKey);

  if (!react && !html) {
    throw new Error("Missing react or html content for email.");
  }

  const result = await resend.emails.send({
    from,
    to,
    subject,
    react,
    html,
    headers,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data;
}
