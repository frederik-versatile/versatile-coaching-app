import type { SupabaseClient } from "@supabase/supabase-js";
import type { GalleryPhoto } from "@/app/client/dashboard/PhotoGrid";

// Kept short on purpose: confirms signed URLs are minted fresh on every
// server render rather than cached/reused indefinitely.
const SIGNED_URL_TTL_SECONDS = 300;

export async function signPhotoUrls(
  supabase: SupabaseClient,
  photos: { id: string; storage_path: string; taken_date: string }[]
): Promise<GalleryPhoto[]> {
  return Promise.all(
    photos.map(async (photo) => {
      const { data } = await supabase.storage
        .from("progress-photos")
        .createSignedUrl(photo.storage_path, SIGNED_URL_TTL_SECONDS);

      return {
        id: photo.id,
        storagePath: photo.storage_path,
        takenDate: photo.taken_date,
        signedUrl: data?.signedUrl || null,
      };
    })
  );
}
