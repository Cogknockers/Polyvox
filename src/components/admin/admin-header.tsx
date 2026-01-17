"use client";

import Link from "next/link";
import { Menu, Settings } from "lucide-react";

import PolyvoxLogo from "@/components/brand/polyvox-logo";
import { AdminSidebarNav } from "@/components/admin/admin-sidebar";
import ProfileMenu from "@/components/app/profile-menu";
import ThemeToggle from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function AdminHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="flex w-full items-center justify-between gap-4 px-6 py-3">
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 lg:hidden">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader>
                <SheetTitle>Admin</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <AdminSidebarNav />
              </div>
            </SheetContent>
          </Sheet>
          <PolyvoxLogo variant="app" size="sm" />
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Admin
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="hidden h-9 px-3 text-sm sm:inline-flex"
            asChild
          >
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
          <Button
            variant="ghost"
            className="hidden h-9 px-3 text-sm sm:inline-flex"
            asChild
          >
            <Link href="/help">Help</Link>
          </Button>
          <Button
            variant="ghost"
            className="hidden h-9 px-3 text-sm sm:inline-flex"
            asChild
          >
            <Link href="/login">Sign in</Link>
          </Button>
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
            <Link href="/settings" aria-label="Settings">
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}
