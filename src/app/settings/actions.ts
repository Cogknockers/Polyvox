"use server";

import { updatePreferencesAction as updateProfilePreferencesAction } from "@/app/profile/actions";
import type { PreferencesActionState } from "@/app/profile/actions";

export async function updatePreferencesAction(
  prevState: PreferencesActionState,
  formData: FormData,
) {
  return updateProfilePreferencesAction(prevState, formData);
}
