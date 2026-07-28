"use client";

import { useState } from "react";
import { deleteProgressPhoto } from "./photoActions";
import type { GalleryPhoto } from "./PhotoGrid";

export default function PhotoGallery({ photos }: { photos: GalleryPhoto[] }) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(photo: GalleryPhoto) {
    if (!confirm("Delete this photo? This can't be undone.")) return;
    setDeletingId(photo.id);
    await deleteProgressPhoto({
      photoId: photo.id,
      storagePath: photo.storagePath,
    });
    setDeletingId(null);
  }

  if (photos.length === 0) {
    return (
      <p className="text-body text-charcoal">
        No progress photos yet — upload one to start tracking.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {photos.map((photo) => (
        <figure
          key={photo.id}
          className="overflow-hidden rounded border border-neutral bg-white"
        >
          {photo.signedUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo.signedUrl}
              alt={`Progress photo from ${photo.takenDate}`}
              className="aspect-square w-full object-cover"
            />
          ) : (
            <div className="flex aspect-square w-full items-center justify-center bg-background text-caption text-charcoal">
              Unavailable
            </div>
          )}
          <figcaption className="flex items-center justify-between px-2 py-1 text-caption text-charcoal">
            <span className="font-mono tabular-nums">{photo.takenDate}</span>
            <button
              type="button"
              disabled={deletingId === photo.id}
              onClick={() => handleDelete(photo)}
              className="text-warning hover:underline disabled:opacity-50"
            >
              {deletingId === photo.id ? "Deleting…" : "Delete"}
            </button>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
