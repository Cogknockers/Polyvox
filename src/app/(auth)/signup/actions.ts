"use server";

import { z } from "zod";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/auth/profile";

const signUpSchema = z
  .object({
    fullName: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type SignupActionState = {
  error?: string;
  success?: string;
};

export async function signUpWithPasswordAction(
  _prevState: SignupActionState,
  formData: FormData,
): Promise<SignupActionState> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const message =
      parsed.error.errors[0]?.message ?? "Enter a valid name, email, and password.";
    return { error: message };
  }

  const { fullName, email, password } = parsed.data;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: fullName,
        username: fullName,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    await ensureProfile(
      {
        userId: data.user.id,
        email: data.user.email ?? email,
        displayName: fullName,
        username: fullName,
      },
      supabase,
    );
  }

  if (data.session) {
    redirect("/dashboard");
  }

  return {
    success: "Check your email to confirm your account, then sign in.",
  };
}
