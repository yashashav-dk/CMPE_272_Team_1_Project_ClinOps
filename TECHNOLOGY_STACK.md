# ClinOps - Technology Stack & Architecture

**Project Name:** ClinOps - Agentic Clinical Trial Project Manager  
**Version:** 0.1.0  
**Date:** November 2025

---

## 📋 Executive Summary

ClinOps is a full-stack web application that combines **AI-powered automation** with **real-time project management** for clinical trials. The tech stack emphasizes scalability, type safety, and extensibility using modern cloud-native technologies.

---

## 🏗️ Technology Stack Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                           │
│  React 19 + Next.js 15 + TypeScript + Tailwind CSS         │
└─────────────────────────────────────────────────────────────┘
                           ▲
                           │ REST/JSON
                           │
┌─────────────────────────────────────────────────────────────┐
│                    API LAYER                                │
│  Next.js App Router + Server/Client Components             │
│  Express-like routing with TypeScript                       │
└─────────────────────────────────────────────────────────────┘
                           ▲
                           │ SQL
                           │
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYER                               │
│  Prisma ORM 5 + PostgreSQL                                  │
│  Type-safe database access + auto-migrations               │
└─────────────────────────────────────────────────────────────┘
                           ▲
                           │
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                        │
│  Google Generative AI (Gemini 2.5-pro) + Observability     │
└─────────────────────────────────────────────────────────────┘
```

---

## 1️⃣ Frontend Technologies

### **Core Framework**
- **Next.js 15** (with Turbopack)
  - Full-stack React framework
  - App Router (file-based routing)
  - Server-side rendering (SSR)
  - Static site generation (SSG)
  - Incremental Static Regeneration (ISR)
  - Built-in API routes
  - Fast refresh during development
  - **Why:** Industry-leading React meta-framework for production apps

- **React 19.1.0**
  - Modern UI library
  - Functional components + Hooks
  - Server/Client component split
  - Suspense & concurrent rendering
  - **Why:** Latest stable React with performance improvements

- **TypeScript 5**
  - Full static type checking
  - Strict mode enabled
  - `tsconfig.json` with strict compiler options
  - Intellisense & autocomplete
  - **Why:** Catches errors at compile time, improves code maintainability

### **Styling & UI**
- **Tailwind CSS 4** + PostCSS
  - Utility-first CSS framework
  - Responsive design
  - Custom theme configuration
  - Dark mode support (configured)
  - **Why:** Rapid UI development with consistent design

- **React Icons 5.5.0**
  - Icon library (Feather, FontAwesome, etc.)
  - Tree-shakeable imports
  - **Why:** Lightweight, no external icon assets

- **React Markdown 10.1.0**
  - Markdown rendering in React
  - Custom component support
  - Plugin system
  - **Why:** Display AI-generated trial plans as formatted content

### **Visualization**
- **Mermaid 11.11.0**
  - Diagramming and charting library
  - Flowcharts, timelines, entity diagrams
  - Text-based definitions
  - **Why:** AI generates trial flowcharts automatically

### **State & Data**
- **Zod 3.23.8**
  - Schema validation library
  - TypeScript-first
  - Runtime type checking
  - **Why:** Validate AI-generated content structure

### **HTTP Client**
- **Fetch API** (built-in browser API)
  - No external HTTP client needed
  - Promise-based
  - Integrated with Next.js
  - **Why:** Native browser API, no dependencies

---

## 2️⃣ Backend & Runtime

### **Runtime Environment**
- **Node.js 18+** (via Vercel/Render)
  - JavaScript runtime for server-side code
  - Non-blocking I/O
  - Large npm ecosystem
  - **Why:** JavaScript both frontend and backend (full-stack)

- **Next.js 15 API Routes**
  - Serverless functions on `/app/api/`
  - Auto-scaling
  - No server management
  - **Why:** Reduces DevOps overhead

### **Authentication & Security**
- **Jose 4.15.5**
  - JWT (JSON Web Token) library
  - Sign & verify tokens
  - Supports RS256, HS256 algorithms
  - **Why:** Secure, stateless authentication

- **bcryptjs 2.4.3**
  - Password hashing
  - Salted hashing (10 rounds default)
  - Compare hashed passwords
  - **Why:** Industry standard for password security

### **Logging & Monitoring**
- **Pino 9.5.0**
  - Structured JSON logging
  - Fast async logging
  - `pino-pretty` for readable dev logs
  - **Why:** Zero-overhead logging, integrates with observability tools

- **Prom-client 15.1.3**
  - Prometheus metrics client
  - Tracks HTTP requests, latency, errors
  - Counter, gauge, histogram types
  - **Why:** Integrates with observability stack (Prometheus/Grafana)

### **Observability & Instrumentation**
- **OpenTelemetry 1.15.0**
  - Distributed tracing
  - Metrics collection
  - Context propagation
  - **Packages:**
    - `@opentelemetry/sdk-trace-web` - Browser tracing
    - `@opentelemetry/sdk-metrics` - Metrics
    - `@opentelemetry/exporter-trace-otlp-http` - Send traces to Tempo/Jaeger
    - `@opentelemetry/exporter-metrics-otlp-http` - Send metrics to Prometheus
    - `@opentelemetry/instrumentation-fetch` - Auto-trace HTTP calls
    - `@opentelemetry/instrumentation-xml-http-request` - Auto-trace XHR
  - **Why:** Production observability, correlate logs/traces/metrics

- **Prisma Instrumentation 5.6.0**
  - Auto-instrument database queries
  - Track query latency, errors
  - **Why:** Observe database performance

---

## 3️⃣ Database & ORM

### **Database**
- **PostgreSQL 14+** (Managed)
  - Relational database
  - ACID compliance
  - Hosted on Render.com, AWS RDS, or Google Cloud SQL
  - Supports JSON fields
  - Full-text search
  - **Why:** Industry standard, mature, powerful

### **ORM**
- **Prisma 5.6.0**
  - Type-safe database access
  - Schema-driven (`.prisma` files)
  - Auto-migrations
  - Client generation (`prisma generate`)
  - Visual editor (`prisma studio`)
  - **Why:** Eliminates SQL injection, auto-types queries, DX excellence

### **Database Schema**
14+ tables including:
- `User` (email, password hash)
- `Project` (trial plan metadata)
- `ChatHistory` (conversation threads)
- `Message` (chat messages)
- `TabContent` (structured content)
- `DashboardWidget` (KPIs, diagrams, tables)
- `AiResponse` (LLM response history)
- `AiResponseCache` (deduplication)
- `SavedDiagram` (Mermaid diagrams)
- `DashboardReview` (widget reviews)
- `Feedback` (user ratings & comments)

**Relationships:**
```
User (1) ──────────(M) Project
Project (1) ──────(M) ChatHistory
ChatHistory (1) ──(M) Message
Project (1) ──────(M) DashboardWidget
Project (1) ──────(M) Feedback
```

---

## 4️⃣ Artificial Intelligence

### **LLM Provider**
- **Google Generative AI (Gemini 2.5-pro)**
  - Latest generative AI model
  - Multimodal (text, images)
  - 1M token context window
  - Streaming support
  - Pricing: $0.075/1M input tokens, $0.30/1M output tokens
  - **Why:** State-of-the-art, affordable, API-first

### **AI Integration**
- **@google/generative-ai 0.21.0**
  - Official Google SDK
  - Async/await support
  - Streaming responses
  - Error handling built-in
  - **Why:** Official library, well-maintained

### **AI Features**
- **Prompt Engineering**
  - System instructions for trial-specific context
  - Few-shot examples for consistent output
  - Persona-based prompts (Coordinator, Manager, Researcher)

- **Response Processing**
  - Parse markdown output
  - Extract structured data (KPIs, milestones, diagrams)
  - Validate against Zod schemas
  - Cache responses to reduce API calls

- **Retry Logic**
  - 3 automatic retries with exponential backoff
  - Handles rate limits (429), timeouts (503), connection errors
  - Exponential backoff: 1s → 2s → 4s
  - **Why:** Resilient to transient failures

- **Caching**
  - Hash-based deduplication in `AiResponseCache` table
  - Reduces API costs
  - Faster response times
  - **Why:** Same prompt = same response (cost savings)

---

## 5️⃣ Testing & Quality Assurance

### **Test Framework**
- **Jest 30.2.0**
  - Unit testing framework
  - Snapshot testing
  - Coverage reporting
  - React Testing Library integration
  - **Why:** Industry-standard for JavaScript/TypeScript projects

- **React Testing Library 16.3.0**
  - Component testing utilities
  - DOM queries (getByRole, getByText, etc.)
  - User event simulation
  - **Why:** Tests user behavior, not implementation

- **@testing-library/jest-dom 6.9.1**
  - Custom Jest matchers (toBeInTheDocument, etc.)
  - **Why:** Cleaner test assertions

- **@testing-library/user-event 14.6.1**
  - User interaction simulation
  - More realistic than fireEvent
  - **Why:** Tests match real user behavior

### **Test Coverage**
- Coverage threshold: **70%**
- Test files: `clin-ops/__tests__/`
  - `integration.test.ts` - End-to-end workflows
  - `dashboard-parser.test.ts` - Widget parsing logic
  - `structured-output-schema.test.ts` - Data validation
  - `mcp-data-restructurer.test.ts` - Data transformation

### **Linting & Code Quality**
- **ESLint 9**
  - JavaScript/TypeScript linting
  - `eslint-config-next` for Next.js best practices
  - Catches common errors, style issues
  - **Why:** Maintain consistent code quality

- **TypeScript Compiler** (strict mode)
  - Static type checking at compile time
  - No runtime type errors (caught earlier)
  - **Why:** Prevent entire classes of bugs

---

## 6️⃣ Development Tools

### **Package Manager**
- **npm** (v9+)
  - Dependency management
  - Script automation
  - **Why:** Standard JavaScript package manager

### **Build & Development**
- **Turbopack** (Next.js 15 bundler)
  - Rust-based, ultra-fast bundler
  - Replaces Webpack
  - 10x faster builds
  - **Why:** Rapid development, faster CI/CD

- **PostCSS 4**
  - CSS transformation pipeline
  - Autoprefixer, minification
  - **Why:** Optimize CSS for production

### **Environment Management**
- `.env.local` - Local environment variables
- `.env.production` - Production secrets (GitHub Secrets)
- Variables:
  - `DATABASE_URL` - PostgreSQL connection string
  - `NEXTAUTH_SECRET` - JWT signing key
  - `GOOGLE_API_KEY` - Gemini API key
  - `OTEL_EXPORTER_OTLP_ENDPOINT` - Observability backend

### **Docker**
- **Dockerfile** (in `docker/` folder)
  - Multi-stage builds
  - Node.js base image
  - Optimized for production
  - **Why:** Container deployment to K8s, cloud platforms

---

## 7️⃣ Deployment & Infrastructure

### **Hosting Options**

#### **Option 1: Render (Recommended for Small/Medium)**
- **Service:** Web Service (Next.js app)
- **Database:** Render Postgres
- **Pricing:** $12-15/month starter
- **Deployment:** Git-based auto-deploy from GitHub
- **Why:** Simple, free tier available, integrated PostgreSQL

#### **Option 2: AWS (Enterprise)**
- **Compute:** EC2 or ECS (container orchestration)
- **Database:** AWS RDS for PostgreSQL
- **CDN:** CloudFront
- **Secrets:** AWS Secrets Manager
- **Why:** Enterprise-grade, highly scalable

#### **Option 3: Google Cloud (GCP)**
- **Compute:** Cloud Run (serverless)
- **Database:** Cloud SQL for PostgreSQL
- **CDN:** Cloud CDN
- **AI:** Native Gemini API integration
- **Why:** Good Google Gemini integration

#### **Option 4: Kubernetes (High-scale)**
- **Orchestration:** Self-managed K8s cluster
- **Ingress:** Nginx or Traefik
- **Database:** Managed PostgreSQL
- **Monitoring:** Prometheus + Grafana + Loki + Tempo
- **Why:** Maximum flexibility, auto-scaling, cost optimization at scale

### **Deployment Flow**
```
Developer Push → GitHub
                  ↓
            GitHub Actions (CI/CD)
            - Lint, Test, Build
                  ↓
            Docker Image → Registry
                  ↓
            Deploy to Staging
                  ↓
            Smoke Tests
                  ↓
            Deploy to Production (Blue/Green)
