"use client";

import Link from "next/link";
import { unlinkClient, resendInvite } from "./actions";

export default function ClientRow({
  client,
  lastActiveLabel,
}: {
  client: { id: string; full_name: string | null; email: string };
  lastActiveLabel: string;
}) {
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3">
      <Link href={`/coach/clients/${client.id}`} className="min-w-0 flex-1 hover:opacity-80">
        <span className="block text-body text-ink">{client.full_name || "Unnamed client"}</span>
        <span className="block text-caption text-charcoal">{client.email}</span>
      </Link>
      <span className="shrink-0 text-body-sm text-charcoal">{lastActiveLabel}</span>
      <div className="flex shrink-0 gap-3">
        <form action={async () => { await resendInvite(client.id); }}>
          <button type="submit" className="text-caption text-accent hover:underline">
            Resend invite
          </button>
        </form>
        <form
          action={async () => { await unlinkClient(client.id); }}
          onSubmit={(e) => {
            if (
              !confirm(
                `Remove ${client.full_name || client.email} from your client list? Their account and history stay intact — you can re-invite the same email later to reconnect them.`
              )
            ) {
              e.preventDefault();
            }
          }}
        >
          <button type="submit" className="text-caption text-warning hover:underline">
            Delete
          </button>
        </form>
      </div>
    </li>
  );
}
