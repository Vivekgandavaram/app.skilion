# Skilion Android App — Full Build Plan

> Native Kotlin / Jetpack Compose client for **skilion.vigotech.in**
> Same MongoDB + Next.js backend. No fork of the data model.
> Status: plan for approval. Owner: VIGO Tech. Date: 2026-10-24.

---

## 0. TL;DR

| Decision | Choice |
|---|---|
| UI | 100% native Jetpack Compose (Material 3). **No WebView.** |
| Language | Kotlin 2.1+, coroutines + Flow |
| Architecture | Multi-module, MVVM + unidirectional state (`UiState` + `StateFlow`) |
| Networking | Retrofit + OkHttp + kotlinx.serialization |
| Auth | Bearer access token (15 min) + rotating refresh token, plus existing cookie flow untouched for web |
| Offline | Room cache for feed/profile/conversations; WorkManager sync |
| Push | Firebase Cloud Messaging, fired from the existing `notify()` helper |
| Media | New presigned-upload endpoint → Cloudflare R2 (or Cloudinary); legacy `data:` URLs still rendered |
| Realtime | FCM + 20–30s foreground poll (matches web today). SSE later if needed. |
| Distribution | Play Store (AAB) + direct APK on site for early access |
| Timeline | ~10–12 weeks to public launch, **usable internal build in ~3 weeks** |

---

## 1. What already works in our favour

Verified by reading the repo (`src/lib/*`, `src/app/api/**`):

- **135 API route handlers** under `/api/**`, all returning JSON via the `route()` wrapper in `src/lib/api.ts`.
- Uniform error envelope: `{ error, code }` with `code` values `unauthenticated`, `unverified`, `suspended`, `rate_limited`, `invalid` — maps cleanly to Android error states.
- `ser()` in `src/lib/serialize.ts` already converts `_id` → `id` and `Date` → ISO-8601. No BSON leaking to the client.
- **Cursor pagination** already implemented (`/api/posts?cursor=…&limit=15` → `{ items, nextCursor }`). Paging 3 drops straight in.
- Field-level visibility (`memberView`) is enforced server-side — the app never has to hide private data itself.
- Rate limiting + CSRF origin check are centralised in `route()`, so new mobile endpoints inherit them.
- `notify()` (`src/lib/notify.ts`) is the single funnel for all notifications → one place to add FCM fan-out.
- Existing feature flags (`src/lib/flags.ts`) and plan limits (`src/lib/billing-limits.ts`) are server-authoritative.

## 2. Real gaps that must be fixed first

These are the only backend changes required. Everything else is client work.

| # | Gap | Impact if ignored | Fix |
|---|---|---|---|
| G1 | Cookie-only auth, no refresh, no revocation | Users re-login every 30 days; can't log out a stolen device; no per-device session list | Add `/api/auth/mobile/*` (login, refresh, logout) + `devices` collection |
| G2 | `getSessionUser()` reads only cookies | Bearer token unusable | Prefer `Authorization: Bearer` in `getSessionUser()`; skip `sameOrigin` when Bearer present (CSRF N/A) |
| G3 | Media = base64 `data:` URLs in `posts.media`, `users.image`, `works` | Multi-MB feed payloads, no CDN, no thumbnails, slow on 3G, Mongo doc bloat | `/api/uploads/sign` → presigned R2/S3 PUT; store `url`; return `thumbUrl`; keep `data:` fallback |
| G4 | No push infrastructure | App has no reason to be installed | `fcmTokens` on user doc + `notify()` → FCM HTTP v1 |
| G5 | No API versioning / contract lock | Web refactor silently breaks shipped apps | Freeze `/api/**` response shapes; add `/api/mobile/v1/*` only for new endpoints; contract tests |
| G6 | No app config endpoint | Force-update & kill-switch impossible | `/api/mobile/config` → `{ minVersion, latestVersion, flags, termsUrl }` |
| G7 | Device/session management absent | No "sign out other devices" | `devices` collection with `lastSeenAt`, `appVersion`, `fcmToken`, `revokedAt` |
| G8 | Razorpay is web-checkout only | Payments broken on Android (Play policy: must use SDK for digital goods **or** stay web) | Phase 5 decision — see §11 |

