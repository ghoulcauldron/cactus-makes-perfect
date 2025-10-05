# Cactus Makes Perfect 🌵✨  
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

Railway

- Deploy both apps/frontend and apps/backend as services via infra/railway.json.
- Configure environment variables in the Railway dashboard.

## Project Roadmap

### Completed Phases

- **Phase 1: Basic Guest Portal**
  - Guest invite system
  - RSVP functionality
  - Basic UI for guests

- **Phase 2: Backend API & Database**
  - Supabase integration
  - Secure API endpoints
  - Data persistence

- **Phase 3: Frontend Enhancements**
  - Improved UI/UX with Tailwind
  - Responsive design
  - User input validation

- **Phase 4: Deployment & Infra**
  - Railway deployment configs
  - Dockerfiles for containerization
  - Environment variable management

### Upcoming Phases

- **Phase 5: (Deferred)**
  - Two-way communications and SMS notifications deferred until Admin Dashboard phase

- **Phase 6: Domains & Identity**
  - Custom domain setup for guest portal
  - User authentication and identity management
  - Integration with third-party identity providers
  - Transition: Mailtrap (dev/testing) → SendGrid (production) once domains/DNS are ready.

- **Phase 7: QA Matrix**
  - Dev environment: Invite 10–20 mock users; verify email rendering and links
  - Auth calculator: Accepts correct {token + code}, rejects wrong code and expired tokens
  - RSVP: Writes guest responses and activity logs
  - Staging environment: Verify Gmail, Outlook, iCloud inbox reception with no broken images or links
  - Spam checks: Adjust content, DKIM, SPF as needed
  - Error handling: Friendly UI for 401 errors (calculator modal on invalid), server logs user activity for failures

- **Phase 8: RSVP & Event UI**
  - RSVP modal with improved UX
  - Event Details modal with schedules and info
  - FAQs modal for guest questions


## QA Checklist
### Dev (Mailtrap)
- [ ] Invite 10–20 mock users; verify email renders & links  
- [ ] Calculator auth accepts correct {token + code}, rejects wrong code, expired token  
- [ ] RSVP writes row + activity log  

### Staging (real inboxes)
- [ ] Gmail, Outlook, iCloud accounts receive mail, no broken images/links  
- [ ] Check spam placement; adjust content/DKIM/SPF if needed  

### Error handling
- [ ] 401 cases produce friendly UI (calculator modal on invalid)  
- [ ] Server logs user_activity for failures (optional)  


## Mailtrap QA Test Plan

### Mailtrap QA Test Plan

#### Purpose
To verify the full end-to-end invite and verification system works using Mailtrap’s sandbox environment before switching to SendGrid in production.

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
   - Attempt reusing token → verify access denied.
   - Missing token or malformed link → show “Please use your invite link” message.

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

## Phase 6: Domains & Identity Rollout Plan

This rollout plan outlines the detailed steps to configure custom domains, set up SendGrid for email delivery, and validate the setup before transitioning to production.

### DNS Setup

- [ ] Identify the custom domain(s) to be used for the guest portal and email sending.
- [ ] Access the DNS provider’s management console for the domain(s).
- [ ] Add or update the following DNS records:
  - [ ] **SPF Record:** Add a TXT record authorizing SendGrid IPs to send emails on behalf of the domain.
  - [ ] **DKIM Records:** Add the CNAME records provided by SendGrid for domain authentication.
  - [ ] **DMARC Record (optional but recommended):** Add a TXT record to specify the DMARC policy.
- [ ] Verify that all DNS records have propagated correctly using tools like `dig`, `nslookup`, or online DNS checkers.
- [ ] Document the DNS changes and expected propagation times.

### SendGrid Configuration

- [ ] Log into the SendGrid dashboard.
- [ ] Navigate to the Sender Authentication section.
- [ ] Complete domain authentication by linking the custom domain.
- [ ] Verify that SendGrid confirms successful domain authentication.
- [ ] Create or update API keys with appropriate permissions for sending emails.
- [ ] Configure the sending domain and email addresses in SendGrid.
- [ ] Set up any necessary suppression lists, templates, or tracking settings.

### Testing & Validation

- [ ] Send test emails from the development environment using the new SendGrid configuration.
- [ ] Verify email deliverability in major email clients (Gmail, Outlook, iCloud).
- [ ] Check for correct SPF, DKIM, and DMARC alignment in email headers.
- [ ] Confirm that emails do not land in spam or junk folders.
- [ ] Test unsubscribe and bounce handling as configured.
- [ ] Validate that email templates render correctly across devices.
- [ ] Monitor SendGrid dashboard for any sending errors or warnings.

### Transition to Production

- [ ] Update environment variables in production to switch from Mailtrap to SendGrid.
- [ ] Deploy updated backend services with SendGrid integration enabled.
- [ ] Perform a limited production rollout to a small group of real users.
- [ ] Monitor email delivery metrics and user feedback closely.
- [ ] Gradually increase the volume of emails sent via SendGrid in production.
- [ ] Document the transition process and any issues encountered for future reference.