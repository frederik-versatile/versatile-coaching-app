# Dependency audit decisions

## 2026-07-28: staying on Next.js 14.2.35 (not upgrading to 15/16)

`npm audit` reports 16 high-severity advisories, all rooted in three chains: `next`, its bundled `postcss`, and the `eslint`/`brace-expansion` dev-tooling chain. None have a patch-level fix — 14.2.35 is the last stable 14.x release Next.js will ever publish; every advisory requires 15.x or 16.x.

**Reachable in this app**, given no `next/image` usage, no rewrites, no custom server, no i18n, no WebSockets, no CSP nonces, and Server Actions on the default Node runtime:
- DoS with Server Components (GHSA-q4gf-8mx6-v5v3, GHSA-8h8q-6873-q5fj)
- DoS in App Router using Server Actions (GHSA-m99w-x7hq-7vfj)
- Middleware/proxy redirect cache poisoning (GHSA-3g8h-86w9-wvmq)
- RSC cache-poisoning / cache-confusion (GHSA-vfv6-92ff-j949, GHSA-68g3-v927-f742, GHSA-4633-3j49-mh5q, GHSA-wfc6-r584-vfw7)
- Unauthenticated disclosure of internal Server Function endpoints (GHSA-955p-x3mx-jcvp)

**Not reachable** given current config: both Image Optimizer DoS advisories, HTTP request smuggling/SSRF in rewrites, SSRF in Server Actions on custom servers, WebSocket SSRF, Pages Router i18n middleware bypass, XSS via CSP nonces / `beforeInteractive` scripts, unbounded Server Action payload in Edge runtime, unbounded `next/image` disk cache.

The `eslint`/`brace-expansion`/`postcss` chain is build-time/dev-tooling only — never touches a runtime request.

**Decision**: stay on 14.x. The upgrade to 15+ is a real breaking migration (`params`/`searchParams`/`headers()`/`cookies()` all become async, forcing a React 18→19 bump with unverified `recharts`/`@supabase/ssr` compatibility) touching nearly every route in the app. Given real client data is about to start flowing in, the migration's own risk of introducing new bugs right now was judged worse than the narrower, known, DoS-class residual risk on 14.x. Revisit as a dedicated, fully-retested migration effort — not bundled into a hardening pass.

**Follow-up**: re-run this audit periodically; if the app ever starts using rewrites, `next/image`, Edge runtime, or WebSockets, more of the "not reachable" advisories above become live and this decision should be revisited immediately, not on the next scheduled review.

# Auth & infrastructure hardening decisions (Phase 7)

## 2026-07-28: password policy and backups on Supabase free tier

**Password policy**: Supabase's dashboard controls for password character requirements and leaked-password protection are gated behind a paid plan — not available to configure on the free tier. Mitigated in-app: public signup is closed (invite-only since Phase 6), and `/set-password` enforces a client-side 8-character minimum, so no account created through the app can end up with a shorter password. Residual gap: Supabase's own platform-level floor (historically 6 characters) would still apply to anyone who called the Auth API directly, bypassing the app UI — narrow, since account creation is invite-only, but not zero.

**Backups**: confirmed there is **no backup or point-in-time-recovery coverage at all** on the free tier — not short retention, none. Options considered: upgrade to Supabase Pro ($25/mo, daily backups + PITR add-on), a DIY scheduled `pg_dump` via GitHub Actions, or accept the risk for now.

**Decision**: accept the risk for now, given the current scale (two real accounts, low data volume). Revisit before onboarding more clients or once data volume/stakes increase — this is not a "solved" item, just a deliberately deferred one.
