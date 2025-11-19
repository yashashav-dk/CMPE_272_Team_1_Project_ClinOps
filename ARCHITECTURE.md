# ClinOps Project Architecture

## Overview

ClinOps (Project Weaver) is a clinical trial management system that helps teams automate trial planning, dashboard generation, and AI-powered content creation. The system uses a full-stack TypeScript architecture with Next.js for frontend and backend, Prisma for data persistence, and Google Generative AI for intelligent content generation.

---

## 1. High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│                  (React 19 / Next.js 15)                        │
├─────────────────────────────────────────────────────────────────┤
│  • Landing & Auth Pages        • Project Management             │
│  • Chat Interface              • Dashboard Viewer               │
│  • Feedback Modal              • Review Management              │
└──────────────┬──────────────────────────────────────────────────┘
               │ HTTPS / REST API
┌──────────────▼──────────────────────────────────────────────────┐
│                    API & SERVER LAYER                           │
│              (Next.js API Routes / TypeScript)                  │
├──────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │  Auth Service    │  │  AI Service      │  │  Dashboard   │  │
│  │  • Register      │  │  • Gemini SDK    │  │  • Parser    │  │
│  │  • Login         │  │  • Retry Logic   │  │  • Widgets   │  │
│  │  • JWT/Sessions  │  │  • Caching       │  │  • Reviews   │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │  Project Service │  │  Chat Service    │  │  Feedback    │  │
│  │  • CRUD Ops      │  │  • History       │  │  • Ratings   │  │
│  │  • Authorization │  │  • Messages      │  │  • Comments  │  │
│  │  • Multi-user    │  │  • Tab Content   │  │  • Storage   │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
└──────────────┬──────────────────────────────────────────────────┘
               │ Prisma ORM
┌──────────────▼──────────────────────────────────────────────────┐
│                   PERSISTENCE LAYER                             │
│              (PostgreSQL via Render / Cloud)                    │
├──────────────────────────────────────────────────────────────────┤
│  Users Table       Chat History Table      Dashboard Widgets    │
│  Projects Table    Messages Table          AI Response Cache    │
│  Feedback Table    Tab Contents            Saved Diagrams      │
│  Reviews Table     LLM Response Store      Tab Generations     │
└──────────────────────────────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────────────┐
│               EXTERNAL SERVICES & INTEGRATIONS                  │
├──────────────────────────────────────────────────────────────────┤
│  Google Generative AI (Gemini)  →  LLM for content generation  │
│  Environment Secrets Manager     →  API keys & DB credentials   │
│  Optional: Observability Stack   →  Monitoring & Logging        │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Layered Architecture

### 2.1 Presentation Layer (Frontend)

**Location:** `app/` (pages, components)

**Components:**
- `page.tsx` — Landing page with auth forms
- `[projectId]/page.tsx` — Project chat interface
- `trial-dashboard/[projectId]/page.tsx` — Dashboard view
- `components/` — Reusable UI components (Sidebar, Feedback, etc.)
- `ContextAwareChat.tsx` — Main chat UI with personas and tabs
- `MermaidDiagram.tsx` — Diagram rendering

**Key Features:**
- Server-side rendering for SEO and performance
- Client-side state management for chat and UI
- Real-time updates via websockets (future enhancement)
- Responsive design with Tailwind CSS

### 2.2 API / Business Logic Layer

**Location:** `app/api/`

**Modules:**

#### a. Authentication (`app/api/auth/`)
- `register` — User registration with bcrypt password hashing
- `login` — Session establishment with JWT tokens
- `logout` — Session termination
- `me` — Current user info endpoint

**Key Logic:**
```typescript
// lib/auth.ts
- verifyAuth(request) → JWT payload or null
- generateToken(userId) → JWT token
- bcrypt for password hashing
```

#### b. AI / LLM Service (`app/api/ai/`)
- `generate` — Main AI response generation
- `cache` — LLM response caching
- `chat` — Conversational AI with context

**Flow:**
```
User Prompt
   ↓
[API Route: /api/ai/generate]
   ↓
AIController (Gemini Provider)
   ├─ Check Prompt Hash in Cache
   ├─ If cached: Return cached response
   └─ If not: Call Gemini API with retry logic
   ↓
[Retry: 3 attempts, exponential backoff]
   ├─ Success → Store in cache & DB
   └─ Failure → Return error
   ↓
Response JSON → Client
```

