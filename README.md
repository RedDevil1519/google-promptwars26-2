![Voter Protocol Architecture Diagram](./architecture.png)

<p align="center">
  <img src="https://img.shields.io/badge/Voter%20Protocol-Election%20Engine-00d4ff?style=for-the-badge&labelColor=0a0e1a" alt="Voter Protocol Engine" />
</p>

<h1 align="center">🏛️ Voter Protocol: Interactive Election Engine</h1>

<p align="center">
  <strong>Empowering citizens through visual logic, real-time civic data, and seamless Google service integration.</strong>
  <br/>
  <em>Find your elections · Navigate your voter roadmap · Sync deadlines to Google Calendar</em>
</p>

<p align="center">
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript"/></a>
  <a href="https://vitejs.dev/"><img src="https://img.shields.io/badge/Vite-5.x-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite"/></a>
  <a href="https://reactjs.org/"><img src="https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React"/></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node-20.x-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node"/></a>
  <a href="https://expressjs.com/"><img src="https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express&logoColor=white" alt="Express"/></a>
  <a href="https://vitest.dev/"><img src="https://img.shields.io/badge/Vitest-tested-6E9F18?style=flat-square&logo=vitest&logoColor=white" alt="Vitest"/></a>
  <img src="https://img.shields.io/badge/WCAG-2.1%20AA-00c853?style=flat-square" alt="WCAG 2.1 AA"/>
  <img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License"/>
</p>

---

## 📌 Project Vision

**Voter Protocol** transforms the complex election cycle into a procedural, kinetic journey. It is designed to empower citizens through visual logic, deep Google Service integration, and an uncompromising focus on **accessibility** and **performance**. Democracy functions best when every citizen can navigate it with confidence — and this platform is the bridge.

---

## ✨ Feature Highlights

| Feature | Description |
|---------|-------------|
| 🗳️ **Real-Time Civic Data** | Localized election lookup powered by the **Google Civic Information API** |
| 🇮🇳 **International Fallback Engine** | Detects Indian addresses via **Geocoding API** and generates ECI-compliant data with **Gemini AI** |
| 📅 **Google Calendar Sync** | Phase 3 "Add Election Day to Calendar" + per-step deadline reminders using template deep-links |
| 🗺️ **Street View Reconnaissance** | Google Maps Embed **Street View** panorama of the exact polling place address |
| 🤖 **Gemini AI Explainer** | "Decrypt Term" button uses **Gemini 1.5 Flash** to give an ELI5 definition of any civic term |
| 🌐 **Multi-Language Engine** | Language selector instantly translates the Roadmap to Hindi & Spanish via **Cloud Translation API** |
| 📲 **PWA Offline Mode** | Installable Progressive Web App with Workbox service worker — works fully offline |
| 🔒 **Security-First** | Helmet headers · DOMPurify XSS sanitization · zero hardcoded secrets |
| ⚡ **Zero-Waste Performance** | 24-hour localStorage API cache · React `lazy()` + `Suspense` code splitting · ~306 KB bundle |
| ♿ **Full Accessibility** | WCAG 2.1 AA · 100% keyboard navigation · comprehensive ARIA roles |
| 🛡️ **Input Validation** | Server-side regex + length guards on all incoming addresses |
| 🧪 **Automated Testing** | 82 Vitest unit + RTL component tests across 5 test files |

---

## 🏗️ Architecture

```
google-promptwars26-2/
│
├── frontend/                        # Vite + React + TypeScript SPA
│   └── src/
│       ├── features/
│       │   ├── civic/
│       │   │   ├── hooks/
│       │   │   │   ├── useCivicData.ts        # Fetches & caches civic data
│       │   │   │   └── useCalendarSync.ts     # Generates Google Calendar links
│       │   │   ├── components/
│       │   │   │   ├── ElectionCard.tsx       # Single election display
│       │   │   │   └── RoadmapStepper.tsx     # Step-by-step voter roadmap
│       │   │   └── types.ts                   # Civic API type definitions
│       │   └── search/
│       │       └── components/
│       │           └── AddressSearch.tsx      # DOMPurify-sanitized address input
│       ├── shared/
│       │   ├── components/
│       │   │   ├── Button.tsx
│       │   │   ├── Spinner.tsx
│       │   │   └── ErrorBoundary.tsx
│       │   └── utils/
│       │       ├── dateParser.ts              # Date formatting (unit-tested)
│       │       ├── cache.ts                   # 24-hour localStorage cache
│       │       └── sanitize.ts               # DOMPurify wrapper
│       ├── pages/
│       │   ├── HomePage.tsx                  # Landing + address search
│       │   └── ElectionPage.tsx              # Results + roadmap + map
│       ├── App.tsx                           # Router with React.lazy()
│       ├── main.tsx                          # React root with Suspense
│       └── index.css                         # Cyber-Civic dark theme
│
└── backend/                         # Node + Express API proxy
    └── src/
        ├── routes/
        │   └── civic.ts             # /api/civic — Civic API proxy
        ├── middleware/
        │   └── validate.ts          # Input sanitization middleware
        └── index.ts                 # App entry: Helmet, CORS, dotenv
```