> **Play Store policy note (important):** if Skilion sells digital subscriptions/content *inside* the app, Google requires Play Billing. Razorpay is fine for services rendered outside the app (e.g. hiring/contracts) and for a "manage billing on web" link. Decide this in Phase 5, not later — it can force a redesign of the pricing screen.

---

## 3. Auth design (the one thing to get right)

### Recommendation: dual-mode auth in the same backend

```
Web (today)          Android (new)
httpOnly cookie  →   Authorization: Bearer <access JWT, 15 min>
```

**Endpoints to add** (`src/app/api/auth/mobile/`):

| Endpoint | Body | Returns |
|---|---|---|
| `POST /login` | `{ email, password, device: { name, platform, appVersion } }` | `{ accessToken, refreshToken, user }` (+ `mfaRequired` if MFA on) |
| `POST /mfa` | `{ challengeId, code }` | tokens |
| `POST /refresh` | `{ refreshToken, deviceId }` | rotated tokens (old refresh revoked) |
| `POST /logout` | `{ refreshToken }` or Bearer | `{ ok }` + revoke device |
| `POST /oauth/exchange` | `{ code }` (one-time, 60s TTL) | tokens |
| `GET  /sessions` | — | list of devices (name, last seen, current?) |
| `DELETE /sessions/{id}` | — | revoke |

**Token scheme**

- Access: JWT HS256, `{ uid, ver, did }`, 15 min, same `AUTH_SECRET`.
- Refresh: 32-byte random, **only its SHA-256 hash** stored in `devices` (`refreshHash`, `rotatedAt`, `expiresAt` 60d).
- Rotation on every refresh + reuse-detection → revoke whole device on replay.
- `ver` (existing field in `signSession`) lets us invalidate all sessions on password change.

**Social login on Android** (Google + GitHub already supported on web)

1. Custom Tabs (`androidx.browser`) opens `https://skilion.vigotech.in/api/auth/google/start?mobile=1`.
2. Callback mints a one-time `code`, redirects to `skilion://auth?code=…` (App Link verified for `https://skilion.vigotech.in/auth/mobile`).
3. App calls `POST /api/auth/mobile/oauth/exchange` → tokens.
4. No client secret ships in the APK. No WebView.

**Storage on device:** `EncryptedSharedPreferences` / DataStore + Android Keystore. Never log tokens. Logout wipes everything and revokes server-side.

---

## 4. Media pipeline (fix before Phase 2)

```
Phone → (compress to WebP, 1600px max, ~200 KB)
      → POST /api/uploads/sign  (Bearer)
      → { uploadUrl, publicUrl, thumbUrl }
      → PUT bytes to R2 (presigned, 5 min TTL)
      → POST /api/posts { media: [{ type:"image", url: publicUrl, thumbUrl, w, h }] }
```

- Server-side: accept `https:` URLs from our own bucket host only; keep accepting `data:` for legacy docs.
- Client: Coil 3 with **two** fetchers — HTTPS, and a custom `DataUriFetcher` decoder for old posts.
- Feed API gains `?slim=1` for mobile: strips `data:` blobs, returns `thumbUrl` + `w/h` so Compose can reserve space (no layout jump).
- Add `src/lib/media.ts` for validation + 3 upload limits per plan.

---

## 5. App architecture

### Module graph

```
skilion-android/
├── app/                        # Application, MainActivity, nav host, DI entry
├── build-logic/                # convention plugins (android-library, compose, feature)
├── core/
│   ├── common/                 # Result, dispatchers, time/format utils
│   ├── designsystem/           # Color, Type, Theme, components, motion specs
│   ├── network/                # Retrofit, OkHttp interceptors, auth authenticator, DTOs
│   ├── datastore/              # token store, prefs, theme, onboarding flags
│   ├── database/               # Room entities/DAO/cache, Paging remote-mediator
│   ├── analytics/              # Firebase + event schema
│   └── ui/                     # shared composables: Avatar, SkillChip, EmptyState, ErrorState
└── feature/
    ├── auth/  feed/  compose/  explore/  profile/  works/
    ├── projects/  messages/  notifications/  settings/  billing/  admin/
```