#### c. Dashboard Service (`app/api/dashboard/`)
- `[projectId]` — GET/DELETE dashboard widgets
- `add-content` — Add new widget to dashboard
- `generate-structured` — AI-powered widget generation
- `[projectId]/reviews` — Dashboard reviews (GET/POST)

**Widget Flow:**
```
Trial Plan (Markdown)
   ↓
Dashboard Parser Service
   ├─ Extract: Diagrams (mermaid)
   ├─ Extract: KPIs (numeric metrics)
   ├─ Extract: Tables
   ├─ Extract: Timelines
   ├─ Extract: Checklists
   └─ Extract: Text blocks
   ↓
Structured Output Schema Validator
   ↓
MCP Data Restructurer
   ↓
Dashboard Widgets (JSON)
   ↓
Store in DB (DashboardWidget table)
   ↓
Display in UI
```

#### d. Project Service (`app/api/projects/`)
- `GET /api/projects` — List user's projects
- `POST /api/projects` — Create new project
- `GET /api/projects/[projectId]` — Get project details
- `PATCH /api/projects/[projectId]` — Update project
- `DELETE /api/projects/[projectId]` — Delete project

#### e. Feedback Service (`app/api/feedback/`)
- `POST /api/feedback` — Submit user feedback
- Captures rating (1-5) and optional comments
- Stores in `feedback` table

### 2.3 Data Access Layer (Prisma)

**Location:** `lib/prisma.ts`

**ORM Benefits:**
- Type-safe database queries
- Automatic schema migrations
- Query builder for complex operations
- Connection pooling

**Models:**
```
User ─→ Project ─→ ChatHistory ─→ Message
           ↓
        Project ─→ DashboardWidget
        Project ─→ SavedDiagram
        Project ─→ Feedback
        Project ─→ DashboardReview
```

### 2.4 Persistence Layer

**Database:** PostgreSQL (managed, e.g., Render)

**Tables:**

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | Authentication & identity | id, email, password_hash, created_at |
| `projects` | Trial projects | id, user_id, name, description |
| `chat_history` | Conversation logs | id, project_id, user_id, persona, current_tab |
| `messages` | Individual chat messages | id, chat_id, text, sender, timestamp |
| `tab_content` | Generated content per tab | id, chat_id, tab_type, content, generated_at |
| `dashboard_widgets` | Dashboard visual components | id, project_id, widget_type, content, title |
| `ai_responses` | LLM response history | id, project_id, prompt_hash, response, user_id |
| `ai_response_cache` | Cached LLM outputs | prompt_hash, prompt, response, user_id |
| `saved_diagrams` | User-saved Mermaid diagrams | id, project_id, diagram_code, diagram_type |
| `feedback` | User feedback | id, project_id, user_id, rating, comment |
| `dashboard_reviews` | Project dashboard reviews | id, project_id, author_id, text, rating |

---

## 3. Data Flow Diagrams

### 3.1 Authentication Flow

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ POST /api/auth/register {email, password}
       ↓
┌──────────────────────┐
│  Auth API Route      │ → Hash password with bcrypt
├──────────────────────┤ → Create User in DB
│  /api/auth/register  │ → Generate JWT token
└──────┬───────────────┘
       │ Return {user, token}
       ↓
┌─────────────┐
│   Browser   │ Store token in cookie / sessionStorage
│  (SPA State)│ Redirect to /:projectId
└─────────────┘
```

### 3.2 AI Content Generation Flow

```
User Input (Trial Plan Markdown)
       ↓
