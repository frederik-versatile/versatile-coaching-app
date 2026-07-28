import type { MealBlock } from "@/lib/nutrition";

// Shared read-only renderer for both the coach's "current" preview and the
// client's own nutrition view — no edit affordances live here at all.
export default function MealBlocksView({ blocks }: { blocks: MealBlock[] }) {
  if (!blocks || blocks.length === 0) {
    return <p className="text-body-sm text-charcoal">No meals listed.</p>;
  }

  return (
    <ul className="mt-2 space-y-2">
      {blocks.map((block, i) => (
        <li key={i} className="rounded bg-background px-3 py-2 text-body-sm">
          <p className="font-medium text-ink">{block.label || "Untitled"}</p>
          {block.description && (
            <p className="whitespace-pre-wrap text-charcoal">{block.description}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
