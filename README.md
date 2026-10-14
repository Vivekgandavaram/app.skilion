# Skilion

People × skills × proof of work. Skilion helps people find collaborators by what they have built, to **validate an idea, build a prototype, get help, or start a company** — in spare time or full time. It is not a freelancing marketplace.

**Stack (all with a free tier):** Next.js 15 (App Router, React 19, TypeScript) · MongoDB Atlas M0 · Vercel · Resend (email OTP) · Google + GitHub OAuth (hand-written, PKCE) · Gemini (free API key) · Razorpay.

## What is in the box

| Area | Pages / features |
| --- | --- |
| Public site (static, SEO) | Home, How it works, For founders, For builders, About, Pricing, Resources (+6 guides), Showcase, Contact, Terms, Privacy, Cookies, Guidelines, Security, Appeal. Sitemap, robots, manifest, JSON-LD (Organization, WebSite, FAQ, Article, Breadcrumb, CreativeWork, ProfilePage). |
| Accounts | Email + password with OTP verification (Resend), Google, GitHub, forgot/reset, optional email-OTP two-step sign-in, 6-step onboarding. |
| Profiles | Proof-of-work projects, skills with "supported by evidence" markers, honest verification badges (each says what was checked), endorsements, availability grid (time zones), privacy toggles, public/private page. |
| Discover & Explore | Feed with opportunity posts (goal, rewards, skills), link previews, likes/saves/comments, spam controls. People search with filters, saved searches, optional AI "Smart" query parsing. |
| Build an idea | AI Squad Architect (Gemini, template fallback) → editable roles/milestones/risks → explainable matches → **Squad Cart** (coverage, compare, budget, 7-day availability heatmap on Founder Pro, read-only advisor link) → invitations. |
| Messaging | Bond (mutual connection) unlocks 1:1 chat; squad chats are created from projects. Message requests, read receipts, typing, mute, block, search, delete, report. (Polling, see limits.) |
| Projects | Tasks board, milestones, check-ins, decisions, links, activity, progress summary, public showcase with per-member consent. |
| Billing | Razorpay Orders (UPI/cards/netbanking), GST breakdown, signature verification + webhook, receipts, plan limits enforced server-side. |
| Admin | Overview, reports queue, members, verification, appeals, content, system switches (signups/AI/maintenance), demo-data purge, audit log. |
| Illustrations | 26 placeholder slots with ready AI prompts (see below). |

## Run it locally (5 minutes)

```bash
npm install
cp .env.example .env.local     # fill what you have; everything degrades gracefully
npm run dev                     # http://localhost:3000
```

Only `MONGODB_URI` and `AUTH_SECRET` are needed to sign up and use the app. Without Resend the OTP is printed in the server log and shown in the form in development. Without Gemini you get template plans. Without Razorpay the checkout shows "not configured".

## Set up each service

1. **MongoDB Atlas (free M0)** — create a cluster, a database user, and allow network access `0.0.0.0/0` (Vercel uses dynamic IPs). Put the connection string in `MONGODB_URI`. Indexes are created automatically on first use.
2. **AUTH_SECRET** — `openssl rand -base64 48`.
3. **ADMIN_EMAILS** — comma separated; those accounts get the admin role at sign-up/login.
4. **Resend** — create an API key → `RESEND_API_KEY`. Verify `vigotech.in` in Resend and configure the approved sender `RESEND_FROM="Skilion <noreply@vigotech.in>"` before sending to users.
5. **Google OAuth** — Google Cloud Console → APIs & Services → Credentials → OAuth client (Web). Authorised redirect URI: `{SITE_URL}/api/auth/google/callback`. Add both localhost and production URIs.
6. **GitHub OAuth** — Settings → Developer settings → OAuth Apps. Callback: `{SITE_URL}/api/auth/github/callback`.
7. **Gemini** — free key at aistudio.google.com → `GEMINI_API_KEY`.
8. **Razorpay** — Dashboard → API keys (test mode first). Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and the same id in `NEXT_PUBLIC_RAZORPAY_KEY_ID`. Webhook: `{SITE_URL}/api/billing/webhook`, events `payment.captured`, `order.paid`, `payment.failed`, `refund.processed`, secret → `RAZORPAY_WEBHOOK_SECRET`. Set `GST_PERCENT` with your accountant.

## Deploy to Vercel

