"use client";

import { useEffect, useMemo, useState } from "react";
import { Palette, RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { fetchPaletteFromHex } from "@/lib/theme/tints";
import { applyThemeStyle, clearThemeStyle } from "@/lib/theme/style";
import type { PaletteShades } from "@/lib/theme/mapping";

const STORAGE_KEY = "polyvox.theme.v1";
const SHADE_ORDER = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"];
const PRESETS = [
  "#2522FC",
  "#1367C9",
  "#0EA5A3",
  "#16A34A",
  "#D97706",
  "#C2410C",
  "#DC2626",
  "#7C3AED",
];

type StoredTheme = {
  baseHex: string;
  palette: PaletteShades;
};

function normalizeHexInput(value: string) {
  const cleaned = value.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(cleaned)) {
    return `#${cleaned
      .split("")
      .map((c) => c + c)
      .join("")
      .toUpperCase()}`;
  }
  if (/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    return `#${cleaned.toUpperCase()}`;
  }
  return null;
}

function readLocalTheme(): StoredTheme | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredTheme;
  } catch {
    return null;
  }
}

function writeLocalTheme(theme: StoredTheme) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
}

export default function ThemeColorPicker() {
  const [baseHex, setBaseHex] = useState("#2522FC");
  const [palette, setPalette] = useState<PaletteShades | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const persistTheme = async (normalizedHex: string, paletteToSave: PaletteShades) => {
    applyThemeStyle(paletteToSave);

    const payload: StoredTheme = {
      baseHex: normalizedHex,
      palette: paletteToSave,
    };

    if (userId) {
      const supabase = createSupabaseBrowserClient();
      await supabase.from("user_theme").upsert({
        user_id: userId,
        base_hex: normalizedHex.replace("#", ""),
        palette: paletteToSave,
      });
      setStatus("Applied and saved to your account.");
      toast({
        title: "Applied",
        description: "Theme synced to your account.",
      });
    } else {
      writeLocalTheme(payload);
      setStatus("Applied locally. Sign in to sync across devices.");
      toast({
        title: "Applied",
        description: "Theme saved locally.",
      });
    }
  };

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const loadInitialTheme = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      setUserId(user?.id ?? null);

      if (user) {
        const { data: row } = await supabase
          .from("user_theme")
          .select("base_hex,palette")
          .eq("user_id", user.id)
          .maybeSingle();

        if (row?.palette) {
          setBaseHex(`#${String(row.base_hex).replace(/^#/, "")}`.toUpperCase());
          setPalette(row.palette as PaletteShades);
          return;
        }
      }

      const local = readLocalTheme();
      if (local?.palette) {
        setBaseHex(local.baseHex.toUpperCase());
        setPalette(local.palette);
      }
    };

    loadInitialTheme();
  }, []);

  const previewShades = useMemo(() => {
    if (!palette) return SHADE_ORDER.map((shade) => ({ shade, value: null }));
    return SHADE_ORDER.map((shade) => ({ shade, value: palette[shade] ?? null }));
  }, [palette]);

  const handleGenerate = async () => {
    setStatus(null);
    const normalized = normalizeHexInput(baseHex);
    if (!normalized) {
      setStatus("Enter a valid hex value (3 or 6 digits).");
      return;
    }

    setLoading(true);
    try {
      const { palette: nextPalette } = await fetchPaletteFromHex(normalized);
      setPalette(nextPalette);
      setBaseHex(normalized);
      await persistTheme(normalized, nextPalette);
      setStatus("Palette generated and applied.");
    } catch {
      setStatus("Unable to generate palette right now.");
      toast({
        title: "Palette failed",
        description: "Unable to generate a palette right now.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    setStatus(null);
    if (!palette) {
      setStatus("Generate a palette first.");
      return;
    }

    const normalized = normalizeHexInput(baseHex);
    if (!normalized) {
      setStatus("Enter a valid hex value.");
      return;
    }

    await persistTheme(normalized, palette);
  };

  const handleReset = async () => {
    clearThemeStyle();
    setPalette(null);
    setStatus("Theme reset to default.");
    toast({
      title: "Reset",
      description: "Theme restored to default.",
    });

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }

    if (userId) {
      const supabase = createSupabaseBrowserClient();
      await supabase.from("user_theme").delete().eq("user_id", userId);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="text-lg">Theme</CardTitle>
          <p className="text-sm text-muted-foreground">
            Pick a base color to personalize Polyvox.
          </p>
        </div>
        <Palette className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div className="space-y-2">
            <Label htmlFor="theme-hex">Base color</Label>
            <Input
              id="theme-hex"
              value={baseHex}
              onChange={(event) => setBaseHex(event.target.value)}
              placeholder="#2522FC"
            />
          </div>
          <Button onClick={handleGenerate} disabled={loading} className="w-full md:w-auto">
            {loading ? "Generating..." : "Generate palette"}
          </Button>
        </div>

        <div className="space-y-3">
          <Label>Presets</Label>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setBaseHex(preset)}
                className="h-8 w-8 rounded-full border border-border"
                style={{ background: preset }}
                aria-label={`Preset ${preset}`}
              />
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <Label>Palette preview</Label>
          <TooltipProvider>
            <div className="flex flex-wrap gap-2">
              {previewShades.map((shade) => (
                <Tooltip key={shade.shade}>
                  <TooltipTrigger asChild>
                    <div
                      className="flex h-8 w-10 items-end justify-center rounded-md border border-border text-[10px] font-medium text-foreground/80"
                      style={{ background: shade.value ?? "var(--muted)" }}
                    >
                      {shade.shade}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {shade.value ?? "No value"}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={handleApply}>Apply</Button>
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <RefreshCcw className="h-4 w-4" />
            Reset to default
          </Button>
        </div>

        {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
        {!userId ? (
          <p className="text-xs text-muted-foreground">
            Sign in to sync your theme across devices.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
