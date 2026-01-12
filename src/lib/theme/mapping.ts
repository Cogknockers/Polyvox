export type PaletteShades = Record<string, string>;

export type PaletteMapping = {
  light: Record<string, string>;
  dark: Record<string, string>;
};

function isShadeMap(value: unknown): value is PaletteShades {
  if (!value || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj["50"] === "string" &&
    typeof obj["100"] === "string" &&
    typeof obj["500"] === "string" &&
    typeof obj["900"] === "string"
  );
}

export function extractPalette(input: unknown): PaletteShades {
  if (!input) return {};
  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      return extractPalette(parsed);
    } catch {
      return {};
    }
  }
  if (typeof input !== "object") return {};

  const paletteContainer = input as { colors?: unknown; palette?: unknown };

  if (paletteContainer.colors && typeof paletteContainer.colors === "object") {
    if (isShadeMap(paletteContainer.colors)) {
      return paletteContainer.colors as PaletteShades;
    }
  }

  if (paletteContainer.palette && typeof paletteContainer.palette === "object") {
    if (isShadeMap(paletteContainer.palette)) {
      return paletteContainer.palette as PaletteShades;
    }
  }

  if (isShadeMap(input)) {
    return input as PaletteShades;
  }

  const entries = Object.entries(input as Record<string, unknown>);
  if (entries.length === 1 && isShadeMap(entries[0]?.[1])) {
    return entries[0][1] as PaletteShades;
  }

  return {};
}

function shade(palette: PaletteShades, key: string, fallback: string) {
  return palette[key] ?? fallback;
}

export function mapPaletteToThemeVars(palette: PaletteShades): PaletteMapping {
  const fallback = palette["600"] ?? "oklch(0.6 0 0)";

  const light = {
    "--primary": shade(palette, "900", fallback),
    "--primary-foreground": "oklch(1 0 0)",
    "--accent": shade(palette, "900", fallback),
    "--accent-foreground": "oklch(1 0 0)",
    "--ring": shade(palette, "500", fallback),
    "--sidebar-primary": shade(palette, "900", fallback),
    "--sidebar-accent": shade(palette, "900", fallback),
    "--chart-1": shade(palette, "600", fallback),
    "--chart-2": shade(palette, "500", fallback),
    "--chart-3": shade(palette, "400", fallback),
    "--chart-4": shade(palette, "300", fallback),
    "--chart-5": shade(palette, "200", fallback),
  };

  const dark = {
    "--primary": shade(palette, "400", fallback),
    "--primary-foreground": "oklch(0.12 0 0)",
    "--accent": shade(palette, "400", fallback),
    "--accent-foreground": "oklch(0.12 0 0)",
    "--ring": shade(palette, "400", fallback),
    "--sidebar-primary": shade(palette, "400", fallback),
    "--sidebar-accent": shade(palette, "400", fallback),
    "--chart-1": shade(palette, "300", fallback),
    "--chart-2": shade(palette, "400", fallback),
    "--chart-3": shade(palette, "500", fallback),
    "--chart-4": shade(palette, "600", fallback),
    "--chart-5": shade(palette, "700", fallback),
  };

  return { light, dark };
}
