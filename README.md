<file name=0 path=/Users/gilcalderon/cactus-makes-perfect/README.md># Cactus Makes Perfect 🌵✨  
Santa Fe 20th Anniversary Guest Portal

This repo contains a monorepo with:

- **Frontend:** React + Vite + Tailwind + TypeScript  
- **Backend:** Node.js/Express + Supabase  
- **Infra:** Railway deployment configs, Dockerfiles  

## Quickstart (local)

### Frontend
```bash
cd apps/frontend
npm install
npm run dev
```

### Backend
```bash
cd apps/backend
npm install
node server.js
```

## Deployment (Railway)

- Recommended single-service deploy: the backend service builds the frontend and serves it from the `/public` directory.
- An alternative two-service deployment (separate nginx frontend + API backend) is possible but not required.
- When attaching a custom domain, map `www.cactusmakesperfect.org` to the backend service.
- Basic Auth protects all routes during private testing to restrict access.
- Minimal required environment variables checklist:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `JWT_SECRET`
  - `EMAIL_PROVIDER`
  - `FROM_EMAIL`
  - `BASIC_AUTH_USER`
  - `BASIC_AUTH_PASS`

## Environment & Config

Key environment variables used by the application:

- `SUPABASE_URL` — URL of the Supabase project.
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key for Supabase with elevated permissions.
- `EMAIL_PROVIDER` — Email provider to use (`mailtrap` or `mailgun`).
- `FROM_EMAIL` — The email address from which invites and notifications are sent.
- `MAILTRAP_API_TOKEN` — API token for Mailtrap sandbox environment.
- `MAILTRAP_INBOX_ID` — Mailtrap inbox ID used for sandbox testing.
- `MAILGUN_DOMAIN` — Mailgun domain for sending emails (production). Must match the verified Mailgun domain, e.g. `mg.cactusmakesperfect.org`.
- `MAILGUN_API_KEY` — API key for Mailgun (production). Must correspond to the verified Mailgun domain.
- `JWT_SECRET` — Secret key used to sign JWT tokens.
- `JWT_TTL_SECONDS` — JWT token time-to-live in seconds (e.g., `172800` for 48 hours).
- `PUBLIC_URL` — Public URL of the deployed app (e.g., `https://www.cactusmakesperfect.org`).
- `BASIC_AUTH_USER` — Username for Basic Auth protection.
- `BASIC_AUTH_PASS` — Password for Basic Auth protection.
- `DEV_SKIP_EMAIL` — Set to `true` to skip sending emails during development/testing.
- Frontend build-time variables:
  - `VITE_DEBUG` — Set to `false` in production to disable debug features.
  - `VITE_SHOW_RESET_BUTTON` — Enables a reset button in the UI for debugging.

## API Reference (current)

### POST /api/v1/invites/send
**Payload:** `{ "email": "<guest_email>" }`  
**Response:** `200 { "ok": true }`  
**Side effects:** Inserts a row into `invite_tokens` with `provider`, sets `delivery_status` from `pending` to `sent`, logs `user_activity` event `invite_sent`.

### POST /api/v1/invites/resend
**Payload:** `{ "email": "<guest_email>" }`  
**Response:** `200 { "ok": true }` regardless of guest existence (Option B).  
Logs either `invite_resent` or `invite_resend_failed` in `user_activity`.

### POST /api/v1/auth/verify
**Payload:** `{ "token": "<token>", "code": "<code>" }`  
**Response:** `200 { "token": "<jwt>", "guest_id": "<guest_id>" }` on success.  
Side effects: sets `invite_tokens.used_at` timestamp and updates `delivery_status` to `responded`.

### POST /api/v1/rsvps/me
**Payload:** `{ "guest_id": "<guest_id>", "status": "<rsvp_status>" }`  
**Response:** `200 { "ok": true }` on success.  
Logs `rsvp_submitted` event in `user_activity`.

### GET /health
Returns health status of the backend service. Can be public if desired.

## Activity Normalization

The admin activity timeline is **normalized server-side** from multiple sources.

### Source Tables

- `user_activity`
- `emails_log`
- `invite_tokens`
- `rsvps`

### Normalization Rules