1. Push the repo to GitHub, import it in Vercel (framework: Next.js).
2. Add every variable from `.env.example` (set `NEXT_PUBLIC_SITE_URL` to the production URL).
3. Deploy. Add the production callback URLs to Google/GitHub/Razorpay.
4. Sign up with an `ADMIN_EMAILS` address, open `/admin`.
5. Before launch: Admin → System → check all services show "Configured".

## Illustrations: placeholders → real images → auto-update

Every image on the site is an `<Illustration id="..." />` slot that renders a branded placeholder showing its size and an **AI prompt**.

1. Open `docs/ILLUSTRATION_PROMPTS.md` (or `npm run assets:prompts` to regenerate). Each slot has size, where it appears, and a prompt that follows the brand rules.
2. Generate the image with any AI tool and save it as `public/illustrations/<slot-id>.webp` (png/jpg/svg/avif also work).
3. `npm run assets:watch` (second terminal while developing) or `npm run assets:sync` registers new files; `dev` and `build` also run it. The placeholder is replaced automatically. An IDE agent can do steps 2–3 on its own.
4. Add slots in `src/data/illustrations.ts`. Set `NEXT_PUBLIC_SHOW_PROMPTS=1` to show prompts in production placeholders.

Brand rules baked in: Skilion wordmark only on dark surfaces; icy blue brand colour, vermilion only for actions; Manrope + Inter; restrained glass; no purple/pink.

## Architecture in brief

- `src/app/(site)` static marketing, `(auth)` sign-in flows, `(app)` signed-in product (public-readable: `/discover`, `/explore`, `/u/[handle]`).
- `src/app/api/**` route handlers, all wrapped by `route()` in `src/lib/api.ts`: auth (cookie JWT, httpOnly), role checks, verified-email gating, CSRF origin check, Mongo-backed rate limits, uniform JSON errors. Route files export only HTTP handlers; shared schemas live in `src/lib/schemas.ts`.
- `src/lib/plans.ts` is the single source of truth for pricing and entitlements (UI, API and checkout read it).
- `src/lib/match.ts` — explainable matching from profile data only; never uses protected attributes.
- Security: OTPs stored as HMAC hashes (10 min, 5 tries); OAuth state + PKCE; unverified password accounts lose their credential when OAuth links the same email; SSRF-guarded link previews; CSP/security headers in `next.config.mjs`; users can export and delete their data.

## Honest limits (read before launch)

- **Not tested against a live database or real provider keys.** The code type-checks, the production build passes, and public pages were smoke-tested, but the sandbox it was built in had no MongoDB and no Google/GitHub/Resend/Gemini/Razorpay credentials. Expect to fix small integration issues on first run; do a full test pass in Razorpay **test mode** before taking money.
- **Messaging is polling-based** (2.5 s in an open chat, 8 s for the list) because Vercel serverless has no persistent sockets. It is real-time enough for part-time teams. Swap in Ably/Pusher/Supabase Realtime if you need push. No file attachments yet.
- **Plans are one-time (month/year) purchases with no auto-renew.** Expired plans fall back to Free; data is never deleted.
- Availability overlap ignores daylight-saving changes (stated in the UI).
- Searching uses MongoDB text indexes (good for MVP scale). Move to Atlas Search for typo tolerance and ranking at scale.
- **Legal pages (Terms, Privacy, Cookies, Guidelines) are drafts.** Have a lawyer review them for your jurisdiction (India: DPDP Act, GST invoicing) before launch.
- Identity checks are manual (admin reviews evidence). The badge says only "Identity checked".

## Scripts

`dev`, `build`, `start`, `typecheck`, `assets:sync`, `assets:watch`, `assets:prompts`.

## Showing illustration slots while you generate art

Empty illustration slots are hidden on a production build so visitors never see placeholder boxes. To see them (with the AI prompts) set `NEXT_PUBLIC_SHOW_SLOTS=1` in `.env.local` or in Vercel. Drop finished images into `public/illustrations/` and run `npm run assets:sync`; they appear in place automatically. The home page uses a drawn product preview instead of illustrations.

## Keyboard

Ctrl K or Cmd K opens the command menu. Two-key shortcuts when no field is focused: `g d` Discover, `g e` Explore, `g b` Build an idea, `g t` My Team, `g m` Messages, `g p` Projects.
