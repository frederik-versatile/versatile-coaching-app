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

  const host = headers().get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const redirectTo = `${protocol}://${host}/set-password`;

  const admin = createAdminClient();
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

  // Back on the normal session client, not the admin client: RLS ("coaches
  // manage their own links", which now also requires the caller's own
  // profiles.role to be 'coach') still applies here as defense-in-depth,
  // even though the role check above already gates this action.
  const { error: linkError } = await supabase.from("coach_clients").insert({
    coach_id: user.id,
    client_id: invited.user.id,
  });

  if (linkError) {
    redirect(
      `/coach/dashboard?error=${encodeURIComponent(
        `Invite sent, but linking failed: ${linkError.message}`
      )}`
    );
  }

  revalidatePath("/coach/dashboard");
  redirect(`/coach/dashboard?success=${encodeURIComponent(`Invited ${email}.`)}`);
}
