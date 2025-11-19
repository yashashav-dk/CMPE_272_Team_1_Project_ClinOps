# ClinOps Architecture Diagrams

## 1. System Context Diagram

```
                           ┌─────────────────────────┐
                           │   Google Generative AI  │
                           │    (Gemini 2.5-pro)    │
                           └────────────┬────────────┘
                                        │
                                   HTTP/REST
                                        │
                        ┌───────────────▼───────────────┐
                        │   ClinOps Application        │
                        │  (Next.js Full-Stack App)    │
                        │                              │
                        │  ┌────────────────────────┐  │
                        │  │  React Frontend (SPA)  │  │
                        │  │  + Tailwind CSS        │  │
                        │  │  + Mermaid Diagrams    │  │
                        │  └────────────────────────┘  │
                        │                              │
                        │  ┌────────────────────────┐  │
                        │  │  Next.js API Routes    │  │
                        │  │  + Auth Service        │  │
                        │  │  + AI Service          │  │
                        │  │  + Dashboard Service   │  │
                        │  └────────────────────────┘  │
                        │                              │
                        │  ┌────────────────────────┐  │
                        │  │  Prisma ORM            │  │
                        │  │  + Type-safe queries   │  │
                        │  │  + Migrations          │  │
                        │  └────────────────────────┘  │
                        └───────────────┬───────────────┘
                                        │
                                   PostgreSQL
                                        │
                        ┌───────────────▼───────────────┐
                        │  Managed PostgreSQL Database  │
                        │  (Render / Cloud SQL / RDS)   │
                        │                              │
                        │  - Users                     │
                        │  - Projects                  │
                        │  - Chat History              │
                        │  - Dashboard Widgets         │
                        │  - AI Response Cache         │
                        └────────────────────────────────┘


┌─────────────────────────────────────────────────────────┐
│  End Users (Trial Coordinators, Researchers)            │
│                                                         │
│  Web Browser (Chrome, Safari, Firefox, Edge)           │
│  → HTTPS → ClinOps App → PostgreSQL                    │
│                                                         │
│  Features Accessed:                                     │
│  • Register/Login                                       │
│  • Create Projects                                      │
│  • Upload Trial Plans                                   │
│  • AI-Powered Content Generation                        │
│  • Dashboard View & Widgets                             │
│  • Submit Feedback & Reviews                            │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Component Interaction Diagram

```
                        User Browser
                             │
                             │ HTTPS
                             ▼
                    ┌─────────────────┐
                    │  React SPA      │
                    │                 │
                    │ • Auth Pages    │
                    │ • Chat UI       │
                    │ • Dashboard     │
                    │ • Sidebar       │
                    │ • Feedback      │
                    └────────┬────────┘
                             │
                    REST API │ JSON
                             │
          ┌──────────────────▼──────────────────┐
          │   Next.js API Routes Layer          │
          │                                     │
          │  ┌───────────────────────────────┐ │
          │  │ Auth Routes                   │ │
          │  │ /api/auth/{register,login}    │ │
          │  └─────────────┬─────────────────┘ │
          │                │                   │
          │  ┌─────────────▼─────────────────┐ │
          │  │ AI Routes                     │ │
          │  │ /api/ai/{generate,cache}     │ │
          │  └─────────────┬─────────────────┘ │
          │                │                   │
          │  ┌─────────────▼─────────────────┐ │
          │  │ Dashboard Routes              │ │
          │  │ /api/dashboard/{GET,DELETE}   │ │
          │  └─────────────┬─────────────────┘ │
          │                │                   │
          │  ┌─────────────▼─────────────────┐ │
          │  │ Project Routes                │ │
          │  │ /api/projects/{CRUD}          │ │
          │  └─────────────┬─────────────────┘ │
          │                │                   │
          │  ┌─────────────▼─────────────────┐ │
          │  │ Feedback Routes               │ │
          │  │ /api/feedback/{POST}          │ │
          │  └─────────────┬─────────────────┘ │
          │                │                   │
          └────────────────┼───────────────────┘
                           │
          ┌────────────────┼───────────────────┐
          │                │                   │
          ▼                ▼                   ▼
     ┌─────────────┐  ┌────────────┐  ┌──────────────┐
     │  bcrypt     │  │  Prisma    │  │  Google      │
     │ (password   │  │  ORM       │  │  Generative  │
     │  hashing)   │  │            │  │  AI          │
     └─────────────┘  │  • Type    │  └──────────────┘
                      │    safe    │
                      │  • Caching │
                      │  • Queries │
                      └─────┬──────┘
                            │
                    PostgreSQL Connection
                            │
                    ┌───────▼──────────┐
                    │  PostgreSQL DB   │
                    │                  │
                    │  Tables:         │
                    │  • users         │
                    │  • projects      │
                    │  • chat_history  │
                    │  • messages      │
                    │  • widgets       │
                    │  • feedback      │
                    └──────────────────┘