┌─────────────────────────────────┐
│ Chat UI (ContextAwareChat.tsx)   │ User selects persona (e.g., "smartAlerts")
│ POST /api/ai/generate            │ and sends to AI
└─────────────────┬───────────────┘
                  ↓
       ┌──────────────────────────┐
       │ AIController.ts          │
       │ GeminiProvider.ts        │ Check cache by prompt_hash
       └──────────┬───────────────┘
                  │
       ┌──────────▼──────────┐
       │ Cache Hit?          │
       └─────┬──────────┬────┘
            YES        NO
             │          │
       ┌─────▼────┐  ┌──▼──────────────────────┐
       │ Return   │  │ Call Google Gemini API  │
       │ Cached   │  │ with retry (3x) logic   │
       │ Response │  └──┬───────────────────────┘
       └─────┬────┘     │
             │      ┌───▼──────────────────┐
             │      │ Success?             │
             │      └─────┬────────────────┘
             │           YES
             │            │
             │      ┌──────▼─────────────┐
             │      │ Store in:          │
             │      │ • ai_response_cache│
             │      │ • ai_responses     │
             │      └──────┬─────────────┘
             │             │
             └─────┬───────┘
                   ↓
       ┌──────────────────────────┐
       │ Return AI Response JSON  │
       └──────┬───────────────────┘
              ↓
       ┌──────────────────────────┐
       │ Dashboard Parser         │ Parse markdown/mermaid
       │ (dashboard-parser.ts)    │ Extract structured data
       └──────┬───────────────────┘
              ↓
       ┌──────────────────────────┐
       │ Structured Schema        │ Validate output
       │ Validator                │
       └──────┬───────────────────┘
              ↓
       ┌──────────────────────────┐
       │ MCP Data Restructurer    │ Transform to widget objects
       │ (mcp-data-restructurer)  │
       └──────┬───────────────────┘
              ↓
       ┌──────────────────────────┐
       │ Dashboard Widgets (JSON) │ Store in DB
       │ POST /api/dashboard      │
       └──────┬───────────────────┘
              ↓
       ┌──────────────────────────┐
       │ UI Renders Widgets       │ User sees KPIs, tables, etc.
       └──────────────────────────┘
```

### 3.3 Project & Chat History Flow

```
User Creates Project
       ↓
POST /api/projects { name, description }
       ↓
Create in projects table
       ↓
Redirect to /:projectId
       ↓
Chat interface loads
       ↓
GET /api/dashboard/:projectId (fetch widgets)
GET /api/projects/:projectId/chats (fetch chat histories)
       ↓
Render chat UI + sidebar
       ↓
User sends message
       ↓
POST /api/ai/generate (or similar)
       ↓
AI generates content
       ↓
Save to chat_history, messages, tab_content
       ↓
Optional: Parse & create dashboard_widgets
       ↓
User can view trial-dashboard/:projectId
```

---

## 4. Service Architecture

### 4.1 Services Directory (`services/`)

```
services/
├── ai.ts                          # Main AI response wrapper
├── aiChat.ts                      # Chat-specific AI logic
├── ai-client.ts                   # HTTP client for AI calls
├── llm.ts                         # LLM prompt templates
├── dashboard-parser.ts            # Parse markdown → widgets
├── mcp-data-restructurer.ts       # Transform parsed → structured widgets
├── structured-output-schema.ts    # Validation schemas
├── _req.ts                        # Request utilities
└── controller/
    └── AIController.ts            # Gemini SDK provider, retry logic
```

### 4.2 Key Services

#### a. Dashboard Parser (`dashboard-parser.ts`)
**Purpose:** Extract structured widgets from markdown content.

**Input:** Markdown text (with optional mermaid diagrams)

**Output:** Array of `ParsedWidget` objects
```typescript
interface ParsedWidget {
  widgetType: 'diagram' | 'kpi' | 'table' | 'timeline' | 'list' | 'text'
  title: string
  content: any
}
```

**Process:**
1. Split markdown into sections
2. Identify diagrams (mermaid code blocks)
3. Extract KPIs (numeric patterns)
4. Parse markdown tables
5. Identify timelines (date patterns)
6. Build lists and checklists

#### b. MCP Data Restructurer (`mcp-data-restructurer.ts`)
**Purpose:** Transform parsed widgets into dashboard-ready structures.

**Responsibilities:**
- Enrich widget metadata
- Apply default styling
- Validate completeness
- Optimize for rendering

#### c. Structured Output Schema (`structured-output-schema.ts`)
**Purpose:** Define and validate output schemas using Zod.

**Schemas:** Define valid structures for KPIs, tables, diagrams, etc.

#### d. AI Controller (`services/controller/AIController.ts`)
**Purpose:** Manage Gemini API interactions.

**Features:**
- GeminiProvider class implementing LLMProvider interface
- Retry logic with exponential backoff (3 attempts)
- Error classification (retryable vs. fatal)
- Response validation

**Example Retry Flow:**
```
Attempt 1: Call Gemini API
  ├─ Success → Return response
  ├─ Timeout (503) → Wait 1s, retry
  ├─ Rate limit (429) → Wait 2s, retry
  └─ Fatal error → Return error immediately

Attempt 2: Retry with 2s delay
  └─ Success → Return response

Attempt 3: Retry with 4s delay
  └─ Success/Failure → Return result
