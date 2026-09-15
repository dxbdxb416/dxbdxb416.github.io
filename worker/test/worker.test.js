import assert from 'node:assert/strict';
import test from 'node:test';

import { handleRequest } from '../src/index.js';

const ENV = {
  ALLOWED_ORIGINS: 'https://d3dot.space,https://www.d3dot.space'
};

class MemoryCache {
  constructor() {
    this.responses = new Map();
  }

  async match(request) {
    const response = this.responses.get(request.url);
    return response ? response.clone() : undefined;
  }

  async put(request, response) {
    this.responses.set(request.url, response.clone());
  }
}

function makeRequest(fields = {}, options = {}) {
  const data = new FormData();
  const values = {
    name: 'Test Lead',
    email: 'test@example.com',
    company: 'D3 Test Company',
    phone: '+971500000000',
    service: 'ERP Implementation',
    message: 'Testing website integration',
    subject: 'New website enquiry — D3',
    from_name: 'D3 Website',
    ...fields
  };

  for (const [key, value] of Object.entries(values)) {
    data.set(key, value);
  }

  return new Request(options.url || 'https://api.d3dot.space/lead', {
    method: options.method || 'POST',
    headers: {
      Origin: options.origin || 'https://d3dot.space',
      ...(options.idempotencyKey ? { 'Idempotency-Key': options.idempotencyKey } : {})
    },
    body: data
  });
}

function makeDeps(overrides = {}) {
  return {
    sendToWeb3Forms: async () => ({ ok: true, status: 200 }),
    syncToTwenty: async () => ({ opportunityId: 'opportunity-1' }),
    cache: new MemoryCache(),
    logger: { error() {}, warn() {}, info() {} },
    requestId: () => 'request-123',
    ...overrides
  };
}

test('returns CORS preflight only for an allowed website origin', async () => {
  const request = new Request('https://api.d3dot.space/lead', {
    method: 'OPTIONS',
    headers: { Origin: 'https://www.d3dot.space' }
  });

  const response = await handleRequest(request, ENV, {}, makeDeps());

  assert.equal(response.status, 204);
  assert.equal(response.headers.get('access-control-allow-origin'), 'https://www.d3dot.space');
  assert.equal(response.headers.get('access-control-allow-methods'), 'POST, OPTIONS');
});

test('rejects a disallowed origin before calling either destination', async () => {
  let calls = 0;
  const deps = makeDeps({
    sendToWeb3Forms: async () => { calls += 1; },
    syncToTwenty: async () => { calls += 1; }
  });

  const response = await handleRequest(
    makeRequest({}, { origin: 'https://attacker.example' }),
    ENV,
    {},
    deps
  );

  assert.equal(response.status, 403);
  assert.equal(calls, 0);
  assert.equal(response.headers.get('access-control-allow-origin'), null);
  assert.deepEqual(await response.json(), { success: false, error: 'origin_not_allowed' });
});

test('rejects invalid lead data before delivery', async () => {
  let calls = 0;
  const deps = makeDeps({
    sendToWeb3Forms: async () => { calls += 1; },
    syncToTwenty: async () => { calls += 1; }
  });

  const response = await handleRequest(makeRequest({ email: 'not-an-email' }), ENV, {}, deps);

  assert.equal(response.status, 400);
  assert.equal(calls, 0);
  assert.deepEqual(await response.json(), {
    success: false,
    error: 'invalid_submission',
    fields: ['email']
  });
});

test('silently accepts a filled honeypot without delivering it', async () => {
  let calls = 0;
  const deps = makeDeps({
    sendToWeb3Forms: async () => { calls += 1; },
    syncToTwenty: async () => { calls += 1; }
  });

  const response = await handleRequest(makeRequest({ botcheck: 'filled' }), ENV, {}, deps);

  assert.equal(response.status, 200);
  assert.equal(calls, 0);
  assert.deepEqual(await response.json(), {
    success: true,
    web3forms: false,
    twenty: false,
    requestId: 'request-123'
  });
});

test('rejects an actual request body larger than 32 KiB', async () => {
  const response = await handleRequest(
    makeRequest({ message: 'x'.repeat(33 * 1024) }),
    ENV,
    {},
    makeDeps()
  );

  assert.equal(response.status, 413);
  assert.deepEqual(await response.json(), { success: false, error: 'request_too_large' });
});

test('returns success when Web3Forms succeeds and Twenty fails', async () => {
  const deps = makeDeps({
    syncToTwenty: async () => { throw new Error('private CRM error'); }
  });

  const response = await handleRequest(
    makeRequest({}, { idempotencyKey: 'browser-request-123' }),
    ENV,
    {},
    deps
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('access-control-allow-origin'), 'https://d3dot.space');
  assert.deepEqual(await response.json(), {
    success: true,
    web3forms: true,
    twenty: false,
    requestId: 'request-123'
  });
});

test('returns success when Twenty succeeds and Web3Forms fails', async () => {
  const deps = makeDeps({
    sendToWeb3Forms: async () => { throw new Error('private email error'); }
  });

  const response = await handleRequest(makeRequest(), ENV, {}, deps);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    success: true,
    web3forms: false,
    twenty: true,
    requestId: 'request-123'
  });
});

test('returns a sanitized gateway error when both destinations fail', async () => {
  const deps = makeDeps({
    sendToWeb3Forms: async () => { throw new Error('secret web3forms detail'); },
    syncToTwenty: async () => { throw new Error('secret twenty detail'); }
  });

  const response = await handleRequest(makeRequest(), ENV, {}, deps);

  assert.equal(response.status, 502);
  const body = await response.json();
  assert.deepEqual(body, {
    success: false,
    web3forms: false,
    twenty: false,
    requestId: 'request-123'
  });
  assert.doesNotMatch(JSON.stringify(body), /secret/i);
});

test('replays a cached successful result for the same idempotency key', async () => {
  let web3formsCalls = 0;
  let twentyCalls = 0;
  const deps = makeDeps({
    sendToWeb3Forms: async () => {
      web3formsCalls += 1;
      return { ok: true };
    },
    syncToTwenty: async () => {
      twentyCalls += 1;
      return { opportunityId: 'opportunity-1' };
    }
  });

  const first = await handleRequest(
    makeRequest({}, { idempotencyKey: 'same-browser-request' }),
    ENV,
    {},
    deps
  );
  const second = await handleRequest(
    makeRequest({}, { idempotencyKey: 'same-browser-request' }),
    ENV,
    {},
    deps
  );

  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(second.headers.get('x-idempotent-replay'), 'true');
  assert.equal(web3formsCalls, 1);
  assert.equal(twentyCalls, 1);
  assert.deepEqual(await second.json(), await first.json());
});