```

---

## 3. Data Model Relationship Diagram

```
                    ┌──────────────┐
                    │   User       │
                    │ (id, email)  │
                    └──────┬───────┘
                           │ 1:M
                           │ (user_id)
                           │
        ┌──────────────────▼──────────────────┐
        │         Project                     │
        │ (id, user_id, name, description)   │
        └──────┬────────────────┬─────────────┘
               │ 1:M            │ 1:M
               │                │
        ┌──────▼───────────┐   ┌──▼─────────────────┐
        │  ChatHistory     │   │  DashboardWidget   │
        │ (id, projectId)  │   │ (id, projectId,    │
        │                  │   │  widgetType)       │
        │ • Messages       │   │                    │
        │ • TabContent     │   │ • SavedDiagram     │
        │ • Feedback       │   │ • DashboardReview  │
        │                  │   └────────────────────┘
        └──────┬───────────┘
               │ 1:M
               │
        ┌──────▼────────────────┐
        │  Message              │
        │ (id, chatId, text,    │
        │  sender, timestamp)   │
        └───────────────────────┘


    ┌────────────────────────────────────────────────┐
    │ Cache Tables (for performance optimization)   │
    ├────────────────────────────────────────────────┤
    │                                                │
    │ • AiResponseCache (prompt_hash → response)    │
    │ • AiResponse (history of all AI responses)    │
    │                                                │
    │ These support:                                 │
    │ - Duplicate query detection                    │
    │ - Cost optimization                            │
    │ - Faster retrieval of similar prompts          │
    └────────────────────────────────────────────────┘
```

---

## 4. Request/Response Cycle: Chat to Dashboard

```
User Action: "Generate trial overview"
    │
    ▼
React Component (ContextAwareChat.tsx)
    │ Collects: persona, tab, user message
    │
    ├─ Validates input
    │
    ├─ Sends POST request
    │    ├─ URL: /api/ai/generate
    │    ├─ Body: { prompt, persona, tabType, projectId }
    │    └─ Auth: JWT in header
    │
    ▼
Next.js API Route: /api/ai/generate
    │
    ├─ verifyAuth(request) → userId
    │
    ├─ AIController.generateResponse(prompt)
    │    │
    │    ├─ Hash prompt (MD5 or SHA256)
    │    │
    │    ├─ Check AiResponseCache
    │    │    ├─ HIT:  Return cached response
    │    │    └─ MISS: Continue to Gemini API
    │    │
    │    ├─ Call Google Generative AI (Gemini)
    │    │    ├─ Attempt 1: Call API (timeout: 30s)
    │    │    ├─ Failure → exponential backoff
    │    │    ├─ Attempt 2: Retry with 1s delay
    │    │    ├─ Attempt 3: Retry with 2s delay
    │    │    └─ Final result (success or error)
    │    │
    │    └─ Store response
    │         ├─ AiResponseCache (latest)
    │         ├─ AiResponse (history)
    │         └─ ChatMessage (in ChatHistory)
    │
    └─ Return JSON response
        │
        ├─ { success: true, response: "..." }
        │
        └─ OR { success: false, error: "..." }
        
    ▼