```

---

## 5. Component Architecture

### 5.1 React Components

**Main Components:**
- `Sidebar` — Project navigation
- `ContextAwareChat` — Chat interface with personas
- `MermaidDiagram` — Render diagrams
- `WidgetRenderer` — Dashboard widget display
- `Feedback` — User feedback modal

**Component Hierarchy:**
```
App (page.tsx / layout.tsx)
  ├─ Sidebar (project list & nav)
  ├─ ContextAwareChat (main chat)
  │  ├─ Tab selector (personas)
  │  ├─ Message list
  │  ├─ Input area
  │  └─ Mermaid renderer
  ├─ TrialDashboard (trial-dashboard/[projectId])
  │  ├─ Dashboard header (stats, Clear All button)
  │  ├─ WidgetRenderer (per widget)
  │  └─ Reviews section
  └─ Feedback (global feedback button)
```

### 5.2 Page Structure

```
app/
├── page.tsx                      # Landing & auth
├── layout.tsx                    # Root layout
├── ContextAwareChat.tsx          # Main chat component
├── MermaidDiagram.tsx            # Diagram renderer
├── components/
│  ├── Sidebar.tsx               # Project navigation
│  ├── Feedback.tsx              # Feedback modal
│  ├── LogoutButton.tsx          # Auth controls
│  └── TelemetryProvider.tsx     # Observability
├── [projectId]/
│  ├── layout.tsx                # Project-specific layout
│  └── page.tsx                  # Chat & dashboard switcher
├── trial-dashboard/
│  └── [projectId]/
│      ├── page.tsx              # Dashboard view
│      └── components/
│          └── WidgetRenderer.tsx # Widget display
└── api/
    ├── auth/                    # Authentication routes
    ├── ai/                      # AI generation routes
    ├── dashboard/               # Dashboard routes
    ├── projects/                # Project routes
    ├── feedback/                # Feedback routes
    └── ... (other routes)
```

---

## 6. Request/Response Flow Example

### User Creates Trial Dashboard

```
1. User uploads trial plan markdown
   └─ POST /api/dashboard/add-content
      Body: { projectId, content, tabType }

2. Server receives request
   ├─ Validate auth token
   ├─ Parse markdown using dashboard-parser.ts
   └─ Extract widgets

3. Validate structure
   └─ Use structured-output-schema.ts

4. Transform to dashboard widgets
   └─ Use mcp-data-restructurer.ts

5. Store in database
   └─ prisma.dashboardWidget.createMany(...)

6. Return success response
   └─ { success: true, widgets: [...] }

7. Frontend updates
   ├─ Fetch dashboard: GET /api/dashboard/:projectId
   └─ Render WidgetRenderer for each widget
```

---

## 7. Deployment Architecture

### 7.1 Development Environment

```
Local Machine
  ├─ Node.js 18+
  ├─ PostgreSQL (local or managed)
  ├─ Environment variables (.env.local)
  │  ├─ DATABASE_URL
  │  ├─ GEMINI_API_KEY
  │  └─ NEXTAUTH_URL (if using)
  └─ npm run dev
      └─ Starts Next.js dev server on http://localhost:3000
```

### 7.2 Staging / Production Deployment

```
┌──────────────────────────────────────┐
│       GitHub Repository              │
│   (CMPE_272_Team_1_Project_ClinOps) │
└────────────┬─────────────────────────┘
             │
    ┌────────▼─────────┐
    │  GitHub Actions  │  Trigger on push to main
    │  CI/CD Pipeline  │  ├─ Lint & Format
    │                  │  ├─ Run Tests
    │                  │  └─ Build Docker image
    └────────┬─────────┘
             │
    ┌────────▼─────────────────┐
    │  Container Registry      │  Store built images
    │  (Docker Hub / ECR)      │
    └────────┬─────────────────┘
             │
    ┌────────▼──────────────────────────┐
    │   Deployment Platform Options:    │
    │                                   │
    │ Option A: Render                  │
    │   ├─ Managed PostgreSQL           │
    │   ├─ Auto deploy from repo        │
    │   └─ Environment variables        │
    │                                   │
    │ Option B: Kubernetes (GKE/EKS)    │
    │   ├─ Deployment manifests         │
    │   ├─ Service definitions          │
    │   ├─ Ingress rules                │
    │   └─ Persistent volumes           │
    │                                   │
    │ Option C: Vercel (Next.js native) │
    │   ├─ Auto deployment              │
    │   ├─ Serverless functions         │
    │   └─ Managed database             │
    └────────┬──────────────────────────┘
             │
    ┌────────▼──────────────────┐
    │    Managed PostgreSQL     │
    │                           │
    │ ├─ Automated backups      │
    │ ├─ Read replicas          │
    │ ├─ PITR recovery          │
    │ └─ Connection pooling     │
    └────────┬──────────────────┘
             │
    ┌────────▼──────────────────────┐
    │   External Services           │
    │                               │
    │ ├─ Google Generative AI       │
    │ ├─ Secret Manager             │
    │ ├─ CDN (optional)             │
    │ └─ Observability stack        │
    └───────────────────────────────┘
