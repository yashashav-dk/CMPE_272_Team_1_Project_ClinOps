import pino from 'pino'

const redact = {
  paths: [
    'req.headers.authorization',
    'req.headers.cookie',
    'res.headers[\"set-cookie\"]',
    'password',
    'passwordHash',
    '*.password',
    '*.ssn',
    '*.dob',
    'token',
  ],
  remove: true,
}

let logger: pino.Logger | null = null

export function getLogger(correlationId?: string) {
  if (!logger) {
    // Disable pino-pretty in development to avoid worker thread crashes
    // Use basic console logging instead

    logger = pino({
      level: process.env.LOG_LEVEL || 'info',
      redact,
      formatters: {
        level(label: string) {
          return { level: label }
        },
      },
      messageKey: 'message',
      base: {
        service: process.env.OTEL_SERVICE_NAME || 'clinops-app',
        env: process.env.NODE_ENV,
      },
      // Disable pino-pretty to prevent worker thread crashes
      // transport: isDev ? {
      //   target: 'pino-pretty',
      //   options: { colorize: true, singleLine: true },
      // } : undefined,
    })
  }
  return correlationId ? logger.child({ correlation_id: correlationId }) : logger
}