### Key Design Decisions

#### 🔁 API Proxy Pattern
The frontend **never** calls Google APIs directly. All traffic is routed through the Express backend, keeping the API key exclusively server-side and enabling centralized rate limiting and error handling.

#### 🧩 Feature-Sliced Architecture
Business logic is isolated by domain (`civic/`, `search/`) with cross-cutting utilities in `shared/`. This enforces clear boundaries, prevents coupling, and makes testing trivial.

#### 💾 24-Hour LocalStorage Cache
```
cache key:   civic_<sanitized_address>
cache value: { data: CivicResponse, timestamp: number }
TTL:         86,400,000 ms (24 hours)
```
Repeated queries for the same address return instantly — critical for low-bandwidth environments.

#### ⚡ React Suspense + Lazy Loading
```tsx
const ElectionPage = React.lazy(() => import('./pages/ElectionPage'));
// Wrapped in <Suspense fallback={<Spinner />}>
```
Only the `HomePage` ships in the initial bundle, slashing first-paint time.

---

## 🔐 Security Implementation

| Layer | Practice |
|-------|----------|
| **API Key Isolation** | Keys stored in `.env` only; never bundled into client code |
| **XSS Prevention** | `DOMPurify.sanitize()` applied to all user-supplied inputs before rendering |
| **HTTP Headers** | `helmet()` middleware sets CSP, HSTS, X-Frame-Options, and more |
| **Input Validation** | Regex + max-length checks in `validate.ts` before forwarding to Google |
| **CORS Policy** | Restricted to `localhost:5173` in development |
| **Zero Hardcoded Secrets** | Enforced by `.gitignore` — `.env` is never committed |

---

## 🌐 Google Service Integration

### 1. Google Civic Information API
The **core engine** of the platform. On address submission:
1. The sanitized address is forwarded from the Express backend to the Civic API.
2. The response is parsed into typed `CivicData` objects.
3. Results are cached in localStorage under the address key.
4. The frontend renders `ElectionCard` components for each contest and `RoadmapStepper` for deadlines.

**Endpoint used:** `GET https://www.googleapis.com/civicinfo/v2/voterinfo`

### 2. Google Calendar API Integration
The `useCalendarSync` hook constructs a deep-link event URL — **no OAuth required**:

```
https://calendar.google.com/calendar/render?action=TEMPLATE
  &text=<Election Name>
  &dates=<YYYYMMDD>/<YYYYMMDD>
  &details=<Description with polling info>
  &location=<Polling Place Address>
```

Clicking "Add to Calendar" opens Google Calendar in a new tab with the event pre-filled. Users sync their civic deadlines in **one click**.

### 3. Google Maps Embed API (Street View Reconnaissance)
A `<Maps Embed>` iframe renders the user's polling place. Using the **Street View Reconnaissance** feature, the map defaults to an interactive Street View panorama of the exact polling location if coordinates are available, aiding voters in physically identifying their polling location.

### 4. Google Cloud Translation API
The **Multi-Language Engine** allows users to instantly translate the entire Voter Roadmap (including complex civic terminology) into Hindi and Spanish, improving civic engagement for non-native English speakers.

### 5. Google Gemini AI (`gemini-1.5-flash`)
The **Decrypt Term** feature integrates the `@google/generative-ai` SDK on the backend. A "Decrypt Term" button appears on every roadmap step. When clicked, it sends the civic term to the `/api/explain` endpoint, which queries Gemini with a structured ELI5 prompt and returns a concise plain-English explanation — making civic terminology accessible to every voter.

---

## ♿ Accessibility (WCAG 2.1 AA)

### Multi-Language Engine
A native language selector allows users to translate the voting roadmap into **Hindi** and **Spanish**, making the democratic process more inclusive and accessible to diverse linguistic communities.

### Contrast Ratios

