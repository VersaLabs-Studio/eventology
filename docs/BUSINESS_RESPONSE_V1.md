# Event Management Platform — Architecture & Scope Response

> **From:** Kidus (Lead SWE & Architect)  
> **To:** Business Manager  
> **Date:** April 30, 2026  
> **Re:** Response to MVP Requirements Document

---

## What This Document Covers

You sent me the MVP requirements. I've analyzed them, studied the market, and mapped out exactly what we're building and how. This document gives you:

- What I'm upgrading from your original scope (and why)
- Brand direction — 3 options, you pick
- Who we're competing with (and why we win)
- Exactly what ships in V1 (4 weeks) and what's V2
- The timeline, week by week

---

## 1. Requirements — What I'm Changing

Your requirements were solid. I'm keeping the core structure but upgrading every feature to enterprise-grade. Here's what that means:

| Your Requirement | What I'm Actually Building |
|-----------------|---------------------------|
| Simple registration form (name, phone, email) | Full ticketing system — multiple ticket tiers (VIP, General, Early Bird), QR codes, digital tickets, waitlist for sold-out events |
| Email notifications (confirmation) | Branded email templates, automated reminders 24h and 1h before events, registration digests for organizers |
| Basic analytics (views, registrations) | Full analytics dashboard — conversion rates, revenue tracking, registration trends over time, geographic breakdown |
| Admin: approve/reject events | Complete moderation queue with reviewer notes, organizer verification badges, featured event scheduling with duration control, full audit log |
| "Optional SMS later" | Confirmed V2. Same with push notifications — those come with the mobile app |
| Payment not mentioned | V2. V1 handles free events and "pay at the door" ticketing. Chapa/Telebirr integration comes in V2 once we have traction |

**Bottom line:** Every feature you listed is in, but none of them are "basic." We're shipping enterprise quality from day one.

---

## 2. The Three User Roles

This stays exactly as you defined it. Three roles, clean separation:

**Attendees** — Browse events, register, get QR tickets, receive reminders. That's their world. Clean, fast, beautiful.

**Organizers** — Create events with a rich editor, set up ticket tiers, manage registrations, scan QR codes at the door, see analytics. They're self-sufficient — no need to contact us for anything.

**Admin (Us)** — Approve/reject events, feature events on homepage, verify organizers, manage users, see platform-wide analytics. We control quality.

### Target Market

| Detail | |
|--------|--|
| **City** | Addis Ababa (expandable later) |
| **Event Types** | Corporate conferences, tech meetups, training workshops, networking, seminars |
| **Attendees** | Young professionals, 25-40, smartphone-first |
| **Organizers** | Training companies, corporate HR, tech communities, professional associations, NGOs |
| **Language** | English (V1). Amharic in V2 |
| **Revenue** | Free platform (V1) → Commission on paid tickets (V2) |

---

## 3. Brand Direction — Pick One

Three options. Each works. You choose.

---

### Option A: **"Qene" (ቅኔ)**

"Art/Poetry" in Amharic. Events as art.

- **Tagline:** *"Where Addis Gathers"*
- **Colors:** Deep Gold + Midnight Black + Warm White
- **Vibe:** Culturally rooted, sophisticated, premium
- **Best for:** Standing apart from every generic tech platform. Local trust. Memorable.
- **Risk:** Amharic character complicates domain naming. May need explanation for international users.

### Option B: **"Pulse Addis"**

The heartbeat of Addis Ababa's event scene.

- **Tagline:** *"Feel the Beat of Addis"*
- **Colors:** Electric Violet + Cyan Accent + Deep Slate
- **Vibe:** Tech-forward, startup energy, modern dark aesthetic
- **Best for:** Tech community, young professionals, looks like a world-class product immediately
- **Risk:** Less culturally specific. Needs very high design execution to avoid feeling generic.

### Option C: **"Tikdem" (ትቅደም)**

"Forward / Progress" in Amharic.

- **Tagline:** *"Addis, Moving Forward"*
- **Colors:** Emerald Green + Gold Accent + Off-White
- **Vibe:** Professional, trustworthy, growth-oriented
- **Best for:** Corporate/B2B positioning, government and NGO partnerships
- **Risk:** Green can feel generic. Needs strong logo to differentiate.

**Your call.** Once you pick, I'll lock in the design system in Week 1.

---

## 4. Competition — Where We Sit

### What exists in Addis right now

| Who | What They Do | Why We're Different |
|-----|-------------|---------------------|
| **Afromile / LinkUp Addis** | Event listings buried inside a broader media/commerce platform | We're event-first. The entire product exists for events. |
| **Prana Events, Flawless Events, Amen** | Traditional event agencies — you hire them to run your event | We're a self-service platform. Organizers do it themselves, we provide the tools. |
| **Facebook Events** | Informal event posts | We have ticketing, QR check-in, analytics, organizer dashboards. Facebook has none of that. |

**The gap:** Nobody in Addis Ababa offers a dedicated, modern, self-service event platform. People are using Facebook Events + WhatsApp + Excel spreadsheets. That's our opening.

### Global platforms we're drawing from

| Platform | What I'm Taking |
|----------|----------------|
| **Eventbrite** | Feature completeness — filters, ticketing tiers, organizer tools, check-in system |
| **Lu.ma** | Design standard — minimalist, fast, event pages that look incredible |
| **Partiful** | Social energy — RSVP simplicity, sharing that feels fun |
| **Bizzabo** | Dashboard depth — analytics that organizers actually want to look at |
| **Linear** | Interface philosophy — calm, fast, keyboard-friendly, smooth animations |
| **Afromile** | Local context — understanding what Addis users expect |

