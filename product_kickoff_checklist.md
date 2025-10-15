# GrantPath MVP Kickoff Package

## A) Product Owner Deliverables

### 1. One-Page Product Brief
- **Problem:** Small and rural nonprofits miss out on grant funding because they rely on spreadsheets and memory to track deadlines across multiple funders.
- **Audience:** U.S.-based organizations with annual operating budgets under $1M, typically 2–5 staff members without a dedicated grant officer.
- **MVP Goal (60–90 days):** Help teams discover federal grants, save opportunities into a shared pipeline, manage multi-milestone deadlines with reliable reminders, and collaborate lightly around tasks and owners.
- **Success Metrics:** ≥70% weekly active usage in private beta; ≥3 organizations convert to paid plans within 30 days of launch; <5% monthly churn in first 90 days; ≥80% of tracked deadlines hit on time.
- **Out of Scope:** Private/foundation grant data integrations, AI-assisted grant writing, detailed budget management, complex approval workflows.

### 2. Final MVP Feature List & Acceptance Criteria
- **Discover:** Filters must include (a) `State(s)` multi-select defaulting to onboarding selections, (b) `Focus areas` multi-select defaulting to onboarding selections, (c) `Due within` options of 30/60/90/180 days. Results must allow saving a grant into the org pipeline with one click and visually indicate when already saved.
- **Track:** Pipeline stages fixed to Researching, Drafting, Submitted, Awarded, Declined. Each grant detail page supports rich-text notes (Markdown), file/URL attachments, and stage changes logged with timestamps. Owners can be reassigned and history recorded.
- **Deadlines:** Support LOI, Application, and Report milestones with custom labels. Each deadline generates reminders at 30/14/7/3/1 days before and on the due date. Users can toggle reminders per milestone. Reminder emails must list owner, due date, and quick checklist link.
- **Calendar:** Provide an org-wide read-only ICS feed refreshed within 15 minutes of changes. Pro plan users can authorize Google Calendar push; events must sync create/update/delete in <10 minutes.
- **Collaboration:** Unlimited users per organization. Admins can assign an owner per grant and create task checklists with due dates and assignees. Checklist status visible per grant.
- **Onboarding:** Wizard asks for state(s) and focus areas; these pre-fill Discover filters and personalize recommended grants on first login.
- **Import:** CSV importer maps user-provided columns to Title, Funder, URL, Stage, LOI Due, Application Due, Report Due, Notes, Owner. Import must de-duplicate against existing saved grants by Title + Funder.
- **Billing:** Plans: Free, Starter ($19/mo), Pro ($49/mo). 14-day trial without credit card, applied to Starter by default. Provide nonprofit association discount codes (20% off) and annual billing (save 15%). Stripe customer portal enabled for upgrades/downgrades.
- **Additional Criteria:** All reminders respect org and user timezone settings. Attachments stored in Supabase Storage with per-org isolation. Accessibility AA compliance for primary flows.

### 3. Pricing & Limits (Final)
- **Free:** 5 saved grants, 3 users, email reminders, ICS feed access.
- **Starter $19:** 40 saved grants, unlimited users, email reminders, ICS feed.
- **Pro $49:** Unlimited saved grants and users, email + SMS reminders, ICS feed, Google Calendar push, task templates.
- **Trial:** 14 days, no credit card required; downgrades to Free if no plan selected at day 15.
- **Discounts:** 20% off annual billing; 25% off with approved nonprofit association codes (manual verification).

### 4. Branding & Copy
- **Name & Domain:** GrantPath — `grantpath.app` (domain purchase in progress, DNS on Cloudflare).
- **Logo/Colors/Typography:**
  - Primary color `#1B5E20` (deep green), secondary `#F9A825` (gold), accent `#0D47A1` (navy). Background `#F4F7F5`, text `#1E1E1E`.
  - Typography: Headings — "Work Sans" (Google Fonts); Body — "Inter".
  - Logo: Wordmark + compass icon (Figma link shared with design team; export PNG/SVG).
- **Marketing Copy:**
  - Hero: "GrantPath keeps your team on track so no grant slips through the cracks. Discover funding, organize deadlines, and collaborate in one place."
  - Features bullets: "Smart grant discovery for your state", "Shared pipeline with tasks & owners", "Automated reminders for every milestone", "Calendar sync your whole team trusts".
  - Pricing copy: "Start free. Upgrade when you need more capacity."
  - FAQ topics: Data sources, reminders, security & privacy, cancellation policy.
  - Privacy/ToS: Drafts in Google Docs (links shared via Drive) awaiting legal review.
- **Product Copy Tone:** Friendly-professional. Empty states encourage action (e.g., "No grants saved yet — add one from Discover to start planning."). Buttons concise ("Save grant", "Add deadline"). Email/SMS copy supportive and action-oriented.

### 5. Seed Data & Taxonomy
- **Focus Areas:** Education, Health, Youth Services, Arts & Culture, Rural Development, Food Security, Environmental Stewardship, Community Infrastructure, Economic Development, Housing Stability.
- **States/Regions:** Default onboarding selection: user's state + adjacent states (autodetected via IP or manual selection). Provide dataset for all 50 states + DC.
- **Common Tasks Template:** "Assemble attachments", "Draft narrative", "Finalize budget", "Board approval", "Upload to Grants.gov", "Collect signatures", "Submit report".
- **CSV Samples:** Two sample spreadsheets provided (`samples/grant_pipeline_sample.csv`, `samples/grant_reports_sample.csv`) with headers mapping to Title, Funder, URL, Stage, Priority, Owner Email, LOI Due, Application Due, Report Due, Notes.