- `invite_resent`, `admin_invite_resent` → `invite_sent`
- `auth_success` → `invite_used`
- First RSVP submission → `rsvp_created`
- Subsequent RSVP submissions → `rsvp_updated`

The backend returns a unified, time-ordered activity feed for admin views.



## Data Model Notes

Key database tables and notable columns:

- **guests**  
  - `email` (unique)  
  - `first_name`, `last_name`  
  - `invited_at`, `responded_at`

- **invite_tokens**  
  - `guest_id` (foreign key)  
  - `token` (unique string)  
  - `code` (numeric or alphanumeric code)  
  - `expires_at` (typically 30 days after creation)  
  - `provider` (e.g., mailtrap, mailgun)  
  - `delivery_status` (pending, sent, responded)  
  - `used_at` (timestamp when token was used)  
  - `created_at`

- **user_activity**  
  - `guest_id`  
  - `kind` (event type, e.g., invite_sent, rsvp_submitted, group_update)
  - `meta` (jsonb with event details)  
  - `created_at`

Example query to audit latest invites joined to guests:

```sql
SELECT g.email, g.first_name, g.last_name, i.token, i.code, i.delivery_status, i.used_at, i.created_at
FROM invite_tokens i
JOIN guests g ON i.guest_id = g.id
ORDER BY i.created_at DESC
LIMIT 20;
```

### Groups / Households

Guests can optionally be assigned to a **group (household)** using a shared label.

- Groups are stored directly on the `guests` table
- There is no separate `groups` table
- Labels are canonicalized on write (trimmed, lowercased)

**Column**
- `guests.group_label` — nullable text

**Example**

smith-family
friends-from-nyc

### Admin Group Operations

The admin interface supports:

- Assigning a guest to a group
- Moving a guest between groups
- Clearing a guest’s group
- Bulk-assigning multiple guests to a group
- Querying existing groups with member counts

### Activity Logging

Group changes emit `user_activity` events:

- `group_update` — single guest assigned / moved / cleared
- `group_update_bulk` — bulk group assignment

These appear in the guest’s activity timeline.

## Frontend Behavior

- Routes:
  - `/` — Landing page or redirect.
  - `/invite?token=...` — Invite landing page with token parameter.
  - `/guest/login` — CalculatorAuth screen for code entry.
  - `/guest/welcome` — Welcome page after successful auth.
  - `/guest/rsvp` — Deprecated route; replaced by the RSVP modal interface within the app.

- The "View Schedule" and "FAQs" modals have been merged into a single unified "Event Info" modal, accessible from the Welcome screen. This modal uses tabs to display both the event schedule and frequently asked questions.

- Production guard: If no `token` is provided in the URL and `VITE_DEBUG` is `false`, the CalculatorAuth screen shows a message: “Please use your invite link”.

- After successful `/auth/verify`, the app stores `auth_token` (JWT) and `guest_user_id` in `localStorage`.

- `ProtectedRoute` components require a valid `auth_token` in localStorage to grant access.

- RSVP submissions post `guest_id` retrieved from localStorage.

### Admin Guest Selection Model

Guest selection (checkboxes) is managed at the **AdminDashboard** level.

#### Header Checkbox Semantics

- **No guests selected**
  - Header checkbox appears checked
  - Clicking selects all visible guests

- **Some guests selected**
  - Header checkbox remains checked
  - Clicking selects all visible guests

- **All guests selected**
  - Header checkbox shows an indeterminate (−) state
  - Clicking clears all selections

The GuestSidebar does not own selection state.



## Project Roadmap

### Completed Phases

- Phase 1–4:
  - Invite issuing system with tokenized URLs.
  - CalculatorAuth verification with JWT issuance and localStorage persistence.
  - RSVP POST endpoint and activity logging.
  - Mailtrap integration via API for invite delivery.
  - Tracking of provider, delivery_status, and used_at timestamps for invites.

#### Phase 4 – Success Criteria Achieved
- Full invite and verification flow functioning end-to-end (Mailtrap sandbox).
- Tokenized URLs verified to land on CalculatorAuth correctly.
- Correct code entry issues JWT and persists guest_id to localStorage.
- RSVP form submits successfully and logs user_activity.
- Basic Auth and “use invite link” guard functioning as intended.

