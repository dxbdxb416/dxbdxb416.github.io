import assert from 'node:assert/strict';
import test from 'node:test';

import { sendToWeb3Forms } from '../src/web3forms.js';

const LEAD = {
  name: 'Test Lead',
  email: 'test@example.com',
  company: 'D3 Test Company',
  phone: '+971500000000',
  service: 'ERP Implementation',
  message: 'Testing website → Worker → Web3Forms + Twenty integration',
  subject: 'New website enquiry — D3',
  from_name: 'D3 Website',
  source_url: 'https://d3dot.space/en/?utm_source=search',
  submitted_at: '2026-09-16T10:00:00.000Z',
  utm_source: 'search',
  utm_medium: '',
  utm_campaign: 'erp',
  utm_term: '',
  utm_content: '',
  botcheck: ''
};

test('injects the Worker secret and preserves the existing form fields', async () => {
  let captured;
  const fetchImpl = async (url, init) => {
    captured = { url, init };
    return Response.json({ success: true }, { status: 200 });
  };

  const result = await sendToWeb3Forms(
    { ...LEAD, access_key: 'browser-supplied-key' },
    { WEB3FORMS_ACCESS_KEY: 'worker-secret-key', UPSTREAM_TIMEOUT_MS: '2500' },
    fetchImpl
  );

  assert.deepEqual(result, { ok: true, status: 200 });
  assert.equal(captured.url, 'https://api.web3forms.com/submit');
  assert.equal(captured.init.method, 'POST');
  assert.ok(captured.init.signal instanceof AbortSignal);

  const fields = Object.fromEntries(captured.init.body.entries());
  assert.deepEqual(fields, {
    access_key: 'worker-secret-key',
    name: 'Test Lead',
    email: 'test@example.com',
    company: 'D3 Test Company',
    phone: '+971500000000',
    service: 'ERP Implementation',
    message: 'Testing website → Worker → Web3Forms + Twenty integration',
    subject: 'New website enquiry — D3',
    from_name: 'D3 Website',
    source_url: 'https://d3dot.space/en/?utm_source=search',
    submitted_at: '2026-09-16T10:00:00.000Z',
    utm_source: 'search',
    utm_campaign: 'erp'
  });
});

test('rejects a Web3Forms response that does not confirm success', async () => {
  const fetchImpl = async () => Response.json({ success: false }, { status: 200 });

  await assert.rejects(
    sendToWeb3Forms(LEAD, { WEB3FORMS_ACCESS_KEY: 'worker-secret-key' }, fetchImpl),
    (error) => error.safeCode === 'web3forms_rejected' && error.status === 200
  );
});

test('rejects missing Worker configuration before making a request', async () => {
  let called = false;
  const fetchImpl = async () => {
    called = true;
    return Response.json({ success: true });
  };

  await assert.rejects(
    sendToWeb3Forms(LEAD, {}, fetchImpl),
    (error) => error.safeCode === 'web3forms_not_configured'
  );
  assert.equal(called, false);
});