```

### **Environment Scaling**
```
Development          →  Staging          →  Production
Local machine           Render/GCP            K8s + Managed DB
Single instance         1-2 instances        3+ replicas
SQLite/Local DB         Managed Postgres     Postgres Primary + Replicas
```

---

## 8️⃣ Observability & Monitoring

### **Logging Stack**
- **Pino** (application logs)
- **Loki** (log aggregation & visualization)
- **Grafana** (dashboard)

### **Metrics Stack**
- **Prom-client** (metrics collection)
- **Prometheus** (scrapes metrics)
- **Grafana** (visualization)

### **Tracing Stack**
- **OpenTelemetry** (trace collection)
- **Tempo** (trace storage)
- **Grafana** (visualization)

### **Example Metrics Collected**
```
http_requests_total{method="GET", path="/api/dashboard", status="200"}
http_request_duration_seconds{method="POST", path="/api/ai/generate", le="1"}
db_query_duration_seconds{operation="select", table="projects"}
ai_api_calls_total{model="gemini-2.5-pro", status="success"}
ai_api_calls_total{model="gemini-2.5-pro", status="rate_limited"}
```

---

## 9️⃣ Security & Compliance

### **Authentication**
- JWT tokens (44 hours expiry)
- Bcrypt password hashing (10 salt rounds)
- Secure httpOnly cookies (optional)

### **Authorization**
- Role-based access control (RBAC)
- User owns projects
- Middleware checks auth on all protected routes

### **Data Protection**
- HTTPS/TLS in transit
- PostgreSQL encryption at rest (managed DB)
- Environment secrets management
- **No:** Sensitive data in logs, Git, or error messages

### **API Security**
- CORS configuration per environment
- Rate limiting (future: Redis + Bull)
- Input validation (Zod)
- SQL injection prevention (Prisma ORM)

---

## 🔟 Development Workflow

### **Local Setup**
```bash
# Clone repo
git clone https://github.com/yashashav-dk/CMPE_272_Team_1_Project_ClinOps.git
cd clin-ops

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit DATABASE_URL, GOOGLE_API_KEY, NEXTAUTH_SECRET