#### Phase 7 – QA Matrix Success Criteria Achieved
- Successful QA testing with Mailtrap sandbox environment completed.
- Email invites render correctly with unique tokenized URLs and codes.
- Authentication flow accepts valid token and code, issues JWT, and redirects appropriately.
- RSVP submissions record guest responses and log user_activity events accurately.
- UI guards display “Please use your invite link” message when appropriate.
- Basic Auth protection verified to restrict access during private testing.
- All critical user flows validated end-to-end ensuring stable release readiness.

#### Phase 8 – RSVP Modal Success Criteria Achieved
- The RSVP modal interface is now fully functional and replaces the deprecated `/guest/rsvp` route.
- RSVP response flow through the modal completes successfully with backend integration.
- User activity logging and API communication for RSVP submissions are confirmed operational.
- The unified Event Info modal (with tabs for Schedule and FAQs) has been introduced and is fully functional, replacing the previous separate Schedule and FAQs modals.

### Upcoming Phases

- Phase 5: (Deferred) Two-way communications and SMS notifications pending Admin Dashboard development.

- Phase 6: Domains & Identity  
  Custom email identity setup including Mailgun integration, SPF/DKIM/DMARC configuration, and optional inbound parse.  
  Transition note: Mailtrap (dev/testing) → Mailgun (production) once domains/DNS are ready.  
  **Mailgun integration is now successfully tested and operational.**  
  The Mailgun API credentials (`MAILGUN_DOMAIN`, `MAILGUN_API_KEY`, `FROM_EMAIL`) must match the verified Mailgun domain (e.g. `mg.cactusmakesperfect.org`) for proper email delivery.

- Phase 7: QA Matrix  
  - Dev environment: Invite 10–20 mock users; verify email rendering and links.  
  - Auth calculator: Accepts correct {token + code}, rejects wrong code and expired tokens.  
  - RSVP: Writes guest responses and activity logs.  
  - Staging environment: Verify Gmail, Outlook, iCloud inbox reception with no broken images or links.  
  - Spam checks: Adjust content, DKIM, SPF as needed.  
  - Error handling: Friendly UI for 401 errors (calculator modal on invalid).  
  - Token reuse: Reusing token is allowed until expiry (by design).

- Phase 8: RSVP modal + unified Event Info modal (Schedule and FAQs combined).

## QA Checklist
### Dev (Mailtrap)
- [x] Invite 10–20 mock users; verify email renders & links  
- [x] Calculator auth accepts correct {token + code}, rejects wrong code, expired token  
- [x] RSVP writes row + activity log  

### Staging (real inboxes)
- [*] Gmail, Outlook, iCloud accounts receive mail, no broken images/links  
- [ ] Check spam placement; adjust content/DKIM/SPF if needed  

### Error handling
- [ ] 401 cases produce friendly UI (calculator modal on invalid)  
- [ ] Server logs user_activity for failures (optional)  

**Note:** The “Please use your invite link” message is visible only when `VITE_DEBUG=false`.

## Mailtrap QA Test Plan

### Mailtrap QA Test Plan

#### Purpose
To verify the full end-to-end invite and verification system works using Mailtrap’s sandbox environment before switching to Mailgun in production.

#### Steps
1. **Seed test users**
   - Insert 10–20 mock guests into Supabase (e.g. Ava, Beau, Cam, etc.).
   - Confirm each has a unique email address in `guests`.

2. **Send invites**
   - For each test guest, POST to `/api/v1/invites/send` with `{ "email": "<guest_email>" }`.
   - Verify `invite_tokens` and `user_activity` tables receive corresponding rows.

3. **Check Mailtrap inbox**
   - Ensure each email arrives with correct subject, HTML + text versions.
   - Confirm tokenized invite link resolves to `/invite?token=...` on the site.
   - Validate unique codes are shown in each email and expire as expected.

4. **Verify login**
   - Paste invite link into browser → ensure CalculatorAuth screen loads.
   - Enter code → expect successful JWT issuance and redirect to `/guest/welcome`.

5. **Edge case testing**
   - Enter wrong or expired code → confirm “NOPE” modal.
   - Reusing token is allowed until expiry (by design).
   - Missing token or malformed link → show “Please use your invite link” message (visible only if `VITE_DEBUG=false`).