React Client receives response
    │
    ├─ Update UI with AI response
    │
    ├─ Optional: Parse for dashboard widgets
    │    │
    │    ├─ Extract markdown content
    │    │
    │    ├─ Call dashboardParser()
    │    │    ├─ Extract diagrams
    │    │    ├─ Extract KPIs
    │    │    ├─ Extract tables
    │    │    └─ Extract milestones
    │    │
    │    ├─ Validate with structured schema
    │    │
    │    ├─ Transform with MCP restructurer
    │    │
    │    └─ POST /api/dashboard/:projectId
    │         └─ Save widgets to database
    │
    └─ User views:
        ├─ Chat message with AI response
        └─ Dashboard with new widgets
```

---

## 5. Authentication & Session Flow

```
┌─────────────────────────────────────────────────────┐
│                  LOGIN FLOW                         │
└─────────────────────────────────────────────────────┘

1. User enters email + password
   ↓
   POST /api/auth/login
   ├─ Find user by email
   ├─ Hash provided password with bcrypt
   ├─ Compare with stored hash
   │
   ├─ MATCH:
   │  ├─ Generate JWT token
   │  │  └─ Payload: { userId, email, iat, exp }
   │  │  └─ Signed with NEXTAUTH_SECRET
   │  │
   │  └─ Set httpOnly cookie or return token
   │     └─ Client stores in memory / localStorage
   │
   └─ NO MATCH:
      └─ Return 401 Unauthorized

2. Subsequent API calls
   ├─ Browser automatically includes Authorization header
   │  └─ Authorization: Bearer <jwt-token>
   │
   └─ Each route calls verifyAuth(request)
      ├─ Extract token from header
      ├─ Verify signature with NEXTAUTH_SECRET
      ├─ Check expiry (typically 24h)
      │
      ├─ VALID:
      │  ├─ Extract userId
      │  └─ Proceed with request
      │
      └─ INVALID:
         └─ Return 401 Unauthorized


┌─────────────────────────────────────────────────────┐
│                  LOGOUT FLOW                        │
└─────────────────────────────────────────────────────┘

1. User clicks logout
   ↓
   POST /api/auth/logout
   ├─ Clear httpOnly cookie (if used)
   └─ Or invalidate token (if token-based)

2. Client
   ├─ Clear token from memory
   ├─ Clear any session storage
   └─ Redirect to /

3. Subsequent API calls without token
   └─ Return 401 → Redirect to login page
```

---

## 6. Dashboard Widget Generation Pipeline

```
Input: Trial Plan (Markdown + optional Mermaid diagrams)

    │
    ▼
┌─────────────────────────────────────┐
│   Dashboard Parser (dashboard-parser.ts)
│   ├─ Split content into sections    │
│   ├─ Identify markdown tables       │
│   ├─ Find mermaid code blocks       │
│   ├─ Extract numeric patterns (KPIs)│
│   ├─ Identify date patterns         │
│   │   (timeline)                    │
│   └─ Extract checklists             │
│                                     │
│   Output: ParsedWidget[]            │
│   [                                 │
│     { widgetType: 'diagram', ... }, │
│     { widgetType: 'kpi', ... },     │
│     { widgetType: 'table', ... },   │
│     { widgetType: 'timeline', ... } │
│   ]                                 │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  Structured Output Schema           │
│  (structured-output-schema.ts)      │
│                                     │
│  Validate using Zod:                │
│  ├─ Check widget type               │
│  ├─ Validate content structure      │
│  ├─ Ensure required fields          │
│  └─ Type check values               │
│                                     │
│  Output: Valid ParsedWidget[]       │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  MCP Data Restructurer              │
│  (mcp-data-restructurer.ts)        │
│                                     │
│  Transform & enrich:                │
│  ├─ Add computed fields             │
│  ├─ Apply default styling           │
│  ├─ Optimize for rendering          │
│  ├─ Add metadata                    │
│  └─ Format for DB storage           │
│                                     │
│  Output: DashboardWidget[]          │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  Store in Database                  │
│                                     │
│  prisma.dashboardWidget.createMany( │
│    { projectId, widgetType,         │
│      content, title, ... }          │
│  )                                  │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  Retrieve & Display                 │
│                                     │
│  GET /api/dashboard/:projectId      │
│  → []DashboardWidget                │
│  → Pass to WidgetRenderer component │
│  → Render (KPI cards, tables,       │
│     diagrams, timelines, lists)     │
└─────────────────────────────────────┘

