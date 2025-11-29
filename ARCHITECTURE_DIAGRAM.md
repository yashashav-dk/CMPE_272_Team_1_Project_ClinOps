# ClinOps - System Architecture Diagram

## Overview
ClinOps is an Agentic Clinical Trial Project Manager built with Next.js, featuring a comprehensive observability stack and multiple deployment options.

---

## High-Level System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Browser]
        MOBILE[Mobile Browser]
    end

    subgraph "Load Balancer / Reverse Proxy"
        NGINX[Nginx<br/>Port 80/443]
    end

    subgraph "Application Layer"
        APP[Next.js Application<br/>React 19 + TypeScript<br/>Port 3000]
        PM2[PM2 Process Manager<br/>Cluster Mode]
    end

    subgraph "API Layer"
        API_AUTH[Auth API<br/>/api/auth]
        API_PROJ[Projects API<br/>/api/projects]
        API_AI[AI API<br/>/api/ai]
        API_DASH[Dashboard API<br/>/api/dashboard]
        API_DIAG[Diagrams API<br/>/api/diagrams]
        API_HEALTH[Health Check<br/>/api/health]
        API_METRICS[Metrics<br/>/api/metrics]
        API_OTLP[OTLP Traces<br/>/api/otlp/v1/traces]
    end

    subgraph "Business Logic & ORM"
        PRISMA[Prisma ORM<br/>v5.20.0]
        AUTH[Authentication<br/>JWT + bcrypt]
        CACHE[AI Response Cache]
    end

    subgraph "Database Layer"
        POSTGRES[(PostgreSQL 16<br/>Port 5432)]
    end

    subgraph "External Services"
        GOOGLE_AI[Google Generative AI<br/>Gemini API]
    end

    subgraph "Observability Stack"
        PROM[Prometheus<br/>Metrics<br/>Port 9090]
        GRAFANA[Grafana<br/>Visualization<br/>Port 3001]
        LOKI[Loki<br/>Logs<br/>Port 3100]
        TEMPO[Tempo<br/>Traces<br/>Port 3200]
        PROMTAIL[Promtail<br/>Log Collector]
        ALERTMGR[AlertManager<br/>Alerts<br/>Port 9093]
    end

    WEB --> NGINX
    MOBILE --> NGINX
    NGINX --> APP
    APP --> PM2
    PM2 --> API_AUTH
    PM2 --> API_PROJ
    PM2 --> API_AI
    PM2 --> API_DASH
    PM2 --> API_DIAG
    PM2 --> API_HEALTH
    PM2 --> API_METRICS
    PM2 --> API_OTLP

    API_AUTH --> AUTH
    API_PROJ --> PRISMA
    API_AI --> CACHE
    API_AI --> GOOGLE_AI
    API_DASH --> PRISMA
    API_DIAG --> PRISMA
    AUTH --> PRISMA
    CACHE --> PRISMA
    PRISMA --> POSTGRES

    API_METRICS --> PROM
    API_OTLP --> TEMPO
    PROMTAIL --> LOKI
    PROM --> ALERTMGR
    PROM --> GRAFANA
    LOKI --> GRAFANA
    TEMPO --> GRAFANA

    style APP fill:#4CAF50
    style POSTGRES fill:#336791
    style GOOGLE_AI fill:#4285F4
    style GRAFANA fill:#F46800
    style PROM fill:#E6522C
