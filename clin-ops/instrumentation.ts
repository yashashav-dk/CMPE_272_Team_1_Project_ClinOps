// This file is for server-side instrumentation only
// Client-side instrumentation is handled in a separate file

export async function register() {
  // This is intentionally left empty for now
  // Server-side OpenTelemetry initialization would go here
  // if we decide to implement it in the future
  return;
}

// Client-side initialization is handled in a separate file
// that's imported in the _app.tsx or a similar client component
