"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { signInWithPasswordAction, type LoginActionState } from "@/app/(auth)/login/actions";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [state, formAction] = useActionState<LoginActionState, FormData>(
    signInWithPasswordAction,
    {},
  );

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      action={formAction}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Return to the public arena
          </h1>
          <p className="text-sm text-muted-foreground">
            Polyvox helps communities surface problems, test leadership, and converge
            transparently—before Election Day.
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="m@example.com"
            autoComplete="email"
            required
          />
        </Field>
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Link
              href="#"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Forgot your password?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </Field>
        <Field>
          <SubmitButton />
          {state?.error ? (
            <p className="text-sm text-destructive" role="status">
              {state.error}
            </p>
          ) : null}
        </Field>
        <FieldSeparator>Or continue with</FieldSeparator>
        <Field>
          <Button
            variant="outline"
            type="button"
            onClick={(event) => {
              event.preventDefault();
              toast({
                title: "Google sign-in coming soon",
                description: "UI preview only. OAuth will be wired later.",
              });
            }}
          >
            <GoogleIcon className="mr-2 h-4 w-4" />
            Continue with Google
          </Button>
        </Field>
      </FieldGroup>
      <div className="space-y-2">
        <p className="px-8 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="underline underline-offset-4 hover:text-primary"
          >
            Join Polyvox
          </Link>
        </p>
        <p className="px-8 text-center text-xs text-muted-foreground">
          Polyvox is a civic platform. It doesn’t replace elections—it helps communities
          prepare for them.
        </p>
      </div>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Signing in..." : "Login"}
    </Button>
  );
}

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" {...props}>
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.2 3.6l6.86-6.86C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.57 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.14-3.09-.4-4.55H24v9.02h12.98c-.56 3-2.26 5.55-4.81 7.26l7.78 6.04C44.6 37.98 46.98 31.87 46.98 24.55z"
      />
      <path
        fill="#FBBC05"
        d="M10.54 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.98-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.14 15.9-5.82l-7.78-6.04c-2.16 1.45-4.92 2.3-8.12 2.3-6.26 0-11.57-4.07-13.46-9.59l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
      <path fill="none" d="M0 0h48v48H0z" />
    </svg>
  );
}
