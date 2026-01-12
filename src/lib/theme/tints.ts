import { extractPalette, type PaletteShades } from "./mapping";

export type TintsResponse = Record<string, unknown>;

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

export async function fetchPaletteFromHex(
  baseHex: string,
  name = "brand"
): Promise<{ palette: PaletteShades; raw: TintsResponse }> {
  const normalized = normalizeHex(baseHex);
  if (!normalized) {
    throw new Error("Invalid hex value");
  }

  const params = new URLSearchParams({ hex: normalized, name });
  const response = await fetch(`/api/theme/palette?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Unable to fetch palette");
  }

  const raw = (await response.json()) as TintsResponse;
  const palette = extractPalette(raw);

  if (!palette || Object.keys(palette).length === 0) {
    throw new Error("Palette response missing shades");
  }

  return { palette, raw };
}
