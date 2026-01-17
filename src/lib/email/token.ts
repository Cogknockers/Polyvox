import crypto from "crypto";

type UnsubscribePayload = {
  contactId: string;
  exp: number;
};

function getSecret() {
  const secret = process.env.EMAIL_TOKEN_SECRET;
  if (!secret) {
    throw new Error("Missing EMAIL_TOKEN_SECRET environment variable.");
  }
  return secret;
}

function sign(payload: string) {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
}

export function signUnsubscribeToken(payload: UnsubscribePayload) {
  const data = JSON.stringify(payload);
  const encodedPayload = Buffer.from(data).toString("base64url");
  const signature = sign(encodedPayload);
  return Buffer.from(`${encodedPayload}.${signature}`).toString("base64url");
}

export function verifyUnsubscribeToken(token: string): UnsubscribePayload {
  const raw = Buffer.from(token, "base64url").toString("utf8");
  const parts = raw.split(".");
  if (parts.length !== 2) {
    throw new Error("Invalid token format.");
  }

  const [encodedPayload, signature] = parts;
  const expected = sign(encodedPayload);

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    throw new Error("Invalid token signature.");
  }

  const decoded = Buffer.from(encodedPayload, "base64url").toString("utf8");
  const payload = JSON.parse(decoded) as UnsubscribePayload;

  if (!payload?.contactId || !payload?.exp) {
    throw new Error("Invalid token payload.");
  }

  if (Date.now() > payload.exp) {
    throw new Error("Token expired.");
  }

  return payload;
}
