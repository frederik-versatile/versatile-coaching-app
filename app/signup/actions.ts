"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signup(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("full_name") as string;
  const role = formData.get("role") as string;

  const supabase = createClient();

  // TEMPORARY (Phase 0 only): the signup form lets the user pick their own
  // role, and this is passed straight into auth user metadata for the
  // handle_new_user trigger to read. Anyone can currently self-select
  // "coach". That's acceptable while it's just internal testing, but before
  // any real client signs up this must be replaced with a coach-invite flow
  // (role assigned server-side, never chosen by the signing-up user).
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role,
        full_name: fullName,
      },
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  if (!data.session) {
    // Supabase project has "Confirm email" enabled, so there's no session yet.
    redirect(
      `/login?error=${encodeURIComponent(
        "Account created — check your email to confirm it, then log in."
      )}`
    );
  }

  redirect(role === "coach" ? "/coach/dashboard" : "/client/dashboard");
}