```

---

## Detailed Component Architecture

```mermaid
graph LR
    subgraph "Frontend Components"
        UI[User Interface<br/>React Components]
        SIDEBAR[Sidebar Navigation]
        FEEDBACK[Feedback Widget]
        TELEMETRY[Telemetry Provider<br/>OpenTelemetry]
    end

    subgraph "State Management"
        CONTEXT[React Context]
        HOOKS[Custom Hooks]
    end

    subgraph "API Routes"
        AUTH_LOGIN[POST /api/auth/login]
        AUTH_SIGNUP[POST /api/auth/signup]
        AUTH_LOGOUT[POST /api/auth/logout]
        PROJ_CREATE[POST /api/projects]
        PROJ_GET[GET /api/projects/:id]
        AI_GENERATE[POST /api/ai/generate]
        DASH_WIDGETS[GET /api/dashboard/widgets]
    end

    subgraph "Business Services"
        AUTH_SVC[Auth Service]
        PROJECT_SVC[Project Service]
        AI_SVC[AI Service]
        CACHE_SVC[Cache Service]
    end

    subgraph "Data Models"
        USER[User]
        PROJECT[Project]
        CHAT[ChatHistory]
        MESSAGE[Message]
        TAB[TabContent]
        WIDGET[DashboardWidget]
        DIAGRAM[SavedDiagram]
        FEEDBACK_MODEL[Feedback]
    end

    UI --> CONTEXT
    UI --> HOOKS
    UI --> TELEMETRY
    HOOKS --> AUTH_LOGIN
    HOOKS --> PROJ_CREATE
    HOOKS --> AI_GENERATE
    AUTH_LOGIN --> AUTH_SVC
    PROJ_CREATE --> PROJECT_SVC
    AI_GENERATE --> AI_SVC
    AI_SVC --> CACHE_SVC
    AUTH_SVC --> USER
    PROJECT_SVC --> PROJECT
    PROJECT_SVC --> CHAT
    CHAT --> MESSAGE
    CHAT --> TAB
    PROJECT --> WIDGET
    PROJECT --> DIAGRAM

    style UI fill:#61DAFB
    style AUTH_SVC fill:#FF6B6B
    style AI_SVC fill:#4ECDC4
