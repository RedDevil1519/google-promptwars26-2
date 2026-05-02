# Voter Protocol Engine — Instruction Manual

> **Developer Reference** for the Election Education Platform.  
> This document covers setup, architecture decisions, API integration, testing, and accessibility requirements.

---

## 1. Project Overview

The **Voter Protocol Engine** is a full-stack web application that helps citizens:
- Discover elections in their area using the **Google Civic Information API**
- Understand their voter roadmap through a step-by-step UI component
- Add critical election deadlines to **Google Calendar** with a single click
- View their **polling location** via a Google Maps embed

---

## 2. Repository Structure

```
google-promptwars26-2/
├── frontend/                      # React + Vite + TypeScript SPA
│   ├── src/
│   │   ├── features/
│   │   │   ├── civic/
│   │   │   │   ├── hooks/
│   │   │   │   │   ├── useCivicData.ts        # Fetches & caches civic data
│   │   │   │   │   └── useCalendarSync.ts     # Generates Google Calendar links
│   │   │   │   ├── components/
│   │   │   │   │   ├── ElectionCard.tsx       # Displays a single election
│   │   │   │   │   └── RoadmapStepper.tsx     # Step-by-step voter roadmap
│   │   │   │   └── types.ts                   # Civic data type definitions
│   │   │   └── search/
│   │   │       └── components/
│   │   │           └── AddressSearch.tsx      # Address input with DOMPurify sanitization
│   │   ├── shared/
│   │   │   ├── components/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Spinner.tsx
│   │   │   │   └── ErrorBoundary.tsx
│   │   │   └── utils/
│   │   │       ├── dateParser.ts              # Date formatting utilities (unit-tested)
│   │   │       ├── cache.ts                   # localStorage 24-hour cache
│   │   │       └── sanitize.ts               # DOMPurify wrapper
│   │   ├── pages/
│   │   │   ├── HomePage.tsx                  # Landing + search
│   │   │   └── ElectionPage.tsx              # Election results + roadmap
│   │   ├── App.tsx                           # Router with React.lazy()
│   │   ├── main.tsx                          # React root with Suspense
│   │   └── index.css                         # Cyber-Civic dark theme
│   ├── vite.config.ts
│   ├── vitest.config.ts
│   ├── tsconfig.json
│   ├── .eslintrc.js
│   └── .prettierrc
├── backend/                       # Node + Express API proxy
│   ├── src/
│   │   ├── routes/
│   │   │   └── civic.ts           # /api/civic proxy endpoint
│   │   ├── middleware/
│   │   │   └── validate.ts        # Input sanitization middleware
│   │   └── index.ts               # App entry (Helmet, CORS, dotenv)
│   ├── package.json
│   └── tsconfig.json
├── .env.example                   # Template for environment variables
├── .gitignore
├── README.md
└── instruction.md                 # ← this file
```

---

## 3. Environment Setup

### 3.1 Required API Keys

| Variable | Required | Description |
|----------|----------|-------------|
| `CIVIC_API_KEY` | ✅ Yes | Google Civic Information API |
| `MAPS_EMBED_KEY` | Optional | Google Maps Embed API |
| `VITE_API_BASE_URL` | ✅ Yes | Backend URL for the frontend |
| `VITE_MAPS_EMBED_KEY` | Optional | Maps key exposed to browser |
| `PORT` | No (default: 4000) | Backend port |

### 3.2 Obtaining a Civic API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable **Civic Information API**
4. Create an API Key under **Credentials**
5. Restrict the key to the Civic Information API for security

---

## 4. Architecture Decisions

### 4.1 Feature-Sliced Design
Business logic is isolated by feature (`civic/`, `search/`) with shared utilities kept in `shared/`. This prevents coupling and makes the codebase easier to test and maintain.

### 4.2 API Proxy Pattern
The frontend **never** directly calls Google APIs. All requests are proxied through the Express backend, which:
- Keeps the API key server-side only
- Allows centralized rate limiting and error handling
- Enables future server-side caching if needed

### 4.3 24-Hour LocalStorage Cache
Civic API responses are cached by address key with a timestamp. Before any API call, the cache is checked:
```
cache key: civic_<sanitized_address>
cache value: { data: CivicResponse, timestamp: number }
TTL: 24 hours (86400000 ms)
```

### 4.4 React Suspense + Lazy Loading
Routes are code-split with `React.lazy()` + `<Suspense>`:
```tsx
const ElectionPage = React.lazy(() => import('./pages/ElectionPage'));
```
This ensures the initial bundle only loads the HomePage, dramatically improving first-paint performance.

---

## 5. Security Practices

| Practice | Implementation |
|----------|----------------|
| API key isolation | Keys in `.env`, never in client code |
| XSS prevention | `DOMPurify.sanitize()` on all user inputs |
| HTTP headers | `helmet()` middleware on Express |
| Input validation | Regex + length checks in `validate.ts` |
| CORS | Restricted to `localhost:5173` in dev |

---

## 6. Accessibility (WCAG 2.1 AA)

### Contrast Ratios
| Element | Foreground | Background | Ratio |
|---------|-----------|------------|-------|
| Body text | `#e2e8f0` | `#0a0e1a` | 12.3:1 ✅ |
| Accent text | `#00d4ff` | `#0a0e1a` | 7.8:1 ✅ |
| Button text | `#0a0e1a` | `#00d4ff` | 7.8:1 ✅ |
| Muted text | `#94a3b8` | `#131929` | 4.6:1 ✅ |

### Keyboard Navigation
- All interactive elements (`button`, `a`, `input`) have visible focus rings
- Focus order follows logical DOM order
- Modal/overlay elements trap focus appropriately
- All dynamic content updates are announced via `aria-live` regions

### Aria Labeling
- `aria-label` on all icon-only buttons
- `role="status"` on loading spinners
- `role="alert"` on error messages
- `aria-expanded` on collapsible sections
- `tabindex="0"` on custom interactive elements

---

## 7. Running Tests

```bash
cd frontend

# Run all tests once
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### What's Tested

| Test File | Type | What It Covers |
|-----------|------|----------------|
| `dateParser.test.ts` | Unit (Vitest) | Date formatting, invalid inputs, timezone edge cases |
| `RoadmapStepper.test.tsx` | Component (RTL) | Renders from mock state, step count, aria roles |

---

## 8. Google Calendar Integration

The `useCalendarSync` hook generates a Google Calendar URL:

```
https://calendar.google.com/calendar/render?action=TEMPLATE
  &text=<Election Name>
  &dates=<YYYYMMDD>/<YYYYMMDD>
  &details=<Description>
  &location=<Polling Address>
```

This opens in a new tab and pre-fills the event in the user's Google Calendar — no OAuth required.

---

## 9. Build for Production

```bash
# Frontend
cd frontend && npm run build     # Output: frontend/dist/

# Backend
cd backend && npm run build      # Output: backend/dist/
```

---

## 10. Common Issues

| Issue | Fix |
|-------|-----|
| Civic API returns 403 | Check `CIVIC_API_KEY` in `.env` |
| CORS error in browser | Ensure backend is running on port 4000 |
| Map not showing | Add `VITE_MAPS_EMBED_KEY` to `.env` |
| Tests fail on CI | Ensure `jsdom` is in Vitest config |
