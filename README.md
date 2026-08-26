# Bugzilla Reimagined

A contemporary, high-fidelity issue tracking workspace built for modern engineering teams. Inspired by Linear and GitHub Issues UX with full-stack capabilities, role-based workflows, in-app notifications, Kanban boards, and advanced AI integrations.

---

## 📖 User Guide: How to Use the Application

### 1. 🔐 Logging In
Access the app using either of the default clean accounts (Password: **`password123`**):
- **System Admin**: `admin@bugzilla.com`
- **Lead Developer**: `dev@bugzilla.com`

---

### 2. ➕ How to File a New Bug / Issue
1. Click the **"+ File New Bug"** button in the sidebar navigation or header.
2. Fill out the core fields:
   - **Title**: A concise title describing the defect.
   - **Project & Component**: Select the affected workspace and module.
   - **Description**: Detailed description of the problem.
   - **Steps to Reproduce**: Step-by-step instructions to trigger the bug.
   - **Expected vs Actual Behavior**: Clear statements of what should happen vs what actually happened.
3. *(Optional)* **AI Tools**:
   - **Format Raw Logs**: Click **"Format Raw Log / Email"** to paste raw stack traces or terminal output. Click **"AI Format"** to automatically parse it into clean steps and behavior fields.
   - **AI Auto-Triage**: Click **"AI Auto-Triage"** to let the AI suggest the optimal *Severity*, *Priority*, *Component*, and *Assignee*.
   - **Duplicate Warning**: As you type your title and description, the real-time AI auditor will alert you if a similar bug already exists.
4. Click **"Submit Bug Report"**.

---

### 3. 📊 Managing Bugs & Workflow Transitions
- **Kanban Board**: Navigate to **Kanban** to visually drag and drop bugs across columns: `NEW` ➔ `TRIAGED` ➔ `IN_PROGRESS` ➔ `IN_REVIEW` ➔ `RESOLVED` ➔ `CLOSED`.
- **All Bugs Explorer**: View, sort, filter, or search bugs by severity, status, component, or assignee.
- **Natural Language AI Search**: Use the header search bar to ask in plain English (e.g., *"show open critical bugs assigned to me"*).

---

### 4. 💬 Comments, Attachments & History
On any bug's detail page (`/bugs/[id]`):
- **Change Status / Assignee**: Use the metadata sidebar to reassign or change state.
- **Add Comments**: Post updates or upload files/screenshots.
- **AI Discussion Summary**: Click **"AI Summarize Thread"** to generate a quick bulleted summary of long discussion threads.
- **Audit Logs**: View an immutable log of every field change, timestamp, and user action.

---

## 🛠️ Developer Setup & Deployment Guide

### Tech Stack
- **Frontend**: Next.js (App Router, Server Actions), TypeScript, Tailwind CSS (v4)
- **Backend**: Node.js Route Handlers (Next.js API Routes)
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: Session-based credentials authentication with NextAuth.js
- **AI Integrations**: Native API fetch wrappers for Anthropic Claude (Sonnet) & OpenAI (GPT-4o) with intelligent rules fallback.

---

### Step-by-Step Setup

#### 1. Clone & Install
```bash
git clone https://github.com/AnjneyShah21/Modern-bug-tracking-software.git
cd Modern-bug-tracking-software
npm install
```

#### 2. Configure Environment Variables (`.env`)
Create or edit your `.env` file:
```env
# Render PostgreSQL or local connection string
DATABASE_URL="postgresql://user:password@host:port/dbname?sslmode=require"

# NextAuth secret & URL
NEXTAUTH_SECRET="f6c8d76e7b1a29384756c2d1b0a7c4f5e6d7c8b9a0b1c2d3"
NEXTAUTH_URL="http://localhost:3000"

# (Optional) Anthropic Claude API Key for Live AI
ANTHROPIC_API_KEY="sk-ant-..."
```

#### 3. Initialize & Seed Database
```bash
# Push database schema to PostgreSQL
npx prisma db push

# Seed initial system accounts (admin@bugzilla.com & dev@bugzilla.com)
npx prisma db seed
```

#### 4. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## ☁️ Deploying on Render

This repository includes a [`render.yaml`](render.yaml) blueprint for deployment on **Render**:

1. Log into **[Render Dashboard](https://dashboard.render.com)**.
2. Click **New +** -> **Blueprint**.
3. Connect `AnjneyShah21/Modern-bug-tracking-software`.
4. Render will automatically provision:
   - Free **PostgreSQL Database**
   - Free **Next.js Web Service**
   - Execute database migration, seed, and build commands.
