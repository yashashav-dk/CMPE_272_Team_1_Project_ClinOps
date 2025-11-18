'use client'

import { useEffect } from 'react'
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { ZoneContextManager } from '@opentelemetry/context-zone'
import { registerInstrumentations } from '@opentelemetry/instrumentation'
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load'
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch'
import { Resource } from '@opentelemetry/resources'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'

export default function TelemetryProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      return
    }

    try {
      // Create a provider for activating and tracking spans
      const provider = new WebTracerProvider({
        resource: new Resource({
          [SemanticResourceAttributes.SERVICE_NAME]: 'clinops-frontend',
          [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
        }),
      })

      // Configure the OTLP exporter
      const collectorUrl = process.env.NEXT_PUBLIC_OTEL_COLLECTOR_URL || 'http://localhost:4318/v1/traces'
      const exporter = new OTLPTraceExporter({
        url: collectorUrl,
        headers: {},
      })

      // Use the BatchSpanProcessor to send spans in batches
      provider.addSpanProcessor(new BatchSpanProcessor(exporter))

      // Register the provider
      provider.register({
        contextManager: new ZoneContextManager()
      })

      // Register instrumentations
      registerInstrumentations({
        instrumentations: [
          new DocumentLoadInstrumentation(),
          new FetchInstrumentation({
            propagateTraceHeaderCorsUrls: [
              /http:\/\/localhost:.*/,
              /https:\/\/.*\.yourdomain\.com/,
            ],
            clearTimingResources: true,
          })
        ],
      })

      console.log('OpenTelemetry web instrumentation initialized')

      return () => {
        // Shutdown the provider when the component unmounts
        provider.shutdown().catch(console.error);
      };
    } catch (error) {
      console.error('Failed to initialize OpenTelemetry:', error);
    }
  }, [])

  return children as any
}