6. **Log validation**
   - In backend logs, confirm:
     - “Found guest” + “Inserted invite token” + “Email sent” messages.
     - Each successful invite and verify action logs `user_activity` events.

7. **Email deliverability simulation**
   - Review spam score and rendering in Mailtrap’s preview.
   - Confirm SPF/DKIM placeholders are acceptable for dev.

#### Success Criteria
- All test invites send without errors.
- Tokenized URLs open CalculatorAuth correctly.
- Correct codes authenticate; incorrect codes reject gracefully.
- Activity logs are complete for every test user.
- Emails render and link correctly in Mailtrap.


## Future Improvements

Add a UI flow for guests to request a resend of their invite link by entering their email. This UI would call the existing `/api/v1/invites/resend` endpoint, which currently logs invalid attempts but does not have a user interface yet.

Invite email design

- request invite token email resend (self or admin)
- expand guest group / household logic (currently label-based) to support bundled RSVPs
- flow to change/edit RSVP response.
- Replace the browser alert confirmation with a UI acknowledgement for successful RSVP submissions (to be designed and scaffolded soon).
- Allow guests to see their saved RSVP response, with modal persistence and the ability to edit or change their answer in a later flow.


## Phase 9 — Admin & Communications Dashboard  
### Progress Tracker (Live Status Board)

> **Goal:** Deliver a fully functional admin portal at **area51.cactusmakesperfect.org** with secure authentication, guest management, bulk actions, unified activity, and manual communications (nudges / resend invites).

---

### Section A — Foundations & Authentication

| Item | Status | Notes |
|------|--------|--------|
| Create `ADMIN_SECRET` env var | ☑️ | Railway service-level var |
| Implement `POST /api/v1/admin/login` | ☑️ | Returns admin JWT on correct secret |
| Implement `requireAdminAuth` middleware | ☑️ | Required for all `/api/v1/admin/*` APIs |
| Protect all `/api/v1/admin/*` routes | ☑️ | Ensure JWT required + validated |
| Add `ADMIN_JWT_TTL_HOURS` env var | ☑️ | Default 8h or 12h |

---

### Section B — Backend Admin APIs

| Endpoint | Status | Notes |
|----------|--------|-------|
| `GET /api/v1/admin/guests` | ☑️ | Joined with latest RSVP + latest invite data |
| `GET /api/v1/admin/guest/:id/activity` | ☑️ | Unified activity feed view |
| `POST /api/v1/admin/nudge` | ☑️ | Sends email via Mailgun + logs `nudge_sent` |
| `POST /api/v1/admin/resend` | ☑️ | Resends invite + inserts new invite token + logs |
| Create optional `admin_guests_view` | ☑️ | For performance + simpler frontend |

---

### Section C — Admin Dashboard Frontend

| Component | Status | Notes |
|-----------|--------|--------|
| Create `apps/admin/` Vite SPA | ☑️ | Separate build pipeline |
| Implement `Login.tsx` | ⬜ | Stores admin JWT in localStorage |
| Implement `AdminDashboard.tsx` | ☑️ | Guest table, selection, sidebar wiring |
| Implement `GuestSidebar.tsx` | ☑️ | Activity feed + group editing |
| Implement `BulkActions.tsx` | ⬜ | Resend invite + send nudge |
| Add `VITE_API_BASE_URL` | ⬜ | Points to backend API |
| Build admin SPA (local dev working) & prepare for deploy | ⬜ | Output static bundle |

---

### Section D — Deployment & DNS

| Item | Status | Notes |
|------|--------|--------|
| Create subdomain: `area51.cactusmakesperfect.org` | ⬜ | CNAME → Railway static service |
| Deploy admin SPA to subdomain | ⬜ | Confirm no console errors |
| Optional Basic Auth on admin domain | ⬜ | Early QA protection |
| HTTPS cert via Railway | ⬜ | Should auto-provision |

---

### Section E — Data & Observability

