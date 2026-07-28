"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function inviteClient(formData: FormData) {
  const email = formData.get("email") as string;
  const fullName = formData.get("full_name") as string;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // The service-role client below bypasses RLS entirely, so this role check
  // — run through the caller's own session, subject to normal RLS — is the
  // actual authorization boundary for this action, not a policy.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "coach") {
    redirect(
      `/coach/dashboard?error=${encodeURIComponent(
        "Only coaches can invite clients."
      )}`
    );
  }

  const admin = createAdminClient();

  // A person can already have an account — e.g. invited by another coach
  // before, or (before Phase 6) a leftover direct signup — in which case
  // inviteUserByEmail would just fail with "user already registered". Look
  // their profile up by email first (needs the admin client: RLS would only
  // ever show this coach their own linked clients, not an arbitrary email)
  // and link straight to it instead of re-inviting.
  const { data: existing } = await admin
    .from("profiles")
    .select("id, role")
    .ilike("email", email)
    .maybeSingle();

  let clientId: string;

  if (existing) {
    if (existing.role !== "client") {
      redirect(
        `/coach/dashboard?error=${encodeURIComponent(
          `${email} is already registered as a coach, not a client.`
        )}`
      );
    }
    clientId = existing.id;
  } else {
    const host = headers().get("host");
    const protocol = host?.startsWith("localhost") ? "http" : "https";
    const redirectTo = `${protocol}://${host}/set-password`;

    const { data: invited, error: inviteError } =
      await admin.auth.admin.inviteUserByEmail(email, {
        data: { role: "client", full_name: fullName },
        redirectTo,
      });

    if (inviteError || !invited?.user) {
      redirect(
        `/coach/dashboard?error=${encodeURIComponent(
          inviteError?.message || "Could not send invite."
        )}`
      );
    }

    clientId = invited!.user!.id;
  }

  // Back on the normal session client, not the admin client: RLS ("coaches
  // manage their own links", which now also requires the caller's own
  // profiles.role to be 'coach') still applies here as defense-in-depth,
  // even though the role check above already gates this action.
  const { error: linkError } = await supabase.from("coach_clients").insert({
    coach_id: user.id,
    client_id: clientId,
  });

  if (linkError) {
    const message =
      linkError.code === "23505"
        ? `${email} is already one of your clients.`
        : `Linking failed: ${linkError.message}`;
    redirect(`/coach/dashboard?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/coach/dashboard");
  redirect(
    `/coach/dashboard?success=${encodeURIComponent(
      existing ? `Added ${email} as a client.` : `Invited ${email}.`
    )}`
  );
}
