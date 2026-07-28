"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_UPLOAD_BYTES,
  decodeImage,
  resizeAndCompress,
} from "@/lib/image";
import { createProgressPhoto } from "./photoActions";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function PhotoUploadForm({ clientId }: { clientId: string }) {
  const [takenDate, setTakenDate] = useState(today());
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // always reset so picking the same file again re-fires onChange
    if (!file) return;

    setError(null);

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError("That file isn't a JPEG, PNG, or WebP image — choose a different file.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError("That file is over the 20MB limit — choose a smaller one.");
      return;
    }

    setUploading(true);
    try {
      // Decoding as an image is also the real content check: a renamed
      // non-image file fails here regardless of its extension or MIME type.
      const bitmap = await decodeImage(file);
      const blob = await resizeAndCompress(bitmap);
      bitmap.close();

      const path = `${clientId}/${crypto.randomUUID()}.jpg`;
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from("progress-photos")
        .upload(path, blob, { contentType: "image/jpeg" });

      if (uploadError) throw uploadError;

      await createProgressPhoto({ storagePath: path, takenDate });
    } catch {
      setError("That file couldn't be read as an image — try a different one.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3 rounded border border-neutral bg-white p-4">
      <h2 className="font-display text-display-sm text-ink">Upload a progress photo</h2>

      {error && (
        <p className="rounded border border-warning/30 bg-warning/10 px-3 py-2 text-body-sm text-warning">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label htmlFor="taken_date" className="block text-body-sm text-charcoal">
            Date taken
          </label>
          <input
            id="taken_date"
            type="date"
            value={takenDate}
            onChange={(e) => setTakenDate(e.target.value)}
            className="rounded border border-neutral px-3 py-2 font-mono text-data tabular-nums text-ink focus:border-accent"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="photo_file" className="block text-body-sm text-charcoal">
            Photo
          </label>
          <input
            id="photo_file"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={uploading}
            onChange={handleFileChange}
            className="text-body-sm text-ink"
          />
        </div>

        {uploading && <span className="text-body-sm text-charcoal">Uploading…</span>}
      </div>
    </div>
  );
}
