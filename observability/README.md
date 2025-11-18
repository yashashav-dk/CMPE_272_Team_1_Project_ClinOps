# Observability Stack

This repository includes a production-ready observability stack for a Next.js + Prisma + PostgreSQL app.

## Local (Docker Compose)

- Prereqs: Docker Desktop
- From repo root:

```bash
docker-compose up --build
```

- App: http://localhost:3000
- Grafana: http://localhost:3001 (admin/admin)
- Prometheus: http://localhost:9090
- Tempo: http://localhost:3200
- Loki: http://localhost:3100

### Test
- Health: curl http://localhost:3000/api/health
- Metrics: curl http://localhost:3000/api/metrics
- Traces: interact with UI; traces flow to Tempo via /api/otlp/v1/traces
- Logs: app logs collected by Promtail from Docker (may require Docker Desktop settings on macOS)

### Alerting
- Configure environment variables in `observability/alertmanager.yml`:
  - `${SLACK_WEBHOOK_URL}`, `${ALERT_EMAIL_TO}`, `${ALERT_EMAIL_FROM}`, `${SMTP_HOST}`, `${SMTP_PORT}`, `${SMTP_USER}`, `${SMTP_PASS}`

## Security & HIPAA Notes
- PHI redaction in logs via Pino redact.
- No cookies or auth headers logged.
- Prefer HTTPS in production; Ingress TLS configured via cert-manager.
- Use strong admin password via `${GRAFANA_ADMIN_PASSWORD}` secret in k8s.
- Store all secrets in Kubernetes Secrets or a vault; do not commit real secrets.

## Kubernetes (Helm)
Namespaces:
- `observability` for Grafana/Prometheus/Loki/Tempo
- `clinops` for the app

Install charts (examples):

```bash
# Create namespaces
kubectl apply -f observability/k8s/namespace.yaml

# Grafana
helm repo add grafana https://grafana.github.io/helm-charts
helm upgrade --install grafana grafana/grafana \
  --namespace observability \
  -f observability/k8s/grafana/values.yaml \
  -f observability/k8s/grafana/secret-admin.yaml

# Loki
helm upgrade --install loki grafana/loki \
  --namespace observability \
  -f observability/k8s/loki/values.yaml

# Tempo
helm upgrade --install tempo grafana/tempo \
  --namespace observability \
  -f observability/k8s/tempo/values.yaml

# Promtail
helm upgrade --install promtail grafana/promtail \
  --namespace observability \
  -f observability/k8s/promtail/values.yaml

# Prometheus Operator (kube-prometheus-stack)
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm upgrade --install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace observability \
  -f observability/k8s/prometheus/values.yaml

# Provision Grafana
kubectl apply -f observability/k8s/grafana/datasource-config.yaml
kubectl apply -f observability/k8s/grafana/dashboards-app-overview.yaml
kubectl apply -f observability/k8s/grafana/dashboards-api-performance.yaml
kubectl apply -f observability/k8s/grafana/dashboards-db-overview.yaml

# App
kubectl apply -f observability/k8s/app/sa-rbac.yaml
kubectl apply -f observability/k8s/app/secret.yaml
kubectl apply -f observability/k8s/app/deployment.yaml
```

## Access
- Grafana (k8s): `kubectl -n observability port-forward svc/grafana 3001:80`
- Prometheus: `kubectl -n observability port-forward svc/kube-prometheus-stack-prometheus 9090:9090`

## On-call Runbook
- Verify app health: `/api/health`
- Verify metrics: `/api/metrics` returns text
- Query Prometheus: `up` and `http_requests_total`
- Query Loki: `{{app="clinops-app"}}`
- Trace search in Grafana: Explore -> Tempo, search by `service.name=clinops-app`

## Performance
- Metrics collection <3% overhead typically
- Tracing sampling: default (always); adjust via OTEL sampler in lib/otel/node.ts
- Avoid logging request bodies; redact sensitive headers

## Optimization Tips
- Tune Prometheus scrape intervals and retention
- Use remote storage for Tempo/Loki in production
- Reduce client-side instrumentation if heavy
