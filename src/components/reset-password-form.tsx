"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
      <TooltipProvider>
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
            <Tooltip>
              <TooltipTrigger asChild>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </TooltipTrigger>
              <TooltipContent className="text-xs">
                Choose a new password for your account.
              </TooltipContent>
            </Tooltip>
          </Field>
          <Field>
            <FieldLabel htmlFor="confirm-password">Confirm password</FieldLabel>
            <Tooltip>
              <TooltipTrigger asChild>
                <Input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  required
                />
              </TooltipTrigger>
              <TooltipContent className="text-xs">
                Re-enter to confirm your new password.
              </TooltipContent>
            </Tooltip>
          </Field>
          <Field>
            <Button type="submit">Update password</Button>
          </Field>
        </FieldGroup>
      </TooltipProvider>
    </form>
  );
}
