"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type PreferencesRow = {
  theme_mode: "system" | "light" | "dark";
  theme_primary_oklch: string | null;
  theme_accent_seed: string | null;
  reduce_motion: boolean;
};

function applyPreferences(preferences: PreferencesRow | null, setTheme: (theme: string) => void) {
  if (!preferences) return;

  if (preferences.theme_mode) {
    setTheme(preferences.theme_mode);
  }

  const root = document.documentElement;
  const primary = preferences.theme_primary_oklch?.trim();
  const accentSeed = preferences.theme_accent_seed?.trim();

  if (primary) {
    root.style.setProperty("--primary", primary);
    root.style.setProperty("--accent", primary);
  } else {
    root.style.removeProperty("--primary");
    root.style.removeProperty("--accent");
  }

  if (!primary && accentSeed) {
    root.style.setProperty("--accent", accentSeed);
  }

  if (preferences.reduce_motion) {
    root.setAttribute("data-reduce-motion", "true");
  } else {
    root.removeAttribute("data-reduce-motion");
  }
}

export default function ThemePreferencesProvider() {
  const { setTheme } = useTheme();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let active = true;

    const load = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user) {
        applyPreferences(null, setTheme);
        return;
      }

      const { data: row } = await supabase
        .from("user_preferences")
        .select("theme_mode,theme_primary_oklch,theme_accent_seed,reduce_motion")
        .eq("user_id", user.id)
        .maybeSingle();

      if (active) {
        applyPreferences(row ?? null, setTheme);
      }
    };

    load();
    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [setTheme]);

  return null;
}