# Run migrations
npx prisma migrate dev

# Start dev server
npm run dev

# Open browser
open http://localhost:3000
```

### **Development Scripts**
```bash
npm run dev          # Start dev server with Turbopack (hot reload)
npm run build        # Production build
npm start            # Start production server
npm run lint         # Run ESLint
npm test             # Run Jest tests
npm test:coverage    # Coverage report
npm run prisma:studio  # Visual database browser
```

### **CI/CD Pipeline**
```
Pre-commit hooks
    ↓
Push to GitHub
    ↓
GitHub Actions
    ├─ npm run lint
    ├─ npm test
    ├─ npm run build
    └─ Build Docker image
    ↓
Staging deployment
    ├─ Smoke tests
    └─ Manual approval
    ↓
Production deployment (Blue/Green)
```

---

## 📊 Performance Targets

| Metric | Target | Tool |
|--------|--------|------|
| **Initial Page Load** | < 2s | Lighthouse, Web Vitals |
| **API Response Time** | < 500ms (p95) | OpenTelemetry + Grafana |
| **Database Query Time** | < 100ms (p95) | Prisma instrumentation |
| **AI Generation Time** | < 10s (avg) | Google Gemini API |
| **Code Coverage** | > 70% | Jest |
| **Lighthouse Score** | > 90 | Next.js built-in |

---

## 🔐 Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/clinops

# Authentication
NEXTAUTH_SECRET=<random-32-char-string>

# AI
GOOGLE_API_KEY=<your-google-api-key>

# Observability (optional)
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
OTEL_EXPORTER_OTLP_HEADERS=<optional-auth-header>

# App
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://clinops.example.com
```

