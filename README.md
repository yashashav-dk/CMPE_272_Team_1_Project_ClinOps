# ClinOps - Agentic Clinical Trial Project Manager

## Team Members

| Name | SJSU ID |
|------|---------|
| Pranav Jitendra Trivedi | 019089512 |
| Mohit Manoj Barade | 019130137 |
| Yashashav Devalapalli Kamalraj | 017856371 |
| Anupama Singh | 191042305 |

## Project Overview

**Problem Statement:** Clinical trials are run across fragmented tools (email, spreadsheets, portals) with no system that “understands” the protocol, visit schedule, or regulatory rules. Trial teams struggle to coordinate enrollment, document versions, safety reporting, and audit readiness. This leads to missed steps (outdated consent forms, missing signatures, untracked deviations), operational delays, and high compliance and inspection risk.

**Solution:** ClinOps is an agentic clinical trial project manager: a shared workspace plus AI copilot that reads trial plans and regulatory guidance, turns them into milestones and checklists, and continuously watches for common risks. It provides trial-aware dashboards, smart alerts, document control guidance, and audit-ready structures—supporting coordinators, investigators, regulatory advisors, and data teams without replacing their medical or legal judgment.

**Objective:** Demonstrate in a focused pilot that ClinOps (1) reliably converts a protocol into a workable project plan, (2) reduces time and stress to prepare an audit-ready binder, (3) proactively flags typical compliance risks (e.g., outdated ICFs, expiring documents, missing documentation, enrollment or timeline slippage), and (4) is actively used and valued by trial coordinators and managers.

## Key Features

- **AI-Powered Chat**: Context-aware AI assistant for generating trial content.
- **Dashboard**: Visual dashboard for tracking trial progress and widgets.
- **Smart Send**: Automatically generate structured dashboard widgets from chat content.
- **Project Management**: Create and manage multiple clinical trial projects.
- **Guest Access**: Try the platform without creating an account.
- **Protocol-to-Plan Automation**: Milestones, visit schedules, checklists, and dependency mapping.
- **Document Control**: Version awareness for protocols, ICFs, SOPs, and certifications with expiry alerts.
- **Compliance & Risk**: Deviation tracking hints, safety reporting reminders, inspection readiness guidance.
- **Audit Preparation**: Workspace with binder structure, completeness checklists, and CAPA planning support.

## Personas & Tabs

- **Trial Coordinator persona** – focuses on day‑to‑day trial operations via tabs like `General`, `Trial Overview`, `Task Checklists`, `Team Workflows`, `Trial Timeline`, and `Quality Metrics`.
- **Regulatory Advisor persona** – focuses on compliance via tabs like `Protocol Requirements`, `Document Control`, `Compliance Diagrams`, `Risk & Controls`, `Audit Preparation`, and `Smart Alerts`.

Each persona sees the same chat but with prompts and tab content tailored to their role.

## Dashboards

- Each project has a **trial dashboard** that summarizes what the AI and users have built.
- Widgets highlight **enrollment status, site and milestone progress, risks, compliance tasks, and audit readiness**.
- Content in Coordinator/Regulatory tabs can be pushed into dashboards so teams see a **single, visual view** of operational and compliance health.

## Technologies Used

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Prisma (SQLite for local dev, PostgreSQL for prod)
- **AI Integration**: Google Generative AI (Gemini) / OpenAI (configurable)
- **Testing**: Jest & React Testing Library
- **Observability**: OpenTelemetry, Prometheus, Grafana, Loki, Tempo

## Testing & Performance

### Test Coverage
The project maintains a robust test suite with **167 passing tests** across 23 test suites, covering:
-   **Unit Tests**: For individual components and utility functions.
-   **Integration Tests**: Verifying API routes and service interactions.
-   **UI Tests**: Ensuring correct rendering and user interactions for widgets and dashboards.

To run the tests:
```bash
npm test
```

### Performance Optimizations
-   **Server-Side Rendering (SSR)**: Leverages Next.js App Router for faster initial page loads and SEO.
-   **Code Splitting**: Automatic route-based code splitting to reduce bundle size.
-   **Memoization**: Strategic use of `useMemo` and `useCallback` in complex interactive components (e.g., `InteractiveChecklist`) to prevent unnecessary re-renders.
-   **Observability**: Integrated `TelemetryProvider` for monitoring application performance and user interactions.

## Getting Started

### Prerequisites

- Node.js (v18 or later recommended)
- npm (v9 or later)

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd clin-ops
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Set up environment variables. Copy `.env.example` to `.env.local` and fill in the values.
    *(Note: For this submission, the app is configured to run with default settings if no `.env` is provided, using mock or local services where applicable.)*

### Running the Application

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Learn More

To learn more about Next.js, take a look at the following resources:

-   [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
-   [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