| Item | Status | Notes |
|-------|--------|--------|
| Verify guests join correctly | ⬜ | Cross-reference with SQL |
| Validate unified activity feed | ⬜ | Compare logs manually |
| Confirm Mailgun sending in admin use | ⬜ | Queue appears + status = delivered |
| Confirm emails_log is populated | ⬜ | Must log subject, provider, status |
| Confirm user_activity tracks admin actions | ⬜ | `nudge_sent`, `invite_resent`, etc. |

---

### Section F — UI/UX Polishing

| Item | Status | Notes |
|-------|--------|--------|
| Global loading states | ⬜ | Disable buttons during actions |
| Errors surfaced to admin | ⬜ | Modals or toast notifications |
| Display invite status chip | ⬜ | pending / sent / responded |
| Display RSVP status chip | ⬜ | yes / no / maybe / missing |
| Add segment filters | ⬜ | (RSVP filter, invite filter, recent activity) |

---

### Section G — Go-Live Checklist

| Item | Status | Notes |
|------|--------|--------|
| Admin auth tested via curl | ☑️ | `/admin/login` returns JWT |
| All `/api/v1/admin/*` endpoints reject missing/invalid token | ☑️ | |
| End-to-end nudge flow tested live | ☑️ | UI → Mailgun → email_logs |
| End-to-end resend invite tested live | ☑️ | UI → invite_tokens + Mailgun |
| Dashboard loads with real production data | ⬜ | |
| Pilot with 2–3 real guests | ⬜ | |
| Final OK from organizers | ⬜ | |


> Goal: Stand up a secure, token‑based admin area at **https://area51.cactusmakesperfect.org** to manage guests, resend invites, send nudges, and review a unified activity history.

### 1) Scope & Outcomes
- [x] **Admin login** — shared secret exchange issues a short‑lived admin JWT for secure access
- [ ] **Guests table** — provides searchable, filterable, and bulk-selectable list of guests
- [ ] **Unified guest activity** — displays invite sends/opens, token usage, RSVP submissions/edits, and email logs in a single feed
- [ ] **Bulk actions** — enables resending invites and sending nudges to multiple guests at once
- [ ] **Per‑guest sidebar** — shows detailed activity log and quick actions for each guest
- [ ] **Production‑grade auth** on all admin routes — ensures all admin endpoints require valid admin JWT authentication

### 2) Implementation Targets (explicit)

#### Backend
- [x] `POST /api/v1/admin/login` — returns an **admin JWT** when the provided shared secret matches `ADMIN_SECRET`
- [x] Middleware `requireAdminAuth` implemented — checks for a valid admin JWT on all `/api/v1/admin/*` routes and rejects requests with missing or invalid tokens
- [x] `GET /api/v1/admin/guests` — returns a paginated list of guests with their latest invite and RSVP data joined in (or via a view such as `admin_guests_view`)
- [x] `GET /api/v1/admin/guest/:id/activity` — returns a unified activity feed for the specified guest, combining `user_activity`, `emails_log`, `rsvps`, and `invite_tokens`
- [x] `POST /api/v1/admin/nudge` — sends a manual nudge email via Mailgun and records the send in both `emails_log` and `user_activity` (with kind `nudge_sent`)
- [x] `POST /api/v1/admin/resend` — reuses the invite flow to create a new `invite_tokens` row and logs the resend as `invite_resent` in `user_activity`

#### Admin Frontend
- [x] Create `apps/admin/` folder — sets up a separate Vite SPA dedicated to the admin dashboard interface
- [ ] Implement `Login.tsx` — provides a simple form that posts the `ADMIN_SECRET` to `/api/v1/admin/login` and stores the returned admin JWT in localStorage
- [ ] Implement `AdminDashboard.tsx` — main dashboard layout with a guests table, filters, search, and controls for bulk actions
- [ ] Implement `GuestSidebar.tsx` — slide-out sidebar for each guest showing their unified activity (invites, nudges, RSVPs, emails) and quick action buttons
- [ ] Implement `BulkActions.tsx` — UI component allowing selection of multiple guests and triggering bulk actions like “Resend invite” or “Send nudge”
- [ ] Add Vite config for SPA build — outputs a static bundle suitable for deployment at `area51.cactusmakesperfect.org`
- [ ] Add `VITE_API_BASE_URL` to env — configures the admin SPA to point at the correct backend API host

