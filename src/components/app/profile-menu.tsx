"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AvatarBadge from "@/components/profile/avatar-badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ProfileMenu() {
  const router = useRouter();
  const [isAuthed, setIsAuthed] = useState(false);
  const [userLabel, setUserLabel] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [badgeColor, setBadgeColor] = useState<string>("none");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let active = true;

    const check = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!active) return;

      setIsAuthed(Boolean(user));
      if (!user) {
        setUserLabel(null);
        setUserEmail(null);
        return;
      }

      setUserEmail(user.email ?? null);
      const [{ data: profile }, { data: preferences }] = await Promise.all([
        supabase
          .from("profiles")
          .select("display_name,username,avatar_url")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("user_preferences")
          .select("badge_color")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      const display =
        profile?.display_name || profile?.username || user.email || "User";
      setUserLabel(display);
      setAvatarUrl(profile?.avatar_url ?? null);
      setBadgeColor(preferences?.badge_color ?? "none");
    };

    check();
    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      check();
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Avatar className="relative h-8 w-8">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt="Profile avatar" />
            ) : null}
            <AvatarFallback>
              {(userLabel ?? "PV").slice(0, 2).toUpperCase()}
            </AvatarFallback>
            <AvatarBadge badgeColor={badgeColor} />
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-foreground">
            {userLabel ?? "Guest"}
          </span>
          <span className="text-xs text-muted-foreground">
            {userEmail ?? "Not signed in"}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">Settings</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/help">Help</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {isAuthed ? (
          <DropdownMenuItem onClick={handleSignOut}>Sign out</DropdownMenuItem>
        ) : (
          <DropdownMenuItem asChild>
            <Link href="/login">Sign in</Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
