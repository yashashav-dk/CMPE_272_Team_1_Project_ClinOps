#!/bin/bash
docker-compose up -d postgres prometheus grafana loki tempo promtail alertmanager
echo "Observability stack and Database started."
echo "Grafana: http://localhost:3001"
echo "Prometheus: http://localhost:9091"
echo "Tempo: http://localhost:3200"
echo "Loki: http://localhost:3100"
