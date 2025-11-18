# Kubernetes Deploy Notes

- Requires cert-manager installed for TLS.
- Replace `${APP_IMAGE}` with your built image, `${APP_HOST}` with your domain.
- Set `GRAFANA_ADMIN_PASSWORD`, `SLACK_WEBHOOK_URL`, email/SMTP envs.
- Configure Postgres connection in `observability/k8s/app/secret.yaml`.