Each `feature/*` = `api` (nav contracts + public composables) + `impl` (screens, ViewModel, DI).
Rule: **features never depend on each other's `impl`**. Shared domain types live in `core/network` DTOs mapped to `core/model`.

### State pattern

```kotlin
data class FeedUiState(
  val items: LazyPagingItems<PostUi>,
  val isRefreshing: Boolean,
  val banner: Banner?,          // offline / rate-limited / unverified
)

sealed interface FeedEvent { data object Refresh; data class React(val id: String, val kind: Kind) }
```

- ViewModel exposes `StateFlow<UiState>`; UI is a pure function of state.
- One-shot effects via `Channel<Effect>` (navigation, snackbar, share sheet).
- Optimistic like/save, rolled back on error, reconciled on next page refresh.
- Error mapping in one place: `code` → user-facing string (no raw server text on screen).

### Offline-first

- Room caches: feed pages (by cursor key), profiles, conversations, notification list.
- Read from cache instantly, refresh in background, show "last updated" chip.
- Writes queue in WorkManager when offline; retry with backoff; conflict policy = server wins, surface a toast.
- `SavedStateHandle` + process-death restore for composer drafts (drafts also persisted to Room).

---

## 6. Screen map (web ↔ Android)

Bottom navigation (5): **Home · Explore · Create (FAB) · Messages · You**

| Web route | Android screen | Notes / UX upgrade |
|---|---|---|
| `/discover` | Home feed + tabs | Tabs as pills, horizontal pager, pull-to-refresh, shimmer skeletons |
| `/explore` | Explore | Search with debounce 300 ms, skill chips, saved searches, sticky filter bar |
| `/u/[handle]` | Builder profile | Collapsing toolbar w/ avatar, parallax, "Bond" + "Message" sticky CTA, works grid |
| `/build` | AI blueprint / matches | Step form → result cards; Gemini calls stay server-side |
| `/projects`, `/projects/[id]` | Projects + Workspace | Tabs: Overview · Tasks · Check-ins · Milestones · Members |
| `/team`, `/team/[id]` | Squad builder + cart | Swipe-to-remove, live price summary |
| `/messages` | Conversations → Chat | Sticky date headers, bubbles, typing indicator, image attachments, unread badges |
| `/notifications` | Notifications | Grouped by day, swipe-to-dismiss, deep links to entity |
| `/invites`, `/network` | Invites / Network | Segmented lists, accept/decline with haptics |
| `/settings/*` (11 pages) | Settings hub | Profile, Availability, Security (MFA), Privacy, Notifications, Proof of Work, Billing, Data |
| `/admin/*` | Admin (Phase 5, read-only first) | Phone-hosted moderation queue; skip complex tables |
| `/login`, `/signup`, `/onboarding` | Auth flow | Single-activity, OTP autofill (`SmsRetriever` not applicable → clipboard/paste + resend timer) |
| `/pricing` | Plans | Play policy decision in §11 |
| `/showcase/[slug]` | Public showcase | Deep-linkable, shareable |
| marketing pages | **Not ported** | Keep on web; link out via Custom Tab |

**Deep links:** verified App Links for `https://skilion.vigotech.in/{u,projects,showcase,messages,posts}/*` + custom scheme `skilion://`. One `DeepLinkRouter` maps URL → nav destination. Share from Android opens the canonical web URL (good for SEO + non-installed users).

---

## 7. UX standards that make it feel "proper"

- **Brand parity:** extract web tokens (`--brand`, radii, type scale) into `core/designsystem`. Same logo, same lime/ink palette, same motion easing.
- **Motion:** shared-element transitions profile tile → profile, predictive back, spring-based sheet drag, 60 fps budget. No default Material ripples on custom cards.
- **Feedback:** haptics on like/bond/accept; skeleton→content crossfade; never a blank white screen.
- **Empty & error states:** designed illustration + action, not "No data".
- **Edge-to-edge**, dynamic type up to 200%, TalkBack labels on every icon button, 48dp minimum targets, contrast ≥ 4.5:1.
- **Large screens:** `WindowSizeClass`; two-pane Messages on tablets/foldables (list + chat).
- **Dark theme** from day one (web already has it).
- **Performance:** Baseline Profile + Macrobenchmark in CI; startup < 1.2 s cold on mid-tier; feed `LazyColumn` keys + stable types; image pre-sizing.
- **Trust:** biometric unlock option, screenshot block on billing/security, clear "Sign out all devices".

