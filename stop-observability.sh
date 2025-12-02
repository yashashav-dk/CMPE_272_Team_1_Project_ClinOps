#!/bin/bash
docker-compose stop postgres prometheus grafana loki tempo promtail alertmanager
echo "Observability stack and Database stopped."
