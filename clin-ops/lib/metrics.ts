import client from 'prom-client'

const register = new client.Registry()

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5]
})

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status']
})

const httpRequestsErrorsTotal = new client.Counter({
  name: 'http_requests_errors_total',
  help: 'Total HTTP error responses',
  labelNames: ['method', 'route', 'status']
})

const prismaQueryDuration = new client.Histogram({
  name: 'prisma_client_query_duration_seconds',
  help: 'Duration of Prisma client queries in seconds',
  labelNames: ['model', 'action'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1]
})

const prismaQueriesTotal = new client.Counter({
  name: 'prisma_client_queries_total',
  help: 'Total number of Prisma client queries',
  labelNames: ['model', 'action']
})

register.registerMetric(httpRequestDuration)
register.registerMetric(httpRequestsTotal)
register.registerMetric(httpRequestsErrorsTotal)
register.registerMetric(prismaQueryDuration)
register.registerMetric(prismaQueriesTotal)
client.collectDefaultMetrics({ register })

export function startTimer(labels: { method: string; route: string }) {
  return httpRequestDuration.startTimer(labels)
}

export async function metricsText() {
  return await register.metrics()
}

export function startPrismaTimer(labels: { model?: string; action?: string }) {
  return prismaQueryDuration.startTimer({ model: labels.model || 'unknown', action: labels.action || 'unknown' })
}

export function incPrismaQuery(labels: { model?: string; action?: string }) {
  prismaQueriesTotal.inc({ model: labels.model || 'unknown', action: labels.action || 'unknown' })
}

export { register }

export function recordHttpRequest(method: string, route: string, status: number) {
  const labels = { method, route, status: String(status) }
  httpRequestsTotal.inc(labels)
  if (status >= 400) {
    httpRequestsErrorsTotal.inc(labels)
  }
}