---

## 8. Backend change checklist (file-level)

```
src/lib/auth.ts                  + Bearer support in getSessionUser(); return deviceId
src/lib/api.ts                   + skip sameOrigin for Bearer; map device rate limits
src/lib/notify.ts                + FCM send (fire-and-forget, never throws)
src/lib/env.ts                   + FIREBASE_SERVICE_ACCOUNT, R2_* , MOBILE_MIN_VERSION
src/app/api/auth/mobile/login    new
src/app/api/auth/mobile/refresh  new
src/app/api/auth/mobile/logout   new
src/app/api/auth/mobile/mfa      new
src/app/api/auth/mobile/oauth/exchange  new
src/app/api/auth/google/start    + mobile=1 branch (state carries mobile flag)
src/app/api/auth/github/start    + same
src/app/api/auth/*/callback      + redirect to skilion://auth?code= when mobile
src/app/api/uploads/sign         new
src/app/api/mobile/config        new
src/app/api/mobile/devices       new (list/revoke)
src/app/api/posts/route.ts       + ?slim=1, thumbUrl support, https media allow-list
src/lib/db.ts                    + devices collection + indexes (refreshHash unique, expiresAt TTL)
src/lib/types.ts                 + DeviceDoc, MediaRef
```

Deploy order: **backend first** (backwards compatible), then ship app. Never the reverse.

Env additions:
```
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=skilion-media
R2_PUBLIC_BASE=https://media.skilion.vigotech.in
MOBILE_MIN_VERSION=1.0.0
```

---

## 9. Testing & CI

- **Unit:** ViewModel state machines with Turbine + MockK; repositories with `MockWebServer` fixtures generated from real API responses.
- **Compose UI:** `createComposeRule` per screen for empty/loading/error/content; Paparazzi or Roborazzi screenshots on PR (no emulator needed).
- **Contract tests:** a JVM test that hits staging `/api/**` and asserts shapes didn't change — catches G5 regressions.
- **Instrumented:** critical flows on Firebase Test Lab (login, post, message, paywall).
- **CI (GitHub Actions):** `./gradlew spotlessCheck lint testDebugUnitTest assembleDebug` on PR; on tag → signed AAB → Play internal track (`r0adkll/upload-google-play`). Versioning: `versionCode` = CI run number, `versionName` = semantic.
- **Release hygiene:** R8 full mode + keep rules for serialization, Crashlytics mapping upload, Play Integrity API before public launch.

---

## 10. Phases, deliverables, timeline

Assumes one developer + AI pair, ~25 h/week. Dates are effort, not calendar promises.

### Phase 0 — Backend readiness (3–4 days) → *unblocks everything*
- [ ] Bearer auth + mobile auth endpoints + `devices` collection
- [ ] `/api/mobile/config`, device registration, FCM fan-out in `notify()`
- [ ] `/api/uploads/sign` + R2 bucket + `?slim=1` on feed
- [ ] Freeze API contract doc (`docs/API_CONTRACT.md`) + contract tests
- **Exit:** `curl` can log in, refresh, post, and receive a push.

### Phase 1 — Foundation + auth + read (2 weeks)
- [ ] Gradle multi-module skeleton, convention plugins, CI
- [ ] Design system from web tokens, dark mode, nav host, deep links
- [ ] Login / signup / OTP / forgot / OAuth via Custom Tabs / biometric unlock
- [ ] Home feed (Paging 3 + Room cache), image rendering, skeletons
- [ ] Profile screen (self + others), works grid
- **Exit:** internal APK — sign in, browse feed, view profiles. *This is the "usable" milestone.*

### Phase 2 — Create & engage (2 weeks)
- [ ] Composer (image picker, crop, tags, opportunity fields, drafts)
- [ ] Likes, saves, comments sheet, share, report, block
- [ ] Explore + search + saved searches
- [ ] Notifications list + counts + deep links
- **Exit:** full social loop works offline-tolerably.