Output: User sees interactive dashboard with:
        • KPI metrics with progress
        • Markdown tables
        • Mermaid diagrams
        • Timeline milestones
        • Checklist items
        • Text descriptions
```

---

## 7. Error Handling & Retry Strategy

```
┌────────────────────────────────────────────────┐
│  API Request → Gemini AI (with retry logic)   │
└────────────────────────────────────────────────┘

Attempt 1: Call Gemini API
    │
    ├─ Success (200) → Return response ✓
    │
    ├─ Timeout (503 Service Unavailable)
    │  └─ Retryable error
    │     └─ Wait 1000ms, Attempt 2
    │
    ├─ Rate Limit (429 Too Many Requests)
    │  └─ Retryable error
    │     └─ Wait 1000ms, Attempt 2
    │
    ├─ Server Error (500, 502, 504)
    │  └─ Retryable error
    │     └─ Wait 1000ms, Attempt 2
    │
    ├─ Connection Error (ECONNRESET)
    │  └─ Retryable error
    │     └─ Wait 1000ms, Attempt 2
    │
    └─ Client Error (400, 401, 403)
       └─ Non-retryable
          └─ Return error immediately

Attempt 2: Retry with exponential backoff
    │
    ├─ Success → Return response ✓
    │
    └─ Failure → Wait 2000ms, Attempt 3

Attempt 3: Final retry
    │
    ├─ Success → Return response ✓
    │
    └─ Failure → Max retries exceeded
                 └─ Return error to client
                    └─ UI shows error message


Error Handling in Frontend:
    │
    ├─ Show error notification
    ├─ Log to Sentry (if configured)
    ├─ Offer retry button
    └─ Fallback to cached response (if available)
```

---

## 8. Deployment Topology

```
Development                    Staging                    Production
┌──────────────┐          ┌──────────────┐          ┌──────────────┐
│ Local Machine│          │ Render.com   │          │ GKE / EKS    │
│              │          │ (Platform)   │          │ (K8s Cluster)│
│ • Node.js    │          │              │          │              │
│ • Local DB   │          │ ┌──────────┐ │          │ ┌──────────┐ │
│ • npm dev    │          │ │ Next.js  │ │          │ │ Ingress  │ │
└──────────────┘          │ │ Container│ │          │ │ (TLS)    │ │
                          │ └──────────┘ │          │ └────┬─────┘ │
                          │              │          │      │       │
                          │ ┌──────────┐ │          │ ┌────▼─────┐ │
                          │ │ Postgres │ │          │ │ Service  │ │
                          │ │ Managed  │ │          │ │ LoadBal  │ │
                          │ └──────────┘ │          │ └────┬─────┘ │
                          │              │          │      │       │
                          │ ┌──────────┐ │          │ ┌────▼──────┐│
                          │ │ Env Vars │ │          │ │ Replicas: ││
                          │ │ (Secrets)│ │          │ │ • Pod 1   ││
                          │ └──────────┘ │          │ │ • Pod 2   ││
                          └──────────────┘          │ │ • Pod 3   ││
                                                    │ └────┬──────┘│
                                                    │      │      │
                                                    │ ┌────▼─────┐ │
                                                    │ │ Postgres │ │
                                                    │ │ Primary  │ │
                                                    │ │ + Replicas││
                                                    │ └──────────┘ │
                                                    │              │
                                                    │ ┌──────────┐ │
                                                    │ │ PgBouncer│ │
                                                    │ │ (connpool)│ │
                                                    │ └──────────┘ │
                                                    └──────────────┘
                                                           │
                                                           │ External
                                                           │ Services
                                                           ▼
                                                    Google Generative AI
                                                    Secret Manager
                                                    CloudFlare CDN (optional)