#### DNS / Deployment
- [ ] Create subdomain `area51.cactusmakesperfect.org` — set up a CNAME or A record pointing to the admin SPA hosting (e.g., on Railway)
- [ ] Deploy admin SPA to that subdomain — ensure the built `apps/admin` bundle serves correctly and loads without console errors
- [ ] Keep optional Basic Auth during early QA — maintain extra HTTP Basic Auth protection on the admin origin while testing with real guest data

#### Env Vars
- [ ] Add `ADMIN_SECRET` — shared secret used by `/api/v1/admin/login` to mint admin JWTs
- [ ] Add `ADMIN_JWT_TTL_HOURS` — specifies the lifetime of admin JWTs (e.g., `8` for an 8-hour admin session)

### 3) Data Shapes & Views

**Admin guests listing shape (example)**
```json
{
  "id": "uuid",
  "email": "ava+1@example.com",
  "first_name": "Ava",
  "last_name": "Test",
  "invited_at": "2025-10-05T03:26:52.801Z",
  "responded_at": "2025-10-05T03:27:15.558Z",
  "latest_invite": {
    "token": "uuid",
    "delivery_status": "sent|pending|responded",
    "used_at": "2025-10-05T05:06:14.443Z"
  },
  "rsvp": {
    "status": "yes|no|maybe|null",
    "submitted_at": "2025-10-05T05:03:39.576Z"
  },
  "last_activity_at": "2025-10-05T05:07:00.095Z"
}
```

**Admin activity feed shape (example)**
```json
[
  {"kind":"invite_sent","at":"2025-10-05T03:26:52.801Z","meta":{"provider":"mailgun"}},
  {"kind":"auth_success","at":"2025-10-05T03:27:15.558Z"},
  {"kind":"email_sent","at":"2025-10-05T03:30:10.001Z","meta":{"subject":"Reminder #1"}},
  {"kind":"rsvp_submitted","at":"2025-10-05T05:03:39.576Z","meta":{"status":"yes"}}
]
```

> **Note:** For performance and simpler frontend code, you may create a Supabase **view** (e.g., `admin_guests_view`) that joins `guests`, latest `rsvps` per guest, and latest `invite_tokens` per guest.

### 4) Security Model

- **Admin JWT** is distinct from guest tokens.
- All `/api/v1/admin/*` endpoints require `requireAdminAuth`.
- During early QA, you may keep **Basic Auth** at the service level (belt & suspenders).
- Store admin JWT in `localStorage` on the admin subdomain only; **never** reuse guest JWT.

### 5) Filters & Segments (Dashboard)

- [ ] Filter by RSVP
- [ ] Filter by invite status
- [ ] Filter by recent activity
- [ ] Create segments (saved queries)

### 6) Bulk Actions

- **Resend Invite** — reuses `/api/v1/invites/send` logic; writes `invite_resent` to `user_activity`.
- **Send Nudge** — reuses Mailgun adapter; writes to `emails_log` and `user_activity` (`nudge_sent`).

### 7) QA Checklist (Phase 9)

- [ ] `/api/v1/admin/login` returns admin JWT; invalid secret returns 401.
- [ ] All `/api/v1/admin/*` endpoints reject missing/invalid token.
- [ ] Guests table loads with correct joins (last RSVP + invite state).
- [ ] Guest sidebar shows unified activity chronologically.
- [ ] Bulk **Nudge** sends and logs (emails_log + user_activity).
- [ ] Bulk **Resend Invite** creates new invite_tokens rows and logs.
- [ ] Subdomain `area51.cactusmakesperfect.org` serves admin SPA.
- [ ] Basic Auth (optional) prompts in early QA.

### 8) Rollout Plan

1. **Backend**
   - Patch `server.js` with `/admin/login`, `requireAdminAuth`, and admin endpoints.
   - Deploy; verify endpoints with curl (send `Authorization: Bearer <token>`).

2. **Admin Frontend**
   - Scaffold `apps/admin`; implement Login → Dashboard → Sidebar → BulkActions.
   - Build & deploy; point `area51.cactusmakesperfect.org` to Railway.

