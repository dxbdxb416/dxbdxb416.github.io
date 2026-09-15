import { sendToWeb3Forms } from './web3forms.js';
import { syncToTwenty } from './twenty.js';

const MAX_BODY_BYTES = 32 * 1024;
const DEFAULT_ORIGINS = ['https://d3dot.space', 'https://www.d3dot.space'];
const IDEMPOTENCY_TTL_SECONDS = 300;

const FIELD_LIMITS = {
  name: 120,
  email: 254,
  company: 160,
  phone: 50,
  service: 160,
  message: 5000,
  subject: 200,
  from_name: 100,
  source_url: 2048,
  submitted_at: 64,
  utm_source: 200,
  utm_medium: 200,
  utm_campaign: 200,
  utm_term: 200,
  utm_content: 200,
  botcheck: 200
};

class RequestError extends Error {
  constructor(status, code, fields = undefined) {
    super(code);
    this.name = 'RequestError';
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

function allowedOrigins(env) {
  const configured = String(env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  return configured.length > 0 ? configured : DEFAULT_ORIGINS;
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Accept, Content-Type, Idempotency-Key',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin'
  };
}

function jsonResponse(body, status, origin, extraHeaders = {}) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...extraHeaders
  };
  if (origin) Object.assign(headers, corsHeaders(origin));
  return new Response(JSON.stringify(body), { status, headers });
}

function cleanValue(value, maxLength) {
  return String(value ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength);
}

function validateLead(lead) {
  const invalid = [];
  if (!lead.name) invalid.push('name');
  if (!lead.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) invalid.push('email');
  if (!lead.message) invalid.push('message');
  if (lead.source_url) {
    try {
      const url = new URL(lead.source_url);
      if (!['http:', 'https:'].includes(url.protocol)) invalid.push('source_url');
    } catch {
      invalid.push('source_url');
    }
  }
  return [...new Set(invalid)];
}

export async function parseLead(request) {
  const declaredLength = Number(request.headers.get('content-length') || 0);
  if (declaredLength > MAX_BODY_BYTES) {
    throw new RequestError(413, 'request_too_large');
  }

  const bytes = await request.arrayBuffer();
  if (bytes.byteLength > MAX_BODY_BYTES) {
    throw new RequestError(413, 'request_too_large');
  }

  const contentType = request.headers.get('content-type') || '';
  let raw;
  if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
    const parsedRequest = new Request(request.url, {
      method: 'POST',
      headers: { 'Content-Type': contentType },
      body: bytes
    });
    const form = await parsedRequest.formData();
    raw = Object.fromEntries(
      [...form.entries()].filter(([, value]) => typeof value === 'string')
    );
  } else if (contentType.includes('application/json')) {
    try {
      raw = JSON.parse(new TextDecoder().decode(bytes));
    } catch {
      throw new RequestError(400, 'invalid_json');
    }
  } else {
    throw new RequestError(415, 'unsupported_media_type');
  }

  const lead = {};
  for (const [field, limit] of Object.entries(FIELD_LIMITS)) {
    lead[field] = cleanValue(raw?.[field], limit);
  }
  lead.email = lead.email.toLowerCase();

  const invalidFields = validateLead(lead);
  if (invalidFields.length > 0) {
    throw new RequestError(400, 'invalid_submission', invalidFields);
  }
  return lead;
}

function safeFailure(error) {
  return {
    errorType: error?.name || 'Error',
    code: error?.safeCode || 'upstream_error',
    status: Number.isInteger(error?.status) ? error.status : undefined
  };
}

export async function deliverLead(lead, env, deps) {
  const [web3formsResult, twentyResult] = await Promise.allSettled([
    deps.sendToWeb3Forms(lead, env, deps.fetch),
    deps.syncToTwenty(lead, env, deps.fetch)
  ]);

  return {
    web3forms: web3formsResult.status === 'fulfilled' && web3formsResult.value?.ok !== false,
    twenty: twentyResult.status === 'fulfilled',
    failures: {
      web3forms: web3formsResult.status === 'rejected' ? safeFailure(web3formsResult.reason) : null,
      twenty: twentyResult.status === 'rejected' ? safeFailure(twentyResult.reason) : null
    },
    warnings: twentyResult.status === 'fulfilled' ? (twentyResult.value?.warnings || []) : []
  };
}

