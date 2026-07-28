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
