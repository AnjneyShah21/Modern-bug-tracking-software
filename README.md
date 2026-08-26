# Bugzilla Reimagined

A contemporary, high-fidelity reimagining of the classic Bugzilla issue tracking workspace. Built as a modern developer tool (inspired by Linear and GitHub Issues caliber UX) with full-stack capabilities, role-based workflows, in-app notifications, and advanced AI integrations.

---

## 🚀 Tech Stack

- **Frontend**: React + Next.js (App Router, Route Groups, Server Actions), TypeScript, Tailwind CSS (v4)
- **Backend**: Node.js Route Handlers (Next.js API Routes)
- **Database**: PostgreSQL with Prisma ORM (relational mapping, self-linked bug dependencies)
- **Auth**: Credentials-based session authentication with NextAuth.js
- **Icons & Styling**: Lucide React + Tailwind CSS
- **Visualization**: Recharts (status & severity distributions)
- **AI Integrations**: Native fetch wrapper supporting Anthropic Claude (Sonnet 3.5) & OpenAI (GPT-4o) with a rules-based local mockup fallback when offline or without keys.

---

## ⚡ Standout AI-Powered Features

1. **AI Triage Co-pilot**: When creating a bug, a single click prompts the LLM to inspect the description, check historical resolvers for that project area, and recommend the best severity, priority, component, and assignee.
2. **Semantic Duplicate Auditor**: A debounced checker runs in the background as you draft your bug title and description, warning you live with a similarity matching score and link if you are about to file a duplicate ticket.
3. **Raw Log / Stack Trace Formatter**: A dedicated formatting area where you paste raw console outputs, core dumps, or messy emails, and an "AI Format" button restructures them instantly into clean *Steps to Reproduce*, *Expected*, and *Actual Behavior* fields.
4. **AI Natural-Language Search**: A search bar in the header that takes queries like *"show me all critical bugs in project Acme assigned to me that are still open"* and calls the LLM to resolve pronouns ("me"), component names, and priorities into structured Prisma filters.
5. **AI Discussion Summarizer**: A one-click summarizer inside bug threads that condenses long back-and-forth comment streams into a status bullet list and current blockers.

---

## 📁 Directory Structure

```
bugzilla-project/
├── prisma/
│   ├── schema.prisma       # Database relations, self-linking dependency models
│   └── seed.ts             # High-quality seeding script (Sarah, Alex, Jane, Stripe outages)
├── public/
│   └── uploads/            # Local file storage for stack traces/screenshots
├── src/
│   ├── app/                # App Router Layouts
│   │   ├── api/            # API Route Handlers (Bugs CRUD, Comments, Uploads, AI actions)
│   │   ├── (dashboard)/    # Authenticated section group
│   │   │   ├── page.tsx    # Dashboard (recharts statistics, counters, live activity logs)
│   │   │   ├── layout.tsx  # Core shell (sidebar, AI search header, in-app notifications)
│   │   │   ├── kanban/     # Native HTML5 drag-and-drop workflow board
│   │   │   └── bugs/       # Explorer table (shortcuts, search filters, detail tabs)
│   │   ├── login/          # Dark login workspace
│   │   └── layout.tsx      # Main wrapper & session providers
│   ├── components/         # Providers and custom wrappers
│   └── lib/                # Shared utilities (prisma client, AI wrappers)
```

---

## 🛠️ Step-by-Step Setup Instructions

### 1. Database Setup (Render or PostgreSQL)
1. If you are using a **Render.com** PostgreSQL database, create a new PostgreSQL database in your Render dashboard.
2. Copy the **External Database URL** (e.g. `postgresql://user:password@host:port/dbname?sslmode=require`).
3. Open the `.env` file at the root of the workspace:
   ```env
   DATABASE_URL="YOUR_RENDER_EXTERNAL_URL"
   ```
4. If you prefer a local database, update `.env` with your local PostgreSQL password.

### 2. AI Service Keys (Optional)
If you want to use the live Claude/GPT endpoints, paste your key in `.env`:
```env
ANTHROPIC_API_KEY="sk-ant-..."
# OR
OPENAI_API_KEY="sk-..."
```
*Note: If no keys are provided, the app automatically falls back to an intelligent rules-based parsing engine so you can fully test the flows offline.*

### 3. Initialize & Seed Database
Run the following commands in your terminal to create the relational tables and populate them with the rich demo dataset:
```bash
# Push database structure
npx prisma db push

# Seed the database
npx prisma db seed
```

### 4. Run Development Server
Start the local server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demo Login Accounts

All accounts use the password: **`password123`**

- **Sarah Connor** (Admin): `admin@bugzilla.com`
- **Alex Mercer** (Developer): `dev1@bugzilla.com`
- **Elena Rostova** (Developer): `dev2@bugzilla.com`
- **Jane Foster** (QA): `qa@bugzilla.com`
- **John Doe** (Reporter): `reporter@bugzilla.com`
