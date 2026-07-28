export type GalleryPhoto = {
  id: string;
  storagePath: string;
  takenDate: string;
  signedUrl: string | null;
};

// Pure display, no delete/upload wiring at all — safe to reuse as-is for the
// coach's read-only view since there's no action here to reach in the first place.
export default function PhotoGrid({
  photos,
  emptyMessage,
}: {
  photos: GalleryPhoto[];
  emptyMessage: string;
}) {
  if (photos.length === 0) {
    return <p className="text-charcoal">{emptyMessage}</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {photos.map((photo) => (
        <figure
          key={photo.id}
          className="overflow-hidden rounded-md border border-neutral bg-white"
        >
          {photo.signedUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo.signedUrl}
              alt={`Progress photo from ${photo.takenDate}`}
              className="aspect-square w-full object-cover"
            />
          ) : (
            <div className="flex aspect-square w-full items-center justify-center bg-background text-xs text-charcoal">
              Unavailable
            </div>
          )}
          <figcaption className="px-2 py-1 text-xs text-charcoal">
            {photo.takenDate}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