---

## 📈 Version Matrix

| Technology | Version | Release Date | LTS |
|------------|---------|--------------|-----|
| **Next.js** | 15.5.2 | Oct 2025 | Yes |
| **React** | 19.1.0 | Dec 2024 | Yes |
| **TypeScript** | 5 | Nov 2023 | Ongoing |
| **Prisma** | 5.20.0 | Nov 2024 | Yes |
| **Zod** | 3.23.8 | Oct 2024 | Yes |
| **Tailwind CSS** | 4 | Dec 2024 | Yes |
| **Jest** | 30.2.0 | Oct 2024 | Yes |
| **Node.js** | 18+ | Apr 2022 | Yes (until Apr 2025) |
| **PostgreSQL** | 14+ | Oct 2021 | Yes (until Oct 2026) |
| **Google Gemini** | 2.5-pro | Nov 2024 | Ongoing |

---

## 🚀 Key Advantages of This Stack

| Aspect | Advantage |
|--------|-----------|
| **Type Safety** | TypeScript catches errors before runtime |
| **Developer Experience** | Hot reload, Prisma Studio, NextAuth simplify development |
| **Performance** | Turbopack, ISR, edge caching via CDN |
| **Scalability** | Stateless API design, database connection pooling, horizontal scaling |
| **Cost** | Free tier options (Render, Vercel), pay-as-you-go pricing for AI/hosting |
| **Security** | JWT auth, bcrypt passwords, Prisma ORM prevents SQL injection |
| **Observability** | OpenTelemetry integration with Prometheus/Grafana/Loki/Tempo |
| **AI Integration** | Google Gemini API with retry logic, caching, structured output validation |
| **Testing** | Jest + React Testing Library with 70% coverage threshold |
| **Production Ready** | Docker containerization, CI/CD automation, health checks |

