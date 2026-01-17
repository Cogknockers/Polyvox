"use server";

import { z } from "zod";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/auth/profile";

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type LoginActionState = {
  error?: string;
};

export async function signInWithPasswordAction(
  _prevState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    await ensureProfile(
      {
        userId: data.user.id,
        email: data.user.email ?? parsed.data.email,
        displayName: data.user.user_metadata?.display_name,
        username: data.user.user_metadata?.username,
      },
      supabase,
    );
  }

  redirect("/dashboard");
}
