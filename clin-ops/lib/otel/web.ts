import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';

export async function initOtel() {
  try {
    // Create a provider for activating and tracking spans
    const provider = new WebTracerProvider({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: 'clinops-frontend',
      }),
    });

    // Configure the OTLP exporter
    const collectorUrl = process.env.NEXT_PUBLIC_OTEL_COLLECTOR_URL || 'http://localhost:4318/v1/traces';
    const exporter = new OTLPTraceExporter({
      url: collectorUrl,
      headers: {},
    });

    // Use the BatchSpanProcessor to send spans in batches
    provider.addSpanProcessor(new BatchSpanProcessor(exporter));

    // Register the provider
    provider.register();

    // Register instrumentations
    registerInstrumentations({
      instrumentations: [
        getWebAutoInstrumentations({
          // Only enable the fetch and document load instrumentations
          '@opentelemetry/instrumentation-fetch': {
            propagateTraceHeaderCorsUrls: [
              /http:\/\/localhost:.*/,
              /https:\/\/.*\.yourdomain\.com/,
            ],
          },
          '@opentelemetry/instrumentation-document-load': {},
          '@opentelemetry/instrumentation-xml-http-request': {},
        }),
      ],
    });

    console.log('OpenTelemetry web instrumentation initialized');
  } catch (error) {
    console.error('Error initializing OpenTelemetry:', error);
  }
}
