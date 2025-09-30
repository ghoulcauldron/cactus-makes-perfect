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

## Future Improvements

Add a UI flow for guests to request a resend of their invite link by entering their email. This UI would call the existing `/api/v1/invites/resend` endpoint, which currently logs invalid attempts but does not have a user interface yet.

Invite email design