3. **Data Verification**
   - Compare `/admin/guests` against direct SQL (spot‑check 10 rows).
   - Confirm unified activity feed matches `emails_log`, `user_activity`, `rsvps`, `invite_tokens`.

4. **Pilot**
   - Test with a handful of real guests.
   - Validate deliverability for nudges; review Mailgun logs.

5. **Handoff**
   - Document runbooks: admin login, sending nudges, resending invites, interpreting statuses.
   - Add read‑only “Audit” view for historical sends and RSVP edits (later).

---

**Notes**
- This phase **does not** change the guest‑facing flow (invite → token + code → Welcome → RSVP modal).
- All email sending continues to use the existing provider abstraction (now Mailgun).
- The admin subdomain is intentionally separate from the guest portal for cleaner auth boundaries.

## Phase 6: Domains & Identity Rollout Plan

This rollout plan outlines the detailed steps to configure custom domains, set up Mailgun for email delivery, and validate the setup before transitioning to production.

### DNS Setup

- [x] Identify the custom domain(s) to be used for the guest portal and email sending.
- [x] Access the DNS provider’s management console for the domain(s).
- [ ] Add or update the following DNS records:
  - [ ] **SPF Record:** Add a TXT record authorizing Mailgun IPs to send emails on behalf of the domain.
  - [ ] **DKIM Records:** Add the CNAME records provided by Mailgun for domain authentication.
  - [ ] **DMARC Record (optional but recommended):** Add a TXT record to specify the DMARC policy.
- [ ] Verify that all DNS records have propagated correctly using tools like `dig`, `nslookup`, or online DNS checkers.
- [ ] Document the DNS changes and expected propagation times.

### Mailgun Configuration

- [x] Log into the Mailgun dashboard.
- [x] Navigate to the Domains section.
- [x] Add and verify the custom domain for sending emails.
- [x] Complete domain authentication by adding the provided DNS records.
- [x] Verify that Mailgun confirms successful domain authentication.
- [x] Create or update API keys with appropriate permissions for sending emails.
- [x] Configure the sending domain and email addresses in Mailgun.
- [ ] Set up any necessary suppression lists, templates, or tracking settings.

### Testing & Validation

- [x] Send test emails from the development environment using the new Mailgun configuration.
- [ ] Verify email deliverability in major email clients (Gmail, Outlook, iCloud).
- [ ] Check for correct SPF, DKIM, and DMARC alignment in email headers.
- [ ] Confirm that emails do not land in spam or junk folders.
- [ ] Test unsubscribe and bounce handling as configured.
- [ ] Validate that email templates render correctly across devices.
- [ ] Monitor Mailgun dashboard for any sending errors or warnings.

### Transition to Production

- [x] Update environment variables in production to switch from Mailtrap to Mailgun.
- [x] Deploy updated backend services with Mailgun integration enabled.
- [ ] Perform a limited production rollout to a small group of real users.
- [ ] Monitor email delivery metrics and user feedback closely.
- [ ] Gradually increase the volume of emails sent via Mailgun in production.
- [ ] Document the transition process and any issues encountered for future reference.

### Mailgun API Connectivity Test

- The Mailgun API connectivity test (including curl test and backend integration) has succeeded, marking this milestone as complete and confirming that the Mailgun integration is fully operational.

## Phase 6 – Success Criteria Achieved

- DNS configuration for SPF, DKIM, and DMARC records successfully completed and verified.
- Mailgun API keys and domain authentication validated.
- Backend integration with Mailgun tested and confirmed operational.
- Email sending through Mailgun verified in test and staging environments.
- All prerequisites for production email delivery via Mailgun are met.

## Troubleshooting

- **401 on RSVP** → Likely missing `guest_user_id` in localStorage; ensure `/auth/verify` returns `guest_id` and the client saves it.
- **400 on RSVP** → API expects `{ guest_id, status }` (not `user_id`).
- **Email hangs** → Set `DEV_SKIP_EMAIL=true` to isolate; verify Mailtrap API token and inbox ID; check logs for `[Email] send start`.
- **Basic Auth not prompting** → Ensure middleware is registered before routes in backend.
- **Blank page on invite link** → Ensure `/invite` route exists in the frontend router and `index.html` uses the correct base URL.</file>