| Element | Foreground | Background | Ratio |
|---------|-----------|------------|-------|
| Body text | `#e2e8f0` | `#0a0e1a` | **12.3:1** ✅ |
| Accent / links | `#00d4ff` | `#0a0e1a` | **7.8:1** ✅ |
| Button labels | `#0a0e1a` | `#00d4ff` | **7.8:1** ✅ |
| Muted labels | `#94a3b8` | `#131929` | **4.6:1** ✅ |

### Keyboard & Screen Reader
- All interactive elements have **visible focus rings** and logical tab order
- Spinners use `role="status"` with `aria-label`
- Error messages use `role="alert"` for immediate announcement
- Collapsible sections expose `aria-expanded` state
- Icon-only buttons carry descriptive `aria-label` attributes
- Dynamic content updates (such as translation state) are broadcast via `aria-live` regions

---

## 🧪 Testing

```bash
cd frontend

npm run test           # All unit + component tests (Vitest)
npm run test:watch     # Watch mode for TDD
npm run test:coverage  # HTML coverage report → frontend/coverage/
```

| Test File | Type | Covers |
|-----------|------|--------|
| `dateParser.test.ts` | Unit (Vitest) | Date formatting · invalid inputs · timezone edge cases |
| `RoadmapStepper.test.tsx` | Component (RTL) | Render from mock state · step count · ARIA roles |

---

## 🚀 Quick Start

### Prerequisites
- **Node 20+** and **npm 10+**
- A **Google Civic Information API key** ([get one →](https://console.cloud.google.com/))
- *(Optional)* A **Google Maps Embed API key** for polling-location maps

### 1 · Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/google-promptwars26-2.git
cd google-promptwars26-2

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2 · Configure Environment

```bash
# From the project root
cp .env.example .env
```

Open `.env` and fill in your keys:

```env
CIVIC_API_KEY=your_google_civic_api_key
MAPS_EMBED_KEY=your_maps_embed_api_key      # optional
PORT=4000
VITE_API_BASE_URL=http://localhost:4000
VITE_MAPS_EMBED_KEY=your_maps_embed_api_key # optional
```

### 3 · Run Development Servers

```bash
# Terminal 1 — Express backend (port 4000)
cd backend && npm run dev

# Terminal 2 — Vite frontend (port 5173)
cd frontend && npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)** and enter any U.S. address to begin.

### 4 · Run Tests

```bash
cd frontend && npm run test
```

### 5 · Production Build

```bash
cd frontend && npm run build   # → frontend/dist/
cd backend  && npm run build   # → backend/dist/
```

---

## ⚙️ Environment Variables Reference

| Variable | Required | Description |
|----------|:--------:|-------------|
| `CIVIC_API_KEY` | ✅ | Google Civic Information API key (server-side only) |
| `MAPS_EMBED_KEY` | ☐ | Google Maps Embed API key (server-side) |
| `TRANSLATION_API_KEY` | ☐ | Google Cloud Translation API key (server-side) |
| `GEMINI_API_KEY` | ☐ | Google Gemini API key for the Decrypt Term AI feature |
| `PORT` | ☐ | Backend port (default: `4000`) |
| `VITE_API_BASE_URL` | ✅ | URL of the Express backend, exposed to Vite |
| `VITE_MAPS_EMBED_KEY` | ☐ | Maps key exposed to the browser for the embed iframe |

See [`.env.example`](./.env.example) for the complete template.

---

## 🔧 Obtaining API Keys

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Navigate to **APIs & Services → Library**
4. Enable **Civic Information API** (required) and **Maps Embed API** (optional)
5. Go to **APIs & Services → Credentials → Create Credentials → API Key**
6. Restrict the key to the specific API(s) for production security

---

## 🐛 Common Issues

| Symptom | Resolution |
|---------|------------|
| Civic API returns `403 Forbidden` | Verify `CIVIC_API_KEY` is set in `.env` and the Civic API is enabled in your GCP project |
| `CORS error` in browser console | Confirm the backend is running on port `4000` and `VITE_API_BASE_URL` is correct |
| Polling-location map is blank | Add `VITE_MAPS_EMBED_KEY` to `.env` and restart the Vite dev server |
| Tests fail on CI | Ensure `jsdom` is listed in `vitest.config.ts` as the test environment |
| Address search returns no results | The Civic API only covers U.S. addresses; try a full street address including state and ZIP |

---

## 📄 License

Released under the **MIT License**. See [`LICENSE`](./LICENSE) for details.

---

<p align="center">
  Built with ❤️ for the <strong>Google Antigravity Challenge</strong> · Powered by the <strong>Google Civic Information API</strong>
</p>