---

## 🎯 Future Tech Roadmap

**Phase 2 (Q1 2026):**
- WebSocket support (real-time chat)
- Redis caching layer
- Background job queue (Bull)
- Advanced observability (custom metrics)

**Phase 3 (Q2 2026):**
- Mobile app (React Native / Flutter)
- GraphQL API (Nexus + Apollo)
- Advanced auth (OAuth2, SAML)
- Multi-tenant support

**Phase 4 (Q3 2026):**
- Machine learning pipeline (model training, fine-tuning)
- PDF export feature
- Enterprise SSO (Azure AD, Okta)
- Advanced analytics & reporting

---

## 📚 Documentation & Resources

- **ClinOps Architecture**: `ARCHITECTURE.md` (system design)
- **Architecture Diagrams**: `ARCHITECTURE_DIAGRAMS.md` (visual flows)
- **Technical Report**: `ClinOps_Technical_Report.md` (executive summary)
- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs/
- **React Docs**: https://react.dev/
- **Google Gemini API**: https://ai.google.dev/
- **OpenTelemetry**: https://opentelemetry.io/docs/

---

## 📞 Tech Stack Contact

For technical questions about:
- **Frontend/React**: UI components, state management
- **Backend/Next.js**: API routes, authentication
- **Database/Prisma**: Schema, migrations, queries
- **AI Integration**: Gemini API, prompt engineering
- **Deployment**: Render, Docker, Kubernetes
- **Observability**: Logging, metrics, tracing

Contact the development team or open an issue in the GitHub repository.

---

**Last Updated:** November 2025  
**Repository:** https://github.com/yashashav-dk/CMPE_272_Team_1_Project_ClinOps