```

---

## Database Schema Architecture

```mermaid
erDiagram
    User ||--o{ Project : creates
    User ||--o{ ChatHistory : owns
    User ||--o{ SavedDiagram : saves
    User ||--o{ DashboardWidget : configures
    User ||--o{ Feedback : submits
    
    Project ||--o{ ChatHistory : contains
    Project ||--o{ AiResponse : stores
    Project ||--o{ SavedDiagram : has
    Project ||--o{ DashboardWidget : displays
    
    ChatHistory ||--o{ Message : contains
    ChatHistory ||--o{ TabContent : generates
    ChatHistory ||--o{ TabContentGeneration : tracks
    
    AiResponseCache ||--o{ AiResponse : caches
    
    User {
        uuid id PK
        string email UK
        string name
        string passwordHash
        datetime createdAt
        datetime updatedAt
    }
    
    Project {
        string id PK
        string userId FK
        string name
        string description
        datetime createdAt
        datetime updatedAt
    }
    
    ChatHistory {
        string id PK
        string projectId FK
        string userId FK
        string persona
        string currentTab
        json projectInfo
        datetime createdAt
        datetime updatedAt
    }
    
    Message {
        string id PK
        string chatId FK
        string text
        string sender
        string persona
        datetime timestamp
    }
    
    TabContent {
        string id PK
        string chatId FK
        string tabType
        string content
        datetime generatedAt
    }
    
    DashboardWidget {
        uuid id PK
        string projectId FK
        string userId FK
        string tabType
        string widgetType
        string title
        json content
        string rawContent
        int order
        datetime createdAt
        datetime updatedAt
    }
    
    SavedDiagram {
        uuid id PK
        string projectId FK
        string userId FK
        string title
        string description
        string diagramCode
        string diagramType
        json context
        datetime createdAt
        datetime updatedAt
    }
```

---

## Deployment Architectures

### 1. Docker Compose Deployment (Local/Development)

```mermaid
graph TB
    subgraph "Docker Network: observability"
        APP_CONTAINER[clinops-app<br/>Node.js + Next.js<br/>Port 3000]
        PG_CONTAINER[postgres<br/>PostgreSQL 16<br/>Port 5432]
        PROM_CONTAINER[prometheus<br/>Port 9090]
        GRAF_CONTAINER[grafana<br/>Port 3001]
        LOKI_CONTAINER[loki<br/>Port 3100]
        TEMPO_CONTAINER[tempo<br/>Port 3200/4317/4318]
        PTAIL_CONTAINER[promtail]
        ALERT_CONTAINER[alertmanager<br/>Port 9093]
    end

    subgraph "Volumes"
        VOL_PG[pgdata]
        VOL_GRAF[grafana-data]
        VOL_LOKI[loki-data]
        VOL_TEMPO[tempo-data]
        VOL_NODE[app_node_modules]
    end

    APP_CONTAINER --> PG_CONTAINER
    APP_CONTAINER --> TEMPO_CONTAINER
    PTAIL_CONTAINER --> LOKI_CONTAINER
    PROM_CONTAINER --> APP_CONTAINER
    PROM_CONTAINER --> ALERT_CONTAINER
    GRAF_CONTAINER --> PROM_CONTAINER
    GRAF_CONTAINER --> LOKI_CONTAINER
    GRAF_CONTAINER --> TEMPO_CONTAINER

    PG_CONTAINER -.-> VOL_PG
    GRAF_CONTAINER -.-> VOL_GRAF
    LOKI_CONTAINER -.-> VOL_LOKI
    TEMPO_CONTAINER -.-> VOL_TEMPO
    APP_CONTAINER -.-> VOL_NODE

    style APP_CONTAINER fill:#4CAF50
    style PG_CONTAINER fill:#336791
    style GRAF_CONTAINER fill:#F46800
```

### 2. EC2 Deployment (Production)

```mermaid
graph TB
    subgraph "Internet"
        CLIENT[Users/Clients]
    end

    subgraph "AWS Cloud"
        subgraph "EC2 Instance - Ubuntu"
            UFW[UFW Firewall<br/>Ports: 22, 80, 443]
            
            subgraph "Web Tier"
                NGINX_EC2[Nginx<br/>Reverse Proxy<br/>Port 80/443]
            end
            
            subgraph "Application Tier"
                PM2_EC2[PM2 Cluster]
                APP_EC2[Next.js App<br/>Multiple Instances<br/>Port 3000]
            end
            
            subgraph "Observability Tier - Docker"
                DOCKER[Docker Compose]
                PROM_EC2[Prometheus:9090]
                GRAF_EC2[Grafana:3001]
                LOKI_EC2[Loki:3100]
                TEMPO_EC2[Tempo:3200]
                PTAIL_EC2[Promtail]
                ALERT_EC2[AlertManager:9093]
            end
            
            subgraph "Monitoring"
                HEALTH_CHECK[Health Check Cron<br/>Every 5 min]
            end
        end
        
        subgraph "External Database"
            RDS[(Cloud PostgreSQL<br/>AWS RDS / Azure DB<br/>Google Cloud SQL)]
        end
        
        subgraph "SSL Certificate"
            CERTBOT[Let's Encrypt<br/>Certbot]
        end
    end

    CLIENT --> UFW
    UFW --> NGINX_EC2
    NGINX_EC2 --> PM2_EC2
    PM2_EC2 --> APP_EC2
    NGINX_EC2 --> GRAF_EC2
    NGINX_EC2 --> PROM_EC2
    NGINX_EC2 --> ALERT_EC2
    APP_EC2 --> RDS
    APP_EC2 --> TEMPO_EC2
    PTAIL_EC2 --> LOKI_EC2
    PROM_EC2 --> APP_EC2
    DOCKER --> PROM_EC2
    DOCKER --> GRAF_EC2
    DOCKER --> LOKI_EC2
    DOCKER --> TEMPO_EC2
    DOCKER --> PTAIL_EC2
    DOCKER --> ALERT_EC2
    HEALTH_CHECK --> APP_EC2
    CERTBOT --> NGINX_EC2

    style APP_EC2 fill:#4CAF50
    style RDS fill:#FF9900
    style NGINX_EC2 fill:#009639
```

### 3. Kubernetes Deployment (Enterprise)

```mermaid
graph TB
    subgraph "External Traffic"
        INTERNET[Internet Traffic]
    end

    subgraph "Kubernetes Cluster"
        subgraph "Ingress"
            INGRESS[Nginx Ingress Controller<br/>TLS: cert-manager + Let's Encrypt]
        end

        subgraph "Namespace: clinops"
            SVC_APP[Service: clinops-app<br/>Port 80 -> 3000]
            
            subgraph "Deployment: clinops-app"
                POD1[Pod 1<br/>clinops-app]
                POD2[Pod 2<br/>clinops-app]
            end
            
            SA[ServiceAccount<br/>clinops-app]
            SECRET_APP[Secret<br/>clinops-config]
        end

        subgraph "Namespace: observability"
            subgraph "Grafana"
                GRAF_SVC[Service: grafana]
                GRAF_DEPLOY[Deployment: grafana]
                GRAF_SECRET[Secret: grafana-admin]
            end
            
            subgraph "Prometheus"
                PROM_SVC[Service: prometheus]
                PROM_DEPLOY[StatefulSet: prometheus]
            end
            
            subgraph "Loki"
                LOKI_SVC[Service: loki]
                LOKI_DEPLOY[StatefulSet: loki]
            end
            
            subgraph "Tempo"
                TEMPO_SVC[Service: tempo]
                TEMPO_DEPLOY[StatefulSet: tempo]
            end
            
            subgraph "Promtail"
                PROMTAIL_DS[DaemonSet: promtail]
            end
            
            subgraph "AlertManager"
                ALERT_SVC[Service: alertmanager]
                ALERT_DEPLOY[Deployment: alertmanager]
            end
        end

        subgraph "Storage"
            PVC_PROM[PVC: prometheus-data]
            PVC_GRAF[PVC: grafana-data]
            PVC_LOKI[PVC: loki-data]
            PVC_TEMPO[PVC: tempo-data]
        end
    end

    subgraph "External Services"
        EXT_DB[(External PostgreSQL<br/>Cloud Database)]
        EXT_AI[Google Generative AI]
    end

    INTERNET --> INGRESS
    INGRESS --> SVC_APP
    SVC_APP --> POD1
    SVC_APP --> POD2
    POD1 --> EXT_DB
    POD2 --> EXT_DB
    POD1 --> EXT_AI
    POD2 --> EXT_AI
    POD1 --> SECRET_APP
    POD2 --> SECRET_APP
    POD1 --> TEMPO_SVC
    POD2 --> TEMPO_SVC

    PROM_DEPLOY --> POD1
    PROM_DEPLOY --> POD2
    PROMTAIL_DS --> LOKI_SVC
    GRAF_DEPLOY --> PROM_SVC
    GRAF_DEPLOY --> LOKI_SVC
    GRAF_DEPLOY --> TEMPO_SVC
    PROM_DEPLOY --> ALERT_SVC

    PROM_DEPLOY -.-> PVC_PROM
    GRAF_DEPLOY -.-> PVC_GRAF
    LOKI_DEPLOY -.-> PVC_LOKI
    TEMPO_DEPLOY -.-> PVC_TEMPO

    style POD1 fill:#4CAF50
    style POD2 fill:#4CAF50
    style EXT_DB fill:#336791
    style EXT_AI fill:#4285F4
```

---

## Observability & Telemetry Flow

```mermaid
graph LR
    subgraph "Application"
        APP_CODE[Application Code]
        OTEL_SDK[OpenTelemetry SDK]
        METRICS_EP[/api/metrics]
        TRACES_EP[/api/otlp/v1/traces]
    end

    subgraph "Collection"
        PROM_SCRAPE[Prometheus<br/>Scraper]
        PROMTAIL_COL[Promtail<br/>Log Collector]
        TEMPO_COL[Tempo<br/>Trace Receiver]
    end

    subgraph "Storage"
        PROM_TSDB[(Prometheus<br/>TSDB)]
        LOKI_STORE[(Loki<br/>Log Storage)]
        TEMPO_STORE[(Tempo<br/>Trace Storage)]
    end

    subgraph "Visualization"
        GRAFANA_DASH[Grafana Dashboards]
    end

    subgraph "Alerting"
        ALERT_RULES[Alert Rules]
        ALERTMANAGER[AlertManager]
        NOTIFICATIONS[Slack / Email]
    end

    APP_CODE --> OTEL_SDK
    OTEL_SDK --> METRICS_EP
    OTEL_SDK --> TRACES_EP
    APP_CODE --> PROMTAIL_COL

    METRICS_EP --> PROM_SCRAPE
    TRACES_EP --> TEMPO_COL
    
    PROM_SCRAPE --> PROM_TSDB
    PROMTAIL_COL --> LOKI_STORE
    TEMPO_COL --> TEMPO_STORE

    PROM_TSDB --> GRAFANA_DASH
    LOKI_STORE --> GRAFANA_DASH
    TEMPO_STORE --> GRAFANA_DASH

    PROM_TSDB --> ALERT_RULES
    ALERT_RULES --> ALERTMANAGER
    ALERTMANAGER --> NOTIFICATIONS

    style OTEL_SDK fill:#425CC7
    style GRAFANA_DASH fill:#F46800
    style ALERTMANAGER fill:#E6522C
```

---

## Security Architecture

```mermaid
graph TB
    subgraph "Security Layers"
        subgraph "Network Security"
            FW[Firewall / UFW<br/>Port Restrictions]
            TLS[SSL/TLS<br/>Let's Encrypt]
        end

        subgraph "Authentication"
            JWT_AUTH[JWT Tokens<br/>jose library]
            BCRYPT[Password Hashing<br/>bcrypt]
            SESSION[Session Management]
        end

        subgraph "Data Security"
            PHI_REDACT[PHI Redaction<br/>Pino Logger]
            ENV_VARS[Environment Variables<br/>.env secrets]
            DB_ENCRYPT[Database Encryption<br/>PostgreSQL]
        end

        subgraph "API Security"
            RATE_LIMIT[Rate Limiting]
            INPUT_VAL[Input Validation<br/>Zod]
            CORS[CORS Policy]
            HEADERS[Security Headers<br/>X-Frame-Options<br/>X-Content-Type-Options]
        end

        subgraph "Observability Security"
            AUTH_DASH[Grafana Auth<br/>admin/password]
            NO_LOG_CREDS[No Credential Logging]
        end
    end

    CLIENT[Client Request] --> FW
    FW --> TLS
    TLS --> RATE_LIMIT
    RATE_LIMIT --> CORS
    CORS --> HEADERS
    HEADERS --> INPUT_VAL
    INPUT_VAL --> JWT_AUTH
    JWT_AUTH --> SESSION
    SESSION --> PHI_REDACT
    PHI_REDACT --> DB_ENCRYPT

    style JWT_AUTH fill:#FF6B6B
    style PHI_REDACT fill:#FFD93D
    style TLS fill:#6BCF7F
```

---

## Technology Stack Summary

### Frontend
- **Framework**: Next.js 15.5.2 (React 19.1.0)
- **Language**: TypeScript 5
- **Styling**: TailwindCSS 4
- **UI Components**: Custom React components
- **Icons**: React Icons 5.5.0
- **Charting**: Recharts 3.4.1
- **Markdown**: React Markdown 10.1.0
- **Diagrams**: Mermaid 11.11.0
- **Table**: TanStack React Table 8.21.3

### Backend
- **Runtime**: Node.js 20
- **Framework**: Next.js App Router (API Routes)
- **ORM**: Prisma 5.20.0
- **Database**: PostgreSQL 16
- **Authentication**: JWT (jose 4.15.5) + bcrypt 2.4.3
- **Validation**: Zod 3.23.8
- **Logging**: Pino 9.5.0

### AI & Integration
- **AI Provider**: Google Generative AI (Gemini)
- **API Version**: @google/generative-ai 0.21.0

### Observability
- **Metrics**: Prometheus 2.53.2 + prom-client 15.1.3
- **Visualization**: Grafana 11.4.0
- **Logs**: Loki 2.9.6 + Promtail 2.9.6
- **Traces**: Tempo 2.5.0
- **Instrumentation**: OpenTelemetry 1.15.0
- **Alerting**: AlertManager 0.27.0

### DevOps & Deployment
- **Containerization**: Docker + Docker Compose
- **Orchestration**: Kubernetes (optional)
- **Process Manager**: PM2
- **Web Server**: Nginx
- **SSL**: Let's Encrypt (Certbot)
- **Firewall**: UFW
- **CI/CD**: Manual deployment scripts

### Testing
- **Framework**: Jest 30.2.0
- **React Testing**: @testing-library/react 16.3.0
- **Environment**: jsdom

---

## API Endpoints Summary

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Token verification

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### AI Operations
- `POST /api/ai/generate` - Generate AI content
- `POST /api/ai/chat` - Chat with AI
- `POST /api/ai/analyze` - Analyze project data

### Dashboard
- `GET /api/dashboard/widgets` - Get dashboard widgets
- `POST /api/dashboard/widgets` - Create widget
- `PUT /api/dashboard/widgets/:id` - Update widget
- `DELETE /api/dashboard/widgets/:id` - Delete widget

### Diagrams
- `GET /api/diagrams` - List saved diagrams
- `POST /api/diagrams` - Save diagram

### Monitoring
- `GET /api/health` - Health check endpoint
- `GET /api/metrics` - Prometheus metrics
- `POST /api/otlp/v1/traces` - OpenTelemetry traces

### Feedback
- `POST /api/feedback` - Submit feedback

---

## Deployment Configuration Files

### Docker Compose
- `docker-compose.yml` - Main compose file for development
- `docker-compose.production.yml` - Production compose file

### Kubernetes
- `observability/k8s/namespace.yaml` - Namespace definitions
- `observability/k8s/app/deployment.yaml` - App deployment
- `observability/k8s/app/sa-rbac.yaml` - Service account & RBAC
- `observability/k8s/app/secret.yaml` - Application secrets
- `observability/k8s/grafana/values.yaml` - Grafana Helm values
- `observability/k8s/prometheus/values.yaml` - Prometheus Helm values
- `observability/k8s/loki/values.yaml` - Loki Helm values
- `observability/k8s/tempo/values.yaml` - Tempo Helm values

### EC2 Deployment
- `deploy.sh` - Full EC2 deployment automation script
- `redeploy.sh` - Redeployment script
- `backup.sh` - Backup script
- `fix-nginx.sh` - Nginx troubleshooting script

### Observability Config
- `observability/prometheus.yml` - Prometheus scrape configs
- `observability/loki-config.yml` - Loki configuration
- `observability/tempo-config.yml` - Tempo configuration
- `observability/promtail-config-clean.yml` - Promtail configuration
- `observability/alertmanager.yml` - Alert routing rules

---

## Environment Variables

### Application
```
DATABASE_URL=postgresql://user:password@host:5432/clinops
NODE_ENV=production
PORT=3000
JWT_SECRET=<generated-secret>
GOOGLE_GENERATIVE_AI_API_KEY=<your-api-key>
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### OpenTelemetry
```
OTEL_SERVICE_NAME=clinops-app
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://tempo:4318/v1/traces
```

### Grafana
```
GF_SECURITY_ADMIN_USER=admin
GF_SECURITY_ADMIN_PASSWORD=<secure-password>
GF_AUTH_ANONYMOUS_ENABLED=false
```

---

## Network Ports

| Service | Port | Protocol | Description |
|---------|------|----------|-------------|
| Next.js App | 3000 | HTTP | Main application |
| PostgreSQL | 5432 | TCP | Database |
| Grafana | 3001 | HTTP | Observability dashboard |
| Loki | 3100 | HTTP | Log aggregation |
| Tempo | 3200 | HTTP | Trace storage (query) |
| Tempo OTLP gRPC | 4317 | gRPC | Trace ingestion |
| Tempo OTLP HTTP | 4318 | HTTP | Trace ingestion |
| Prometheus | 9090 | HTTP | Metrics storage |
| AlertManager | 9093 | HTTP | Alert management |
| Nginx | 80 | HTTP | Web server |
| Nginx TLS | 443 | HTTPS | Secure web server |

---

## Data Flow Summary

1. **User Request Flow**:
   - User → Nginx → Next.js App → API Route → Business Logic → Prisma → PostgreSQL

2. **AI Generation Flow**:
   - User Request → AI API → Cache Check → Google Generative AI → Response Cache → User

3. **Metrics Flow**:
   - App Code → OpenTelemetry → /api/metrics → Prometheus → Grafana

4. **Logs Flow**:
   - App Logs → Docker stdout → Promtail → Loki → Grafana

5. **Traces Flow**:
   - App Code → OpenTelemetry SDK → /api/otlp/v1/traces → Tempo → Grafana

6. **Alert Flow**:
   - Prometheus → Alert Rules → AlertManager → Slack/Email

---

## Deployment Options Comparison

| Feature | Docker Compose | EC2 | Kubernetes |
|---------|---------------|-----|------------|
| **Complexity** | Low | Medium | High |
| **Scalability** | Limited | Manual | Auto-scaling |
| **Cost** | Minimal | Medium | High |
| **Best For** | Development | Small to medium production | Enterprise |
| **High Availability** | No | Limited | Yes |
| **Load Balancing** | No | Nginx | Ingress + Service |
| **SSL Management** | Manual | Certbot | cert-manager |
| **Monitoring** | Basic | Docker + PM2 | Full observability |
| **Deployment Time** | < 5 min | 10-15 min | 20-30 min |

---

## Key Features

### Application Features
- ✅ AI-powered project management
- ✅ Interactive dashboards
- ✅ Diagram generation (Mermaid)
- ✅ Real-time collaboration
- ✅ Chat-based interface
- ✅ Multi-persona AI support
- ✅ Widget-based dashboard
- ✅ User authentication & authorization

### Observability Features
- ✅ Full-stack tracing (OpenTelemetry)
- ✅ Metrics collection (Prometheus)
- ✅ Log aggregation (Loki)
- ✅ Distributed tracing (Tempo)
- ✅ Custom dashboards (Grafana)
- ✅ Alerting (AlertManager)
- ✅ PHI redaction in logs
- ✅ Health checks & monitoring

### Security Features
- ✅ JWT authentication
- ✅ Password hashing (bcrypt)
- ✅ SSL/TLS encryption
- ✅ HIPAA-compliant logging
- ✅ Environment-based secrets
- ✅ Firewall configuration
- ✅ Security headers
- ✅ Input validation (Zod)

---

## Maintenance & Monitoring

### Health Checks
- Application: `curl http://localhost:3000/api/health`
- Prometheus: `http://localhost:9090/-/healthy`
- Grafana: `http://localhost:3001/api/health`
- Loki: `curl http://localhost:3100/ready`

### Useful Commands

**PM2 (EC2 Deployment)**
```bash
pm2 status                    # Check status
pm2 logs clinops             # View logs
pm2 restart clinops          # Restart app
pm2 monit                    # Real-time monitoring
```

**Docker Compose**
```bash
docker compose ps            # List containers
docker compose logs -f app   # Follow app logs
docker compose restart app   # Restart app
docker compose down          # Stop all
docker compose up -d         # Start all
```

**Kubernetes**
```bash
kubectl get pods -n clinops              # List pods
kubectl logs -f deployment/clinops-app   # Follow logs
kubectl describe pod <pod-name>          # Pod details
kubectl port-forward svc/grafana 3001:80 # Access Grafana
```

---

## Conclusion

ClinOps is a production-ready, cloud-native application with:
- **Modern Tech Stack**: Next.js, React 19, TypeScript, PostgreSQL
- **Enterprise Observability**: Prometheus, Grafana, Loki, Tempo
- **Flexible Deployment**: Docker Compose, EC2, Kubernetes
- **Security First**: HIPAA-compliant, encrypted, authenticated
- **AI-Powered**: Google Generative AI integration
- **Scalable Architecture**: Microservices-ready, horizontally scalable

The architecture supports development, staging, and production environments with comprehensive monitoring, logging, and alerting capabilities.