```

### 7.3 Dockerfile Recommendation

```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runtime
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"]
```

### 7.4 Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/clinops_db

# Authentication
NEXTAUTH_URL=https://clinops.example.com
NEXTAUTH_SECRET=<random-secret>

# AI / LLM
GEMINI_API_KEY=<api-key>

# Optional Observability
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
SENTRY_DSN=<sentry-dsn>
```

---

## 8. Security Architecture

### 8.1 Authentication & Authorization

```
┌──────────────────┐
│ User Login       │
└────────┬─────────┘
         │
    ┌────▼──────────────┐
    │ Validate Email    │
    │ Hash Password     │
    │ Compare Hash      │
    └────┬──────────────┘
         │
    ┌────▼──────────────────────┐
    │ Generate JWT Token        │
    │ Set httpOnly cookie       │
    │ (or sessionStorage)       │
    └────┬──────────────────────┘
         │
    ┌────▼──────────────┐
    │ Authenticated     │
    │ (Token in header) │
    └────┬──────────────┘
         │
    ┌────▼─────────────────────┐
    │ Verify Token on API       │
    │ Extract userId            │
    │ Check permissions         │
    └────┬─────────────────────┘
         │
    ┌────▼──────────────┐
    │ Process Request   │
    │ Return Data       │
    └──────────────────┘
```

### 8.2 Data Protection

- **Passwords:** Hashed with bcrypt (cost factor 12)
- **Secrets:** Stored in environment variables, never in code
- **API Keys:** Managed by cloud secret manager
- **Database:** Connection via SSL/TLS
- **Transport:** HTTPS for all communications

### 8.3 Input Validation

```typescript
// Zod schemas
export const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional()
})

// Validation in API routes
const { data, error } = createProjectSchema.safeParse(body)
if (error) return NextResponse.json({ error }, { status: 400 })
```

---

## 9. Scalability Considerations

### 9.1 Horizontal Scaling

```
Load Balancer (e.g., Nginx, HAProxy)
   │
   ├─ Pod/Instance 1 (Next.js App)
   ├─ Pod/Instance 2 (Next.js App)
   ├─ Pod/Instance 3 (Next.js App)
   └─ Pod/Instance N (Next.js App)
        │
        └─ PostgreSQL (managed, read replicas)
             │
             ├─ Primary (writes)
             └─ Read Replicas (reads)
```

### 9.2 Caching Strategy

```
Browser Cache (static assets, Tailwind CSS)
   ↓
CDN Cache (CloudFlare, CloudFront)
   ↓
Server-side Cache (Redis for AI responses)
   ↓
Database Query Cache (Prisma caching, DB indexes)
```

### 9.3 Database Optimization

```
Indexes on frequently queried columns:
  - projects(user_id)
  - chat_history(project_id)
  - dashboard_widgets(project_id, widget_type)
  - ai_response_cache(prompt_hash)

Connection pooling:
  - PgBouncer or similar for connection management

Partitioning (future):
  - Partition by project_id or time range for very large tables
```

---

## 10. Monitoring & Observability

### 10.1 Logging

```
Application Logs
   └─ File system or centralized logging (EFK stack, CloudWatch)

Log Levels:
  - ERROR: Exceptions, failures
  - WARN: Deprecations, unusual conditions
  - INFO: Request lifecycle, key events
  - DEBUG: Detailed traces (dev only)
```

### 10.2 Metrics

```
Key Performance Indicators:
  - API response latency (p50, p95, p99)
  - Error rate (4xx, 5xx)
  - Database query duration
  - AI API call latency & success rate
  - Dashboard widget rendering time
  - User session duration
```

