# EVENTFORGE — Corporate Event & Conference Management Platform

[![Stack](https://img.shields.io/badge/Stack-MERN-C0003C?style=for-the-badge)](https://github.com/amrutcodess/eventforge)
[![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-24.x-green?style=for-the-badge&logo=nodedotjs)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-emerald?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-gold?style=for-the-badge)](LICENSE)

**EVENTFORGE** is a production-grade full-stack MERN application engineered for organizing and managing enterprise corporate events, technical summits, masterclass workshops, and partner exhibitions.

Designed with a premium agency-portfolio aesthetic, EventForge features 6-tier role-scoped authorization, dynamic room conflict resolution, live encrypted QR badge check-ins, a provider-agnostic server-side AI layer, sponsor deliverable tracking, and interactive Recharts analytics.

---

## 🎨 Visual Language & Design System

- **Color Palette**: A monochrome base — white (`#ffffff`), zinc-50 (`#fafafa`) and zinc-950 (`#09090b`) — carrying a **single crimson accent** (`#c0003c`, hover `#a00032`). There is no second hue anywhere, including status badges. The accent is a swappable source: its channels live on `:root` in `client/src/index.css`, so every accent surface — Recharts series included — moves together.
- **Typography**: **Bebas Neue** condensed caps for display headlines over **Inter** for body text, navigation and UI labels.
- **Layout**: Sections alternate background tone rather than being separated by divider lines. Buttons and cards are **square** (zero border radius) and media cards sit at 16px.
- **Motion**: Lenis smooth scroll on public routes only (dashboards deliberately opt out), GSAP scroll reveals and animated headings, a seamless marquee, and a scroll progress bar. Every one of these is gated behind `prefers-reduced-motion`.
- **Accessibility**: Accent and status tones are chosen against their actual background — `<Badge>` status text on dark surfaces uses the `.light` variant, because the default tones fall below 4.5:1 on `night`.
- **Role Shells**: Platform Admin, Event Organizer, Event Staff, Speaker, Attendee, and Sponsor dashboards sharing a unified design system.

---

## 🔐 6-Tier Role-Based & Event-Scoped Access

Authentication is backed by JWT tokens and a centralized permission resolver `getEventPermissions(userId, eventId)`:

| Role Persona | Workspace Scope & Key Capabilities | Demo Credential |
| :--- | :--- | :--- |
| 🛡️ **Platform Admin** | Global user directory, role delegation, organization management, SLA health | `admin@eventforge.com` |
| 📋 **Event Organizer** | Event CRUD, Venue/Room setup, Conflict Scheduler, Analytics, AI Copy Studio | `organizer@eventforge.com` |
| 📱 **Event Staff** | Live QR ticket token scanner, entrance verification, attendee roster | `staff@eventforge.com` |
| 🎤 **Speaker** | Profile bio editor, assigned keynote schedule, presentation slides upload | `speaker@eventforge.com` |
| 🎟️ **Attendee** | Ticket pass registration, digital badge QR code, AI session match recommendations | `attendee@eventforge.com` |
| 💼 **Sponsor** | Package entitlements, brand asset file submission (SVG logo, video reel) | `sponsor@eventforge.com` |

*Password for all demo accounts: **`password123`***

---

## ⚡ Core Platform Features

1. **Automatic Session Conflict Detection**: Overlapping session bookings in the same room (`roomName`, `startTime`, `endTime`) trigger dynamic schedule conflict warnings specifying the room & conflicting session title.
2. **QR Code Ticket Verification**: Generates high-density QR tokens & PNG data URIs. On-site staff scanner validates tickets against MongoDB and prevents duplicate entrance.
3. **Provider-Agnostic AI Layer**: `server/utils/ai/` composes answers from live event records. Six endpoints — public `POST /api/ai/assistant` (the Forge Assistant on the marketing site) and `GET /api/ai/event-brief/:eventId`; authenticated `POST /api/ai/build-agenda`, `POST /api/ai/draft-content` and `POST /api/ai/recommend-sessions`; and organizer/staff-only `GET /api/ai/insights/:eventId`. Retrieval is scoped through `resolveScope`, so a public caller can never read a draft event or a privileged field.
4. **Deterministic Fallback, Not Degradation**: Every AI feature has a non-LLM path that reads the same records the UI does, so the platform is fully functional with **no provider key at all**. Setting `AI_BASE_URL` / `AI_API_KEY` / `AI_MODEL` upgrades the wording, not the availability. Requests are rate-limited and budgeted, and a failing provider falls back rather than propagating.
5. **Sponsor Deliverables & Multer Uploads**: Real file upload API (`POST /api/upload`) with a MIME
   allowlist, used by sponsors to submit brand assets and by speakers to attach session material.
   Files land in `server/uploads/` locally and `/tmp/uploads` on Vercel (ephemeral — see
   [Deployment](#-deployment-vercel--mongodb-atlas)).
6. **Recharts Visualizations**: Custom-themed registration timeline area charts, session capacity saturation bar charts, and revenue metrics.

---

## 🛠️ Tech Stack & Monorepo Structure

```
eventforge/
├── client/                     # Frontend Vite + React 18 Application
│   ├── src/
│   │   ├── components/         # Design System (Button, Card, Badge, Modal, DataTable, EmptyState)
│   │   │   ├── ai/             # Forge Assistant widget & event brief
│   │   │   ├── motion/         # Lenis smooth scroll, GSAP reveals, marquee, page transition
│   │   │   ├── QRScannerModal  # Camera & Token Check-in Scanner
│   │   │   └── AIModal         # AI Content Draft Studio
│   │   ├── context/            # AuthContext global state
│   │   ├── pages/              # Landing, EventDetail, TicketPass, Login, Register, Legal, NotFound
│   │   └── pages/dashboards/   # Admin, Organizer, Staff, Speaker, Attendee, Sponsor shells
├── server/                     # Backend Express REST API
│   ├── config/                 # Mongoose DB connection & MongoMemoryServer fallback
│   ├── middleware/             # JWT auth & centralized eventAuth permission resolver
│   ├── models/                 # User, Event, Venue, TicketCategory, Registration, Session, Attendance, Sponsor, Announcement
│   ├── routes/                 # Express REST API routes & Multer file upload
│   ├── utils/                  # QR generator, and utils/ai/ — the AI features, scope resolver & budget
│   ├── seed.js                 # Complete realistic demo dataset seeder
│   ├── test_system.js          # Automated verification test suite
│   └── test_ai_units.js        # AI unit suite (visibility guard, fallbacks, budget)
└── vercel.json                 # Monorepo full-stack Vercel deployment manifest
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm (v9+)
- Local MongoDB instance, **or** no `MONGODB_URI` at all — the server then auto-falls back to an
  in-memory MongoDB for development. A production deployment **must** set `MONGODB_URI` (see
  [Deployment](#-deployment-vercel--mongodb-atlas)).

### Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/amrutcodess/eventforge.git
   cd eventforge
   ```

2. **Configure the environment** (optional locally — with no `MONGODB_URI` the server falls back to an
   in-memory MongoDB so you can boot instantly):
   ```bash
   cd server
   cp .env.example .env      # then set MONGODB_URI / JWT_SECRET if you have a real MongoDB
   ```

3. **Install Server Dependencies & Seed Database**:
   ```bash
   cd server
   npm install
   node seed.js
   ```

4. **Install Client Dependencies**:
   ```bash
   cd ../client
   npm install
   ```

5. **Run Application Concurrently**:
   ```bash
   # From root directory
   npm run dev
   ```
   - **Frontend App**: `http://localhost:3000`
   - **Backend REST API**: `http://localhost:5000` — check `http://localhost:5000/api/health`

The seeder creates two events, six role accounts, eleven delegate registrations with backdated
timestamps (so the analytics timeline charts have real shape), attendance records, sponsorship
deliverables, coupons, and announcements.

---

## 🧪 System Verification Tests

Run the automated verification test suite to validate database constraints, conflict scheduler, QR token scanner, AI fallbacks, and Multer file upload endpoints:

```bash
cd server
npm run test:system   # database constraints, conflict scheduler, QR tokens, uploads
npm run test:ai       # AI unit suite — visibility guard, fallbacks, budget (no DB or key needed)
```

---

## ☁️ Deployment (Vercel + MongoDB Atlas)

Configured for 1-click deployment on **Vercel** using [`vercel.json`](vercel.json). The manifest builds
the Express API as a serverless function (`@vercel/node`) and the Vite client as a static build
(`@vercel/static-build`), with `handle: filesystem` providing the SPA fallback so client-side routes such
as `/dashboard` and `/events/:slug` survive a hard refresh.

### 1. Environment variables

| Variable | Required | Notes |
| :--- | :--- | :--- |
| `MONGODB_URI` | ✅ **Yes** | MongoDB Atlas connection string, e.g. `mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/eventforge?retryWrites=true&w=majority`. Add your Vercel deployment's IPs to the Atlas network access list (`0.0.0.0/0` is simplest for a capstone). |
| `JWT_SECRET` | ✅ **Yes** | Any long random string. Tokens signed with a different secret invalidate existing sessions. |
| `NODE_ENV` | Recommended | Set to `production`. The server **refuses to boot** without `MONGODB_URI` in production rather than silently falling back to an ephemeral in-memory database. |
| `AI_BASE_URL` | Optional | Any OpenAI-compatible endpoint (Groq, OpenRouter, or a local Ollama). With all three AI vars unset, every `/api/ai/*` route uses the built-in deterministic engine instead. |
| `AI_API_KEY` | Optional | Key for the provider in `AI_BASE_URL`. May be any non-empty string for a local Ollama. |
| `AI_MODEL` | Optional | Model id for the provider, e.g. `llama-3.3-70b-versatile` on Groq. |
| `PORT` | Optional | Local development only (default `5000`); ignored on Vercel. |

Copy [`server/.env.example`](server/.env.example) to `server/.env` for local development.

> **Note:** file uploads are written to `/tmp` on Vercel because the serverless filesystem is read-only.
> `/tmp` is ephemeral, so uploaded assets do not survive a cold start — swap `server/routes/upload.js`
> onto S3/Cloudinary/Vercel Blob for durable hosting.

### 2. Deploy

1. Import repository `amrutcodess/eventforge` in Vercel.
2. Select **`eventforge (root)`** as the root directory.
3. Set the environment variables above in **Project → Settings → Environment Variables**.
4. Deploy — Vercel builds the React client and the Express serverless function automatically.

### 3. Seed the production database (once)

Run the seeder against Atlas from your machine so the live site has demo data:

```bash
cd server
MONGODB_URI="mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/eventforge" node seed.js
```

Verify the deployment is healthy and actually connected to Mongo:

```bash
curl https://eventforge-server.vercel.app/api/health
# → { "status": "healthy", "database": "connected", ... }
```

A `"database": "disconnected"` response means `MONGODB_URI` is missing or unreachable — data will not
persist until it is fixed.

---

## 📜 License

Distributed under the MIT License. Built as a full-stack MERN capstone project.