```

---

## 9. CI/CD Pipeline

```
┌─────────────────────────────────────────────────┐
│  Developer Pushes Code to GitHub                │
│  (main branch)                                  │
└──────────────────┬────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────┐
│  GitHub Actions Workflow Triggered               │
│  (.github/workflows/ci-cd.yml)                   │
└──────────────────┬───────────────────────────────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
        ▼          ▼          ▼
    ┌────────┐ ┌────────┐ ┌────────┐
    │ Lint  │ │ Tests  │ │ Build  │
    │(ESL.) │ │(Jest)  │ │(Next.js)│
    └────┬──┘ └────┬───┘ └────┬───┘
         │         │         │
         └─────────┼─────────┘
                   │
              All Pass?
              ├─ NO → Notify developer
              └─ YES
                   │
                   ▼
        ┌──────────────────────┐
        │ Build Docker Image   │
        │ docker build -t ...  │
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────────┐
        │ Push to Container        │
        │ Registry                 │
        │ (Docker Hub / ECR)       │
        └──────────┬───────────────┘
                   │
                   ▼
        ┌──────────────────────────┐
        │ Deploy to Staging        │
        │ (Render or K8s)          │
        │ Run smoke tests          │
        └──────────┬───────────────┘
                   │
              Tests Pass?
              ├─ NO → Rollback, notify
              └─ YES (manual approval)
                   │
                   ▼
        ┌──────────────────────────┐
        │ Deploy to Production     │
        │ (Blue/Green or Canary)   │
        │ Monitor metrics          │
        └──────────────────────────┘
```

---

## 10. Performance Optimization Layers

```
Browser
    │
    ├─ Static Assets Cache (Service Worker)
    │  └─ JS, CSS, images cached locally
    │
    ├─ Browser Cache-Control Headers
    │  └─ Max-age, ETag, Last-Modified
    │
    └─ Code Splitting
       └─ Load-on-demand components


    │
    ├─ CDN (CloudFlare, CloudFront)
    │  └─ Geographically distributed
    │
    └─ Compression (gzip, brotli)
       └─ Reduce payload size


Next.js Server
    │
    ├─ Server-Side Rendering (SSR)
    │  └─ Initial page load optimized
    │
    ├─ Incremental Static Regeneration (ISR)
    │  └─ Cache frequently accessed pages
    │
    ├─ API Response Caching
    │  └─ Redis or in-memory (future)
    │
    └─ Database Query Optimization
       ├─ Indexes on frequently queried columns
       ├─ Connection pooling (PgBouncer)
       └─ Query result caching


Database
    │
    ├─ Indexes
    │  └─ projects(user_id), widgets(project_id), etc.
    │
    ├─ Read Replicas
    │  └─ Distribute read load
    │
    └─ Connection Pooling
       └─ Limit concurrent connections
```

---

## Summary

This architecture provides:
- **Scalability**: Horizontal scaling via stateless Next.js instances + managed DB
- **Security**: JWT auth, bcrypt passwords, environment-based secrets
- **Maintainability**: Clear separation of concerns, TypeScript for type safety
- **Extensibility**: Modular services, future-ready for features like WebSockets, background jobs, and advanced observability
- **Reliability**: Retry logic, error handling, health checks, monitoring hooks