### 10.3 Tracing (Optional OpenTelemetry)

```
Request enters app
   ├─ Create trace ID
   ├─ Log request metadata
   ├─ Call downstream services (AI, DB)
   │  └─ Create spans for each operation
   └─ Aggregate metrics at exit
      └─ Send to tracing backend (Jaeger, Datadog)
```

---

## 11. API Endpoints Summary

### Authentication
- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — User login
- `POST /api/auth/logout` — Logout
- `GET /api/auth/me` — Current user

### Projects
- `GET /api/projects` — List projects
- `POST /api/projects` — Create project
- `GET /api/projects/:id` — Get project
- `PATCH /api/projects/:id` — Update project
- `DELETE /api/projects/:id` — Delete project

### AI / Chat
- `POST /api/ai/generate` — Generate AI response
- `GET /api/ai/cache` — Retrieve cached response (optional)

### Dashboard
- `GET /api/dashboard/:projectId` — Get widgets
- `POST /api/dashboard/add-content` — Add widget
- `DELETE /api/dashboard/:projectId` — Clear all widgets
- `DELETE /api/dashboard/:projectId?widgetId=X` — Delete widget
- `POST /api/dashboard/:projectId/reviews` — Add review
- `GET /api/dashboard/:projectId/reviews` — Get reviews

### Feedback
- `POST /api/feedback` — Submit feedback

### Health & Observability
- `GET /api/health` — Health check
- `POST /api/metrics` — Metrics endpoint

---

## 12. Development Workflow

### 12.1 Local Development

```bash
# Clone repo
git clone https://github.com/yashashav-dk/CMPE_272_Team_1_Project_ClinOps.git
cd clin-ops

# Install dependencies
npm ci

# Set environment
export DATABASE_URL="postgresql://..."
export GEMINI_API_KEY="..."

# Run migrations
npx prisma migrate dev --name init

# Start dev server
npm run dev
# Open http://localhost:3000
```

### 12.2 Testing Strategy

```
Unit Tests (Jest)
  └─ dashboard-parser.test.ts
  └─ structured-output-schema.test.ts
  └─ mcp-data-restructurer.test.ts

Integration Tests (Jest + API)
  └─ integration.test.ts (parser → widget pipeline)

E2E Tests (Cypress, future)
  └─ Auth flow
  └─ Create project
  └─ Generate widgets
  └─ View dashboard

Load Testing (k6, future)
  └─ Test 1000+ concurrent users
  └─ Measure API latency, AI throughput
```

### 12.3 Database Migrations

```bash
# Create migration
npx prisma migrate dev --name add_feedback

# Deploy to production
npx prisma migrate deploy

# View migration status
npx prisma migrate status

# Rollback (if not yet deployed)
npx prisma migrate resolve --rolled-back <migration-name>
```

---

## 13. Future Enhancements

### Phase 2
- [ ] Real-time chat with WebSockets
- [ ] AI-powered smart alerts for compliance risks
- [ ] Background job queue (BullMQ + Redis)
- [ ] Admin dashboard for feedback analytics
- [ ] Export widgets to PDF/DOCX

### Phase 3
- [ ] Enterprise SSO (SAML/Okta)
- [ ] Multi-language support
- [ ] Mobile app (React Native)
- [ ] Advanced search and filtering
- [ ] Team collaboration (shared projects)

### Phase 4
- [ ] HIPAA compliance module
- [ ] Advanced audit logging
- [ ] Integration marketplace
- [ ] Workflow automation builder
- [ ] Predictive analytics

---

## 14. References & Key Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies & scripts |
| `prisma/schema.prisma` | Database schema & models |
| `tsconfig.json` | TypeScript configuration |
| `next.config.ts` | Next.js configuration |
| `lib/auth.ts` | Auth utilities |
| `lib/prisma.ts` | Prisma client singleton |
| `services/dashboard-parser.ts` | Widget parsing logic |
| `services/controller/AIController.ts` | LLM provider |
| `app/api/**` | API routes & handlers |
| `app/components/**` | React components |

---

## Conclusion

ClinOps architecture is designed for scalability, maintainability, and extensibility. It separates concerns across well-defined layers, uses industry-standard tools (Next.js, Prisma, TypeScript), and provides a solid foundation for adding features like real-time collaboration, advanced observability, and enterprise compliance capabilities.

The modular design allows teams to work independently on different services, and the strong typing with TypeScript reduces bugs and improves developer experience.
