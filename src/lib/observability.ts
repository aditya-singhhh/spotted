type ErrorContext = Record<string, unknown>;

// Structured error capture for API routes. Logs a JSON line (picked up by the
// host's log drain) and, when ERROR_WEBHOOK_URL is set, forwards it. For full
// Sentry, add @sentry/nextjs and call Sentry.captureException here — this is the
// single integration point the routes already funnel through.
export function captureError(scope: string, error: unknown, context: ErrorContext = {}) {
  const payload = {
    scope,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    ...context,
    at: new Date().toISOString()
  };

  console.error(`[error] ${scope}`, JSON.stringify(payload));

  const sink = process.env.ERROR_WEBHOOK_URL;
  if (sink) {
    void fetch(sink, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {});
  }
}
