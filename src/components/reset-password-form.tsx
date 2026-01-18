"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function ResetPasswordForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={(event) => {
        event.preventDefault();
        toast({
          title: "Password reset coming soon",
          description: "Reset flows will be enabled after auth wiring.",
        });
      }}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Create a new password
          </h1>
          <p className="text-sm text-muted-foreground">
            Choose a new password for your Polyvox account.
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="password">New password</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="confirm-password">Confirm password</FieldLabel>
          <Input
            id="confirm-password"
            name="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            required
          />
          <FieldDescription>Re-enter to confirm your new password.</FieldDescription>
        </Field>
        <Field>
          <Button type="submit">Update password</Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
