# ClinOps - Agentic Clinical Trial Project Manager

**Problem Statement:** Clinical trials are run across fragmented tools (email, spreadsheets, portals) with no system that “understands” the protocol, visit schedule, or regulatory rules. Trial teams struggle to coordinate enrollment, document versions, safety reporting, and audit readiness. This leads to missed steps (outdated consent forms, missing signatures, untracked deviations), operational delays, and high compliance and inspection risk.

**Solution:** ClinOps is an agentic clinical trial project manager: a shared workspace plus AI copilot that reads trial plans and regulatory guidance, turns them into milestones and checklists, and continuously watches for common risks. It provides trial-aware dashboards, smart alerts, document control guidance, and audit-ready structures—supporting coordinators, investigators, regulatory advisors, and data teams without replacing their medical or legal judgment.

**Objective:** Demonstrate in a focused pilot that ClinOps (1) reliably converts a protocol into a workable project plan, (2) reduces time and stress to prepare an audit-ready binder, (3) proactively flags typical compliance risks (e.g., outdated ICFs, expiring documents, missing documentation, enrollment or timeline slippage), and (4) is actively used and valued by trial coordinators and managers.

**Key Features (Concise):**

- Trial overview dashboards for enrollment, milestones, risks, and progress.
- Persona-based AI copilots (Coordinator, Regulatory, Quality/Data) with context-aware chat grounded in trial documents.
- Protocol-to-plan automation: milestones, visit schedules, checklists, and dependency mapping.
- Document and version awareness for protocols, ICFs, SOPs, and certifications with expiry and update alerts.
- Compliance and risk controls: deviation tracking hints, safety and reporting reminders, inspection readiness guidance.
- Audit preparation workspace with binder structure, completeness checklists, and CAPA planning support.
- End-to-end observability (OpenTelemetry, Prometheus, Grafana, Loki, Tempo) for system health and traceable audit trails.

## Personas & Tabs

- **Trial Coordinator persona** – focuses on day‑to‑day trial operations via tabs like `General`, `Trial Overview`, `Task Checklists`, `Team Workflows`, `Trial Timeline`, and `Quality Metrics`.
- **Regulatory Advisor persona** – focuses on compliance via tabs like `Protocol Requirements`, `Document Control`, `Compliance Diagrams`, `Risk & Controls`, `Audit Preparation`, and `Smart Alerts`.

Each persona sees the same chat but with prompts and tab content tailored to their role.

## Dashboards

- Each project has a **trial dashboard** that summarizes what the AI and users have built.
- Widgets highlight **enrollment status, site and milestone progress, risks, compliance tasks, and audit readiness**.
- Content in Coordinator/Regulatory tabs can be pushed into dashboards so teams see a **single, visual view** of operational and compliance health.

## Tech Stack (High-Level)

- **Frontend / App:** Next.js 15 + React 19, TypeScript, TailwindCSS, React Icons, React Markdown, Recharts.
- **Backend:** Next.js API routes on Node.js with TypeScript.
- **Data & Auth:** PostgreSQL with Prisma ORM, bcryptjs for passwords, `jose` for JWT auth.
- **AI:** Google Generative AI (Gemini) via `@google/generative-ai` for persona‑aware guidance and content.
- **Tooling:** Jest + Testing Library, ESLint, Docker/Docker Compose, optional Kubernetes deployment.

## Observability Tools

- **OpenTelemetry SDKs** – capture traces and metrics from the app.
- **Prometheus + prom-client** – scrape and store application metrics.
- **Grafana** – dashboards for app and infrastructure health.
- **Loki** – centralized log storage and search.
- **Tempo** – distributed traces for request flows.
- **Promtail** – ships logs from the host/application into Loki.

## How to Run Locally (Dev)

1. **Install dependencies**
   - `cd clin-ops`
   - `npm install`
2. **Configure environment**
   - Create `clin-ops/.env` with `DATABASE_URL`, `GOOGLE_GENERATIVE_AI_API_KEY`, `JWT_SECRET`, and other variables from `DEPLOYMENT.md`.
3. **Set up database (PostgreSQL)**
   - Ensure PostgreSQL is running and `DATABASE_URL` points to it.
   - `npx prisma db push` (or `npm run prisma:sync`).
4. **Start the app**
   - `npm run dev`
   - Open `http://localhost:3000` in your browser.
