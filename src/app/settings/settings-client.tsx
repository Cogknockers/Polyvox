"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

import type { UserPreferencesRow } from "@/lib/data/preferences";
import { updatePreferencesAction } from "@/app/settings/actions";
import type { PreferencesActionState } from "@/app/profile/actions";
import { toast } from "@/hooks/use-toast";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type SettingsClientProps = {
  preferences: UserPreferencesRow | null;
  voteWeight: number | null;
};

export default function SettingsClient({
  preferences,
  voteWeight,
}: SettingsClientProps) {
  const displayVoteWeight =
    typeof voteWeight === "number" && Number.isFinite(voteWeight)
      ? voteWeight
      : 1;
  const [state, action] = useActionState<PreferencesActionState, FormData>(
    updatePreferencesAction,
    {},
  );
  const [themeMode, setThemeMode] = useState<"system" | "light" | "dark">(
    preferences?.theme_mode ?? "system",
  );
  const [badgeColor, setBadgeColor] = useState(
    preferences?.badge_color ?? "none",
  );
  const [reduceMotion, setReduceMotion] = useState(
    preferences?.reduce_motion ?? false,
  );

  useEffect(() => {
    if (state.ok) {
      toast({ title: "Settings saved" });
    }
    if (state.error) {
      toast({ title: "Save failed", description: state.error });
    }
  }, [state.ok, state.error]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-6">
            <Tabs defaultValue="appearance">
              <TabsList className="flex w-full flex-wrap">
                <TabsTrigger value="appearance">Appearance</TabsTrigger>
                <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
                <TabsTrigger value="account">Account</TabsTrigger>
              </TabsList>

              <TabsContent value="appearance" className="mt-6">
                <FieldGroup>
                  <Field>
                    <FieldLabel>Theme mode</FieldLabel>
                    <Select
                      value={themeMode}
                      onValueChange={(value) =>
                        setThemeMode(value as "system" | "light" | "dark")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system">System</SelectItem>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                      </SelectContent>
                    </Select>
                    <input type="hidden" name="theme_mode" value={themeMode} />
                    <FieldError>{state.fieldErrors?.theme_mode}</FieldError>
                  </Field>

                  <Field>
                    <FieldLabel>Badge color</FieldLabel>
                    <Select value={badgeColor} onValueChange={setBadgeColor}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select badge color" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="red">Red</SelectItem>
                        <SelectItem value="blue">Blue</SelectItem>
                        <SelectItem value="green">Green</SelectItem>
                        <SelectItem value="yellow">Yellow</SelectItem>
                        <SelectItem value="purple">Purple</SelectItem>
                        <SelectItem value="orange">Orange</SelectItem>
                        <SelectItem value="gray">Gray</SelectItem>
                      </SelectContent>
                    </Select>
                    <input type="hidden" name="badge_color" value={badgeColor} />
                    <FieldError>{state.fieldErrors?.badge_color}</FieldError>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="theme_primary_oklch">
                      Theme primary (oklch)
                    </FieldLabel>
                    <Input
                      id="theme_primary_oklch"
                      name="theme_primary_oklch"
                      defaultValue={preferences?.theme_primary_oklch ?? ""}
                      placeholder="oklch(0.6 0.2 260)"
                    />
                    <FieldDescription>
                      Optional override for the primary token.
                    </FieldDescription>
                    <FieldError>{state.fieldErrors?.theme_primary_oklch}</FieldError>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="theme_accent_seed">
                      Theme accent seed
                    </FieldLabel>
                    <Input
                      id="theme_accent_seed"
                      name="theme_accent_seed"
                      defaultValue={preferences?.theme_accent_seed ?? ""}
                      placeholder="#2522fc"
                    />
                    <FieldDescription>
                      Hex seed used for brand accents.
                    </FieldDescription>
                    <FieldError>{state.fieldErrors?.theme_accent_seed}</FieldError>
                  </Field>
                </FieldGroup>
              </TabsContent>

              <TabsContent value="accessibility" className="mt-6">
                <FieldGroup>
                  <Field orientation="horizontal">
                    <FieldLabel>Reduce motion</FieldLabel>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={reduceMotion}
                        onCheckedChange={setReduceMotion}
                      />
                      <span className="text-sm text-muted-foreground">
                        {reduceMotion ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    <input
                      type="hidden"
                      name="reduce_motion"
                      value={reduceMotion ? "true" : "false"}
                    />
                    <FieldError>{state.fieldErrors?.reduce_motion}</FieldError>
                  </Field>
                </FieldGroup>
              </TabsContent>

              <TabsContent value="account" className="mt-6">
                <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
                  Account controls will appear here.
                </div>
              </TabsContent>
            </Tabs>

            <Separator />
            <div className="flex flex-wrap gap-3">
              <PreferencesSubmit label="Save settings" />
              <Button type="submit" name="intent" value="reset" variant="outline">
                Reset theme
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Voting Weight (beta)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p className="text-2xl font-semibold text-foreground">
            {displayVoteWeight.toFixed(2)}
          </p>
          <p>
            Based on recent voting balance. This does not change totals yet.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function PreferencesSubmit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : label}
    </Button>
  );
}