### Our position

We're building something **more feature-rich than Lu.ma, more beautiful than Eventbrite, and made specifically for Addis Ababa.** That's the pitch.

---

## 5. What V1 Ships (4 Weeks)

### Attendee Features

| Feature | What It Does |
|---------|-------------|
| Event Discovery | Grid of events, infinite scroll, curated homepage sections |
| Smart Filters | Category, date, sub-city, free vs paid, event type |
| Search | Keyword search across titles, descriptions, organizer names |
| Event Detail Page | Rich article-style page — banner, description, map, organizer info, gallery |
| Registration | Register in 30 seconds. Name, email, phone. Done. |
| Digital Ticket | QR code ticket via email, downloadable |
| Reminders | Automated emails 24h and 1h before the event |
| History | All your upcoming and past events in one place |

### Organizer Features

| Feature | What It Does |
|---------|-------------|
| Event Creation | Rich text editor, image upload, multiple ticket tiers |
| Dashboard | All events with metrics — views, registrations, conversion rate |
| Registration Management | Attendee list with search, filter, CSV export |
| QR Check-In | Scan attendee phones at the door |
| Analytics | Per-event: views over time, registration trends, geography |
| Duplicate Event | Clone an existing event to create a new one faster |
| Draft & Preview | Save drafts, preview before submitting for review |

### Admin Features

| Feature | What It Does |
|---------|-------------|
| Moderation Queue | Approve/reject events with notes |
| Featured Events | Pin events to homepage, set duration |
| User Management | View users, change roles, deactivate |
| Organizer Verification | Approve organizer applications, give verified badges |
| Platform Analytics | Total events, registrations, active users, growth |
| Audit Log | Every admin action is recorded |

### What's NOT in V1

| Feature | Why | When |
|---------|-----|------|
| Online payments (Chapa/Telebirr) | Regulatory complexity, needs traction first | V2 |
| Mobile app (iOS/Android) | Web-first. Mobile comes after web proves the concept | V2 |
| SMS notifications | Needs SMS gateway setup | V2 |
| Amharic language | Translation effort | V2 |
| Push notifications | Needs mobile app | V2 |
| Recurring events | Additional complexity | V2 |
| Seat maps | Enterprise feature | V2+ |

---

## 6. Timeline — 4 Weeks

```
WEEK 1                 WEEK 2                 WEEK 3                 WEEK 4
────────────────────   ────────────────────   ────────────────────   ────────────────────

Foundation             Discovery              Ticketing              Dashboards & Launch

• Project setup        • Event listing page   • Ticket tiers         • Organizer dashboard
• Database design      • Filters & search     • Registration flow    • Admin panel
• User accounts        • Event detail page    • QR code generation   • Analytics
• Design system        • Homepage curation    • Email notifications  • QR check-in
• Brand assets         • Category pages       • Digital tickets      • Testing & polish
• Role system          • Featured carousel    • Waitlist             • Performance tuning
                                                                      • Go live

✓ Users can log in     ✓ Events are           ✓ Full registration    ✓ Platform is
  and see their role     browsable and          working end-to-end     complete and
  appropriate view       searchable                                    deployed
```

---

## 7. V2 — What Comes After Launch

Once V1 is live and we have real users, V2 expands across four tracks:

### Track 1: Money (Weeks 5-7)
- Chapa / Telebirr payment integration
- Platform commission on paid tickets
- Organizer payout dashboard
- Refund management
- Revenue analytics

### Track 2: Mobile App (Weeks 6-10)
- iOS & Android app via Expo
- Push notifications
- Native QR scanner
- Offline ticket access
- "Events near me" with GPS

### Track 3: Communication (Weeks 5-8)
- SMS notifications
- Amharic language support
- Organizer → attendee messaging
- Calendar integration (Google/Apple)

### Track 4: Advanced (Weeks 8-12)
- Recurring events (weekly/monthly series)
- Seat maps for large venues
- Sponsor management
- AI-powered event recommendations
- Advanced analytics (cohorts, retention, predictions)

---

## 8. Technical Approach (What You Need to Know)

You don't need the technical details — that's my department. But here's what you should know:

| What | What It Means For You |
|------|----------------------|
| **Web-first** | Runs in any browser. No app download needed for V1. |
| **Enterprise-grade design** | It will look expensive. Dark mode, smooth animations, premium feel. |
| **Secure** | Each user type only sees what they should. Data is encrypted. Standard stuff. |
| **Fast** | Pages load in under 1.5 seconds. Search is instant. |
| **Works on phones** | Fully responsive from day one. Phones, tablets, desktops. |
| **Mobile-ready architecture** | When we build the app in V2, 60%+ of the work is already done. |
| **Scalable** | 100 users or 100,000 users — same system, no rebuild needed. |

---

## 9. What I Need From You

| # | What | By When |
|---|------|---------|
| 1 | Pick a brand (A, B, or C) | May 2 |
| 2 | Confirm this V1 scope works | May 2 |
| 3 | Confirm 4-week timeline | May 2 |

Once those three things are locked, I finalize the technical architecture and we start building.

---

*Let me know your picks after your through assesement.*