### Phase 3 — Messaging & push (2 weeks)
- [ ] Conversation list, chat, typing, read receipts, attachments
- [ ] FCM push → notification channels, tap → exact chat
- [ ] Background sync via WorkManager, unread badge, quiet hours respected
- **Exit:** messaging feels instant and survives process death.

### Phase 4 — Work layer (2 weeks)
- [ ] Projects workspace (tasks, check-ins, milestones, members, activity)
- [ ] Squads/carts, invitations, bonds, endorsements
- [ ] Showcase public pages + deep links + share cards
- **Exit:** the "proof of work" core is native.

### Phase 5 — Account, money, admin (1.5 weeks)
- [ ] Settings parity, MFA, privacy, notification prefs, data export/delete
- [ ] Billing: **decide Play Billing vs web-managed** (§11), receipts
- [ ] Admin: moderation queue + verification (read-only v1)
- **Exit:** Play-policy-compliant account lifecycle (deletion is mandatory).

### Phase 6 — Launch hardening (1 week)
- [ ] Baseline profiles, Macrobenchmark, R8, Crashlytics, Play Integrity
- [ ] Accessibility + large-screen audits, 200% font pass
- [ ] Store listing (icons, 8 screenshots ×2 form factors, feature graphic, privacy policy, data safety form)
- [ ] Closed test (20 users) → open test → staged rollout 5% → 20% → 100%

**Total: ~10–12 weeks.** Parallel option: start Phase 1 design-system work while Phase 0 backend lands.

---

## 11. Decisions you need to make (blockers for later phases)

1. **Payments:** Play Billing for subscriptions (Google takes 15%) **or** "manage on web" only (allowed, but no in-app upsell buttons). This changes `/pricing` and `/settings/billing`. → needed by Phase 5.
2. **Auth:** approve the Bearer + refresh-token design (I recommend it) vs. shipping with cookie-jar auth now and migrating later. Cookie-jar works today in ~1 day of client code but has no revocation.
3. **Media host:** Cloudflare R2 (cheapest, no egress fee) vs Cloudinary (transforms for free tier). → needed by Phase 0.
4. **Admin on mobile:** full parity, read-only, or none (link to web). → needed by Phase 5.
5. **Distribution:** Play Store only, or Play + direct APK download from skilion.vigotech.in. → affects update mechanism.

---

## 12. Risks & mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| Base64 media blows up mobile data / feed JSON | High | Phase 0 upload pipeline + `?slim=1`; never render `data:` in lists |
| No API versioning → web refactor breaks shipped app | High | Contract tests in CI; additive-only changes; `/api/mobile/v1` for new work |
| Play policy on digital goods (Razorpay) | High | Decide §11.1 early; keep purchase CTA on web if unsure |
| Play account deletion requirement | Medium | Phase 5 in-app delete + web delete URL |
| Mongo/serverless connection limits under app traffic | Medium | Atlas M10 before launch; `maxPoolSize` tuning; monitor |
| OAuth app verification (Google) for `skilion://` redirect | Medium | Use HTTPS App Link redirect instead of custom scheme where possible |
| Scope creep to full 1:1 parity | Medium | Marketing pages stay on web; admin can be web-linked |
| Solo-dev bus factor | Medium | Modular + documented contract; CI green gate |

---

## 13. Costs

| Item | Cost |
|---|---|
| Google Play developer account | $25 one-time |
| Firebase (FCM, Crashlytics, Analytics) | free tier is enough |
| Cloudflare R2 | ~$0 (10 GB free, no egress) |
| GitHub Actions | free tier enough |
| Atlas upgrade (M0 → M10) at launch | ~$57/mo |
| **Total to launch** | **≈ $25 + existing hosting** |

---

## 14. Definition of done

- Cold start < 1.2 s on a mid-tier device (Redmi-class), feed scroll ≥ 55 fps.
- 0 crashes in Crashlytics for 7 days on 100+ users.
- Offline: feed + profile + last 50 messages readable with no network.
- Every icon has a TalkBack label; app usable at 200% font.
- Account deletion, data export, and sign-out-all-devices work end-to-end.
- Contract tests green against production for 2 consecutive releases.
