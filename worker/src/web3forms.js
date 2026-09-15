const WEB3FORMS_URL = 'https://api.web3forms.com/submit';
const FORWARDED_FIELDS = [
  'name',
  'email',
  'company',
  'phone',
  'service',
  'message',
  'subject',
  'from_name',
  'source_url',
  'submitted_at',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content'
];

export class Web3FormsError extends Error {
  constructor(safeCode, status) {
    super(safeCode);
    this.name = 'Web3FormsError';
    this.safeCode = safeCode;
    this.status = status;
  }
}

function timeoutMs(env) {
  const parsed = Number(env.UPSTREAM_TIMEOUT_MS || 8000);
  if (!Number.isFinite(parsed)) return 8000;
  return Math.min(20000, Math.max(1000, parsed));
}

export async function sendToWeb3Forms(lead, env, fetchImpl = fetch) {
  if (!env.WEB3FORMS_ACCESS_KEY) {
    throw new Web3FormsError('web3forms_not_configured');
  }

  const body = new FormData();
  body.set('access_key', env.WEB3FORMS_ACCESS_KEY);
  for (const field of FORWARDED_FIELDS) {
    const value = lead[field];
    if (value !== undefined && value !== null && String(value) !== '') {
      body.set(field, String(value));
    }
  }

  let response;
  try {
    response = await fetchImpl(WEB3FORMS_URL, {
      method: 'POST',
      body,
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(timeoutMs(env))
    });
  } catch (error) {
    const code = error?.name === 'TimeoutError' || error?.name === 'AbortError'
      ? 'web3forms_timeout'
      : 'web3forms_network_error';
    throw new Web3FormsError(code);
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    throw new Web3FormsError('web3forms_rejected', response.status);
  }

  return { ok: true, status: response.status };
}
