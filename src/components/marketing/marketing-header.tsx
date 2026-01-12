import Link from "next/link";
import { ArrowRight } from "lucide-react";

import PolyvoxLogo from "@/components/brand/polyvox-logo";
import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Features", href: "/#features" },
  { label: "Governance", href: "/#governance" },
  { label: "FAQ", href: "/#faq" },
];

export default function MarketingHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <PolyvoxLogo variant="marketing" size="md" />
        <nav className="flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
          {navLinks.map((link) => (
            <Link key={link.label} href={link.href} className="hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/register">
              Join Polyvox
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
