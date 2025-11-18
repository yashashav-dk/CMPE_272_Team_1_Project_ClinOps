import { NodeSDK } from '@opentelemetry/sdk-node'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'
import { Resource } from '@opentelemetry/resources'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { PrismaInstrumentation } from '@prisma/instrumentation'

let sdk: NodeSDK | null = null

export async function initOtel() {
  if (sdk) return

  const serviceName = process.env.OTEL_SERVICE_NAME || 'clinops-app'
  const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || 'http://localhost:4318/v1/traces'

  const traceExporter = new OTLPTraceExporter({ url: otlpEndpoint })

  sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
    }),
    traceExporter,
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-http': {
          requireParentforOutgoingSpans: false,
        },
      }),
      new PrismaInstrumentation(),
    ],
  })

  await sdk.start()
}

export async function shutdownOtel() {
  if (sdk) {
    await sdk.shutdown()
    sdk = null
  }
}
