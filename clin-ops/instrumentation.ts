// This file is for server-side instrumentation only
// Client-side instrumentation is handled in a separate file

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initOtel } = await import('./lib/otel/node')
    await initOtel()
  }
}

// Client-side initialization is handled in a separate file
// that's imported in the _app.tsx or a similar client component
