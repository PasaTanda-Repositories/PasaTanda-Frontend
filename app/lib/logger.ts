/**
 * Structured logger for PasaTanda frontend.
 *
 * Every call to the AgentBE or external service should go through this logger
 * so we get a consistent, searchable trail in the browser console.
 *
 * Sensitive values (JWTs, salts, secrets) are automatically masked.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const SENSITIVE_KEYS = new Set([
  'jwt',
  'id_token',
  'access_token',
  'accessToken',
  'salt',
  'userSalt',
  'secretKey',
  'x-oauth-token',
  'authorization',
  'client_secret',
]);

const IS_DEBUG =
  typeof window !== 'undefined' && process.env.NEXT_PUBLIC_DEBUG === 'true';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Mask the middle of a string keeping the first/last 4 chars. */
function mask(value: string, visibleChars = 4): string {
  if (value.length <= visibleChars * 2) return '***';
  return `${value.slice(0, visibleChars)}…${value.slice(-visibleChars)}`;
}

/**
 * Deep-clone an object while replacing any key in SENSITIVE_KEYS with a
 * masked version so logs never leak secrets.
 */
function anonymize(data: unknown): unknown {
  if (data === null || data === undefined) return data;

  if (typeof data === 'string') return data;

  if (Array.isArray(data)) return data.map(anonymize);

  if (typeof data === 'object') {
    const clean: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase()) && typeof value === 'string') {
        clean[key] = mask(value);
      } else {
        clean[key] = anonymize(value);
      }
    }
    return clean;
  }

  return data;
}

function timestamp(): string {
  return new Date().toISOString();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

function emit(level: LogLevel, tag: string, message: string, data?: unknown) {
  if (level === 'debug' && !IS_DEBUG) return;

  const prefix = `[${timestamp()}] [${tag}]`;
  const safeData = data !== undefined ? anonymize(data) : undefined;

  const fn =
    level === 'info'
      ? console.info
      : level === 'warn'
        ? console.warn
        : level === 'error'
          ? console.error
          : console.debug;

  if (safeData !== undefined) {
    fn(prefix, message, safeData);
  } else {
    fn(prefix, message);
  }
}

/** Log an outgoing request **before** the fetch. */
export function logRequest(tag: string, action: string, payload?: unknown) {
  emit('info', tag, `→ ${action}`, payload);
}

/** Log a successful response. */
export function logResponse(tag: string, action: string, status: number, data?: unknown) {
  emit('info', tag, `← ${action} [${status}]`, data);
}

/** Log a failed response / thrown error. */
export function logError(tag: string, action: string, error: unknown, statusCode?: number) {
  const msg = error instanceof Error ? error.message : String(error);
  const code = statusCode ? ` [${statusCode}]` : '';
  emit('error', tag, `✗ ${action}${code}: ${msg}`, error);
}

/** General debug helper – only prints when NEXT_PUBLIC_DEBUG=true. */
export function logDebug(tag: string, message: string, data?: unknown) {
  emit('debug', tag, message, data);
}
