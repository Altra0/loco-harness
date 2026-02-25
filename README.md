# LOCO — Career Operating System

A three-layer career advisory system: deterministic POTS Engine (Layer 1), conversational AI (Layer 2), and sandbox agents (Layer 3). Built with Next.js 16, Drizzle, Neon, and Vercel AI SDK.

---

## Getting Started

### Prerequisites

- **Node.js** 20.9+ and npm (or pnpm/yarn)
- **Neon** account for Postgres ([neon.tech](https://neon.tech))
- **Anthropic** API key for Claude ([console.anthropic.com](https://console.anthropic.com))
- **GitHub OAuth App** (optional, for Evidence Compiler slice) — [GitHub Developer Settings](https://github.com/settings/developers)

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/loco-harness.git
cd loco-harness
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and set:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon Postgres connection string (from [Neon Console](https://console.neon.tech)) |
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key for Claude |
| `NEXT_PUBLIC_APP_URL` | Yes | Base URL — `http://localhost:3000` for local dev |
| `GITHUB_CLIENT_ID` | No | For Evidence Compiler (Slice 4) — create OAuth App in GitHub |
| `GITHUB_CLIENT_SECRET` | No | GitHub OAuth App secret |

### 4. Set up the database

Create tables and seed initial data:

```bash
npm run db:push
npm run db:seed
npm run db:seed-interview
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use LOCO.

### Quick test flow

1. Go to **Onboarding** (`/onboarding`) — enter email, years of experience, degree, internships → get phase + objectives
2. Go to **Evidence Vault** (`/evidence-vault`) — submit evidence → see score + vault
3. Go to **Talk to SERGENT** (`/conversation`) — chat about your career
4. Go to **Evidence Compiler** (`/evidence-compiler`) — connect GitHub, analyze repos (requires GitHub OAuth)
5. Go to **CV Compiler** (`/cv-compiler`) — generate tailored PDF
6. Go to **Application Researcher** (`/application-researcher`) — get company briefing
7. Go to **Interview Prep** (`/interview-prep`) — practice problems, log as evidence

---

## Deployment

### Deploy to Vercel (recommended)

LOCO is built for Vercel. Deploy in a few steps:

#### 1. Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

#### 2. Import project in Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Vercel will auto-detect Next.js

#### 3. Configure environment variables

In your Vercel project → **Settings → Environment Variables**, add:

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | `postgresql://...` | From Neon Console → Connection string |
| `ANTHROPIC_API_KEY` | `sk-ant-...` | From Anthropic Console |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | Your production URL |
| `GITHUB_CLIENT_ID` | `Ov23li...` | From GitHub OAuth App |
| `GITHUB_CLIENT_SECRET` | `...` | From GitHub OAuth App |

**GitHub OAuth callback URL** (set in GitHub OAuth App):

```
https://your-app.vercel.app/api/auth/github/callback
```

#### 4. Deploy

Click **Deploy**. Vercel builds and deploys automatically.

#### 5. Run database migrations (first deploy)

After the first deploy, run migrations against your production DB:

```bash
DATABASE_URL="your-production-neon-url" npm run db:push
DATABASE_URL="your-production-neon-url" npm run db:seed
DATABASE_URL="your-production-neon-url" npm run db:seed-interview
```

Or use the Neon SQL Editor to run the schema; then run the seed scripts locally with the production `DATABASE_URL`.

### Neon database setup

1. Create a project at [console.neon.tech](https://console.neon.tech)
2. Copy the connection string (with `?sslmode=require` for production)
3. Use it as `DATABASE_URL` in Vercel env vars

### GitHub OAuth (for Evidence Compiler)

1. Go to [GitHub Settings → Developer settings → OAuth Apps](https://github.com/settings/developers)
2. **New OAuth App**
3. **Application name**: LOCO (or your app name)
4. **Homepage URL**: `https://your-app.vercel.app`
5. **Authorization callback URL**: `https://your-app.vercel.app/api/auth/github/callback`
6. Copy **Client ID** and **Client Secret** → add to Vercel env vars

---

## Project structure

```
├── app/
│   ├── api/              # API routes (onboarding, evidence, conversations, workflows)
│   ├── onboarding/       # Slice 1 — Phase classification
│   ├── evidence-vault/   # Slice 2 — Evidence capture
│   ├── conversation/     # Slice 3 — SERGENT chat
│   ├── evidence-compiler/# Slice 4 — GitHub repo analysis
│   ├── cv-compiler/      # Slice 5 — CV PDF generation
│   ├── application-researcher/ # Slice 6 — Company briefing
│   └── interview-prep/   # Slice 7 — Practice problems
├── lib/
│   ├── db/               # Drizzle schema, client
│   ├── pots/             # Layer 1 — engine, scorer, analyzers
│   ├── ai/               # SERGENT system prompt
│   └── pdf/              # CV PDF document
├── scripts/              # Seed scripts
└── drizzle.config.ts
```

## Slices (all 7 implemented)

| Slice | Route | Description |
|-------|-------|-------------|
| 1 | `/onboarding` | Phase classification (POTS), greeting, objectives |
| 2 | `/evidence-vault` | Evidence capture, scoring, vault, shareable links |
| 3 | `/conversation` | SERGENT chat, state, history |
| 4 | `/evidence-compiler` | GitHub OAuth, repo analysis, Claude synthesis, add to vault |
| 5 | `/cv-compiler` | Role/company form, structure CV, Claude tailoring, PDF download |
| 6 | `/application-researcher` | Company/role briefing from public data |
| 7 | `/interview-prep` | Practice problem, submit solution, rubric score, log as evidence |

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run db:push` | Push Drizzle schema to database |
| `npm run db:seed` | Seed career phases and objectives |
| `npm run db:seed-interview` | Seed interview prep problem templates |

---

## License

Private / Proprietary. All rights reserved.
