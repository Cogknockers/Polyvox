import { NextResponse } from "next/server";

function normalizeHex(input: string) {
  const cleaned = input.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(cleaned)) {
    return cleaned
      .split("")
      .map((c) => c + c)
      .join("")
      .toUpperCase();
  }
  if (/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    return cleaned.toUpperCase();
  }
  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hexParam = searchParams.get("hex");
  const name = searchParams.get("name") ?? "brand";

  if (!hexParam) {
    return NextResponse.json(
      { error: "Missing required query param: hex" },
      { status: 400 }
    );
  }

  const hex = normalizeHex(hexParam);
  if (!hex) {
    return NextResponse.json(
      { error: "Invalid hex format" },
      { status: 400 }
    );
  }

  const url = `https://www.tints.dev/api/${encodeURIComponent(name)}/${hex}`;
  const response = await fetch(url, { next: { revalidate: 3600 } });

  if (!response.ok) {
    return NextResponse.json(
      { error: "Failed to fetch palette" },
      { status: response.status }
    );
  }

  let data: unknown = await response.json();
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse palette response" },
        { status: 502 }
      );
    }
  }

  return NextResponse.json(data, { status: 200 });
}
