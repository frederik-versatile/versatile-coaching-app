"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

// The actual file bytes are uploaded client-side directly to Storage (the
// resize/compress step needs the browser's canvas APIs); this just records
// the row once that upload has already succeeded. RLS ("clients manage own
// progress photos") rejects this if client_id isn't the caller.
export async function createProgressPhoto(input: {
  storagePath: string;
  takenDate: string;
}) {
  const { supabase, user } = await requireUser();

  await supabase.from("progress_photos").insert({
    client_id: user.id,
    storage_path: input.storagePath,
    taken_date: input.takenDate,
  });

  revalidatePath("/client/dashboard");
}

export async function deleteProgressPhoto(input: {
  photoId: string;
  storagePath: string;
}) {
  const { supabase } = await requireUser();

  // Delete the file first: if this fails, we bail before touching the row,
  // so a gallery entry never points at an already-deleted file.
  const { error: storageError } = await supabase.storage
    .from("progress-photos")
    .remove([input.storagePath]);

  if (storageError) return;

  await supabase.from("progress_photos").delete().eq("id", input.photoId);

  revalidatePath("/client/dashboard");
}
