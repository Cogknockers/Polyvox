"use client";

import { useEffect } from "react";

import { applyThemeStyle } from "@/lib/theme/style";
import type { PaletteShades } from "@/lib/theme/mapping";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const STORAGE_KEY = "polyvox.theme.v1";

type StoredTheme = {
  baseHex: string;
  palette: PaletteShades;
};

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

export default function UserThemeStyle() {
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const loadTheme = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;

      if (user) {
        const { data: row } = await supabase
          .from("user_theme")
          .select("base_hex,palette")
          .eq("user_id", user.id)
          .maybeSingle();

        if (row?.palette) {
          applyThemeStyle(row.palette as PaletteShades);
          return;
        }
      }

      const local = readLocalTheme();
      if (local?.palette) {
        applyThemeStyle(local.palette);
      }
    };

    loadTheme();

    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      loadTheme();
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  return null;
}