### 6. Legal & Policy
- **Privacy Policy & ToS:** Draft completed by counsel (Doc IDs `GrantPath-Privacy-v0.9`, `GrantPath-ToS-v0.9`). Awaiting final approval.
- **Email/SMS Compliance:** Include unsubscribe footer on all emails; SMS includes "Reply STOP to unsubscribe". Maintain suppression list synchronized with messaging providers.
- **Data Retention:** Active customer data retained indefinitely; inactive orgs deleted after 24 months of inactivity (30-day notice). System logs retained 90 days. Backups retained 14 days.

### 7. Access, Accounts & Credentials
- **Hosting/DB:** Supabase project (`grantpath-prod`) provisioned; credentials stored in 1Password vault. Vercel team project created with Supabase service key.
- **Email:** Postmark account active; API key + sender signatures configured; SPF/DKIM DNS records ready.
- **SMS:** Twilio account created; messaging service SID `MGxxxxxxxx`. Optional for MVP but credentials available.
- **Payments:** Stripe account with products/prices created (`price_free`, `price_starter_monthly`, `price_starter_annual`, `price_pro_monthly`, `price_pro_annual`). Webhook endpoint placeholder `https://api.grantpath.app/api/webhooks/stripe` registered.
- **Calendar Push:** Google Cloud project `grantpath-calendar` with OAuth consent draft; need developer to configure scopes and submit for verification. OAuth client JSON shared securely.
- **Grants Source:** Grants.gov Applicant API key requested (ticket #GG-98231) – expected within 3 business days; XML feed access already available for testing.
- **Analytics:** PostHog project key + API host provided. GA4 property optional.
- **Error Logging:** Sentry DSN available but not yet enabled.
- **DNS/Domain:** Cloudflare account credentials shared; DNS records to be added per developer guidance.
- **Environment:** Seed superuser email `founder@grantpath.app`.

### 8. Non-Functional Requirements (Confirmed)
- **SLA:** 99.5% monthly uptime target.
- **Performance:** API p50 <200ms; primary page TTFB <1.5s on Vercel edge. Frontend Lighthouse performance ≥85 on desktop.
- **Browser Support:** Latest Chrome, Edge, Firefox, and Safari current minus one version.
- **Security:** Enforce Supabase RLS for all org data. Encrypt secrets via Vercel/Supabase secrets manager. SOC2 roadmap documented.
- **Backups:** Nightly Supabase backups retained 14 days; manual restore drill quarterly.
- **Timezone:** Default America/New_York with per-org override; per-user override planned post-MVP.

---

## B) Developer Build Scope (With Provided Inputs)

(Developer to execute items as already defined in product spec. Product owner responsibilities above provide necessary context.)

---

## Developer Kickoff Questionnaire (Responses)
1. **Stack choice:** Next.js + Supabase — **Yes**.
2. **Brand assets & domain:** ☑ Provided (logo files + DNS access shared via Drive and Cloudflare).
3. **Pricing limits:** Free = 5 saved grants / 3 users; Starter = 40 saved grants / unlimited users; Trial = 14 days, no card, auto-downgrade to Free.
4. **Email/SMS tone & copy owner:** ☑ Product owner provides final copy (dev to implement templates).
5. **Data sources beyond federal:** ☑ Manual entry by users (custom grants). No additional automated sources in MVP.
6. **Calendar push in MVP:** ☑ Yes (Pro plan feature).
7. **Import format:** Provided sample spreadsheets in `/samples`. Expect columns listed above; additional mapping UI required.
8. **Security notes:** Avoid storing SSNs/PII beyond user contact info. Adhere to retention policy (inactive org deletion after 24 months).
9. **Admin tools:** ☐ No internal admin dashboard required for MVP; Supabase dashboard + SQL scripts sufficient.
10. **Launch plan & beta orgs:** Target beta launch July 15. Pilot orgs: River Valley Food Bank (AR), Pinecrest Youth Services (NC), Safe Harbor Shelter (ME), Heartland Arts Council (KS), GreenRoots Collective (VT), Sunflower Community Clinic (KS), Mission Ridge Literacy (TX).

---

## Ready-to-Hand Assets

### A. CSV Import Mapping (Final Header Row)
```
Title,Funder,URL,Stage,Priority,Owner Email,LOI Due,Application Due,Report Due,Notes
```

### B. Email Template (Final Copy)
```
Subject: Due in {{days}}: {{grant_title}} — {{milestone}}

Hi {{first_name}},

This is your reminder that {{grant_title}} — {{milestone}} is due on {{due_date}}.
Owner: {{owner_name}}. Open the checklist to knock out the next steps:
{{grant_link}}

Add to calendar: {{ics_link}}
Update reminder settings: {{prefs_link}} | Unsubscribe: {{unsubscribe_link}}
```

### C. ICS Event Example
```
VEVENT
UID: {{org_id}}-{{grant_id}}-{{milestone}}
DTSTART: {{YYYYMMDDTHHMMSSZ}}
SUMMARY: {{grant_title}} — {{milestone}}
DESCRIPTION: {{url}}
END:VEVENT
```

---

## Risks & Edge Cases (Tracked)
- Rolling or extended deadlines must reschedule reminders without duplication.
- Support multiple report deadlines per grant; initial implementation handles discrete entries, recurring RRULEs deferred to post-MVP.
- Deduplicate grants across sources using `source + external_id`; manual entries tagged `manual`.
- Provide ability to revoke/regenerate ICS secret if link leaks.
- Ensure timezone settings respected for multi-state teams; store org default and per-user offset preference.
- Monitor email deliverability — SPF/DKIM/DMARC validated before beta.