async function fallbackIdempotencyKey(lead) {
  const stable = [lead.email, lead.company, lead.service, lead.message].join('\n');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(stable));
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function idempotencyKey(request, lead) {
  const supplied = request.headers.get('idempotency-key') || '';
  if (/^[A-Za-z0-9._:-]{8,128}$/.test(supplied)) return supplied;
  return fallbackIdempotencyKey(lead);
}

function cacheRequest(origin, key) {
  return new Request(`https://lead-idempotency.invalid/${encodeURIComponent(origin)}/${encodeURIComponent(key)}`);
}

function configuredDeps(deps) {
  return {
    sendToWeb3Forms,
    syncToTwenty,
    fetch: globalThis.fetch,
    cache: globalThis.caches?.default,
    logger: console,
    requestId: () => crypto.randomUUID(),
    ...deps
  };
}

export async function handleRequest(request, env = {}, _ctx = {}, injectedDeps = {}) {
  const deps = configuredDeps(injectedDeps);
  const origin = request.headers.get('origin') || '';
  const isAllowed = allowedOrigins(env).includes(origin);
  const url = new URL(request.url);

  if (url.pathname !== '/lead') {
    return jsonResponse({ success: false, error: 'not_found' }, 404, isAllowed ? origin : null);
  }

  if (!isAllowed) {
    return jsonResponse({ success: false, error: 'origin_not_allowed' }, 403, null);
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ success: false, error: 'method_not_allowed' }, 405, origin, { Allow: 'POST, OPTIONS' });
  }

  let lead;
  try {
    lead = await parseLead(request);
  } catch (error) {
    if (error instanceof RequestError) {
      const body = { success: false, error: error.code };
      if (error.fields) body.fields = error.fields;
      return jsonResponse(body, error.status, origin);
    }
    deps.logger.warn?.({ event: 'lead_request_rejected', errorType: error?.name || 'Error' });
    return jsonResponse({ success: false, error: 'invalid_submission' }, 400, origin);
  }

  const requestId = deps.requestId();
  if (lead.botcheck) {
    deps.logger.info?.({ event: 'lead_honeypot_rejected', requestId });
    return jsonResponse({ success: true, web3forms: false, twenty: false, requestId }, 200, origin);
  }

  const key = await idempotencyKey(request, lead);
  const internalCacheRequest = cacheRequest(origin, key);
  const cached = await deps.cache?.match(internalCacheRequest);
  if (cached) {
    return jsonResponse(await cached.json(), cached.status, origin, { 'X-Idempotent-Replay': 'true' });
  }

  const result = await deliverLead(lead, env, deps);
  if (result.failures.web3forms) {
    deps.logger.error?.({
      event: 'lead_delivery_failed',
      destination: 'web3forms',
      requestId,
      ...result.failures.web3forms
    });
  }
  if (result.failures.twenty) {
    deps.logger.error?.({
      event: 'lead_delivery_failed',
      destination: 'twenty',
      requestId,
      ...result.failures.twenty
    });
  }
  for (const warning of result.warnings) {
    deps.logger.warn?.({
      event: 'lead_delivery_warning',
      destination: 'twenty',
      requestId,
      code: warning.code,
      ...(Number.isInteger(warning.status) ? { status: warning.status } : {})
    });
  }

  const success = result.web3forms || result.twenty;
  const body = {
    success,
    web3forms: result.web3forms,
    twenty: result.twenty,
    requestId
  };
  const status = success ? 200 : 502;

  if (success && deps.cache) {
    await deps.cache.put(
      internalCacheRequest,
      new Response(JSON.stringify(body), {
        status,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': `max-age=${IDEMPOTENCY_TTL_SECONDS}`
        }
      })
    );
  }

  return jsonResponse(body, status, origin);
}

export default {
  fetch(request, env, ctx) {
    return handleRequest(request, env, ctx);
  }
};
