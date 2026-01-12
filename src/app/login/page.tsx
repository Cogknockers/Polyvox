import Link from "next/link";

import PolyvoxLogo from "@/components/brand/polyvox-logo";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <PolyvoxLogo variant="auth" size="lg" />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
            <div className="mt-4 space-y-2 text-center text-sm text-muted-foreground">
              <p>
                Don&apos;t have an account?{" "}
                <Link href="/register" className="underline underline-offset-4">
                  Join Polyvox
                </Link>
              </p>
              <Link href="/" className="underline underline-offset-4">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <img
          src="/img/img-auth-10.png"
          alt="Polyvox community map"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    </div>
  );
}
