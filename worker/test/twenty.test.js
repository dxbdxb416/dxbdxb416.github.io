import assert from 'node:assert/strict';
import test from 'node:test';

import { syncToTwenty } from '../src/twenty.js';

const LEAD = {
  name: 'Test Lead',
  email: 'test@example.com',
  company: 'D3 Test Company',
  phone: '+971500000000',
  service: 'ERP Implementation',
  message: 'Testing website → Worker → Web3Forms + Twenty integration',
  source_url: 'https://d3dot.space/en/?utm_source=search',
  submitted_at: '2026-09-16T10:00:00.000Z',
  utm_source: 'search',
  utm_medium: '',
  utm_campaign: 'erp',
  utm_term: '',
  utm_content: ''
};

const OBJECTS = [
  {
    id: 'object-person',
    nameSingular: 'person',
    namePlural: 'people',
    isActive: true,
    fields: [
      { name: 'name', type: 'FULL_NAME', isActive: true, writability: 'OPEN' },
      { name: 'emails', type: 'EMAILS', isActive: true, writability: 'OPEN' },
      { name: 'phones', type: 'PHONES', isActive: true, writability: 'OPEN' },
      {
        name: 'company',
        type: 'RELATION',
        isActive: true,
        writability: 'OPEN',
        relationTargetObjectMetadataId: 'object-company',
        settings: { relationType: 'MANY_TO_ONE', joinColumnName: 'companyId' }
      }
    ]
  },
  {
    id: 'object-company',
    nameSingular: 'company',
    namePlural: 'companies',
    isActive: true,
    fields: [
      { name: 'name', type: 'TEXT', isActive: true, writability: 'OPEN' }
    ]
  },
  {
    id: 'object-opportunity',
    nameSingular: 'opportunity',
    namePlural: 'opportunities',
    isActive: true,
    fields: [
      { name: 'name', type: 'TEXT', isActive: true, writability: 'OPEN' },
      {
        name: 'stage',
        type: 'SELECT',
        isActive: true,
        writability: 'OPEN',
        options: [
          { label: 'New', value: 'NEW' },
          { label: 'Screening', value: 'SCREENING' }
        ]
      },
      {
        name: 'company',
        type: 'RELATION',
        isActive: true,
        writability: 'OPEN',
        relationTargetObjectMetadataId: 'object-company',
        settings: { relationType: 'MANY_TO_ONE', joinColumnName: 'companyId' }
      },
      {
        name: 'pointOfContact',
        type: 'RELATION',
        isActive: true,
        writability: 'OPEN',
        relationTargetObjectMetadataId: 'object-person',
        settings: { relationType: 'MANY_TO_ONE', joinColumnName: 'pointOfContactId' }
      }
    ]
  },
  {
    id: 'object-note',
    nameSingular: 'note',
    namePlural: 'notes',
    isActive: true,
    fields: [
      { name: 'title', type: 'TEXT', isActive: true, writability: 'OPEN' },
      { name: 'bodyV2', type: 'RICH_TEXT', isActive: true, writability: 'OPEN' }
    ]
  },
  {
    id: 'object-note-target',
    nameSingular: 'noteTarget',
    namePlural: 'noteTargets',
    isActive: true,
    fields: [
      {
        name: 'note',
        type: 'RELATION',
        isActive: true,
        isUIReadOnly: true,
        writability: null,
        relationTargetObjectMetadataId: null,
        settings: { relationType: 'MANY_TO_ONE', joinColumnName: 'noteId' }
      },
      {
        name: 'targetOpportunity',
        type: 'MORPH_RELATION',
        isActive: true,
        isUIReadOnly: true,
        writability: null,
        relationTargetObjectMetadataId: null,
        settings: { relationType: 'MANY_TO_ONE', joinColumnName: 'targetOpportunityId' }
      }
    ]
  }
];

function json(body, status = 200) {
  return Response.json(body, { status });
}

function requestBody(init) {
  return init?.body ? JSON.parse(init.body) : undefined;
}

function makeRouter(routes) {
  const requests = [];
  const fetchImpl = async (input, init = {}) => {
    const url = new URL(input);
    const request = { url, init, body: requestBody(init) };
    requests.push(request);
    const key = `${init.method || 'GET'} ${url.pathname}`;
    const handlers = routes[key];
    const handler = Array.isArray(handlers) ? handlers.shift() : handlers;
    if (!handler) throw new Error(`Unexpected request: ${key}`);
    return typeof handler === 'function' ? handler(request) : handler;
  };
  return { fetchImpl, requests };
}

test('reuses existing records, fills missing person data, and creates a related opportunity note', async () => {
  const router = makeRouter({
    'GET /rest/metadata/objects': json({ data: { objects: OBJECTS } }),
    'GET /rest/people': json({
      data: {
        people: [{
          id: 'person-1',
          name: { firstName: 'Test', lastName: '' },
          emails: { primaryEmail: 'test@example.com', additionalEmails: null },
          phones: { primaryPhoneNumber: '', primaryPhoneCountryCode: '', primaryPhoneCallingCode: '', additionalPhones: null },
          companyId: null
        }]
      }
    }),
    'GET /rest/companies': json({ data: { companies: [{ id: 'company-1', name: 'D3 Test Company' }] } }),
    'PATCH /rest/people/person-1': json({ data: { updatePerson: { id: 'person-1' } } }),
    'POST /rest/opportunities': json({ data: { createOpportunity: { id: 'opportunity-1' } } }),
    'POST /rest/notes': json({ data: { createNote: { id: 'note-1' } } }),
    'POST /rest/noteTargets': json({ data: { createNoteTarget: { id: 'note-target-1' } } })
  });

  const result = await syncToTwenty(
    LEAD,
    { TWENTY_BASE_URL: 'https://twenty-existing.example', TWENTY_API_KEY: 'twenty-secret' },
    router.fetchImpl
  );

  assert.deepEqual(result, {
    personId: 'person-1',
    companyId: 'company-1',
    opportunityId: 'opportunity-1',
    noteId: 'note-1'
  });

  assert.equal(router.requests[0].url.pathname, '/rest/metadata/objects');
  assert.equal(router.requests[0].init.headers.Authorization, 'Bearer twenty-secret');

  const peopleLookup = router.requests.find((request) => request.url.pathname === '/rest/people' && !request.init.method);
  assert.equal(peopleLookup.url.searchParams.get('filter'), 'emails.primaryEmail[eq]:"test@example.com"');

  const companyLookup = router.requests.find((request) => request.url.pathname === '/rest/companies');
  assert.equal(companyLookup.url.searchParams.get('filter'), 'name[ilike]:"D3 Test Company"');

  const personUpdate = router.requests.find((request) => request.url.pathname === '/rest/people/person-1');
  assert.deepEqual(personUpdate.body, {
    name: { firstName: 'Test', lastName: 'Lead' },
    phones: {
      primaryPhoneNumber: '+971500000000',
      primaryPhoneCountryCode: '',
      primaryPhoneCallingCode: '',
      additionalPhones: null
    },
    companyId: 'company-1'
  });

  const opportunity = router.requests.find((request) => request.url.pathname === '/rest/opportunities');
  assert.deepEqual(opportunity.body, {
    name: 'Website Lead — ERP Implementation',
    stage: 'NEW',
    companyId: 'company-1',
    pointOfContactId: 'person-1'
  });

  const note = router.requests.find((request) => request.url.pathname === '/rest/notes');
  assert.equal(note.body.title, 'Website enquiry — ERP Implementation');
  assert.match(note.body.bodyV2.markdown, /Source: Website/);
  assert.match(note.body.bodyV2.markdown, /Testing website → Worker/);
  assert.doesNotThrow(() => JSON.parse(note.body.bodyV2.blocknote));

  const target = router.requests.find((request) => request.url.pathname === '/rest/noteTargets');
  assert.deepEqual(target.body, { noteId: 'note-1', targetOpportunityId: 'opportunity-1' });
});

test('creates Person and Company when no matching records exist', async () => {
  const router = makeRouter({
    'GET /rest/metadata/objects': json({ data: OBJECTS }),
    'GET /rest/people': json({ data: { people: [] } }),
    'GET /rest/companies': json({ data: { companies: [] } }),
    'POST /rest/companies': json({ data: { createCompany: { id: 'company-new' } } }),
    'POST /rest/people': json({ data: { createPerson: { id: 'person-new' } } }),
    'POST /rest/opportunities': json({ data: { createOpportunity: { id: 'opportunity-new' } } }),
    'POST /rest/notes': json({ data: { createNote: { id: 'note-new' } } }),
    'POST /rest/noteTargets': json({ data: { createNoteTarget: { id: 'target-new' } } })
  });

  const result = await syncToTwenty(
    LEAD,
    { TWENTY_BASE_URL: 'https://twenty-create.example/', TWENTY_API_KEY: 'twenty-secret' },
    router.fetchImpl
  );

  assert.equal(result.personId, 'person-new');
  assert.equal(result.companyId, 'company-new');

  const companyCreate = router.requests.find((request) => request.url.pathname === '/rest/companies' && request.init.method === 'POST');
  assert.deepEqual(companyCreate.body, { name: 'D3 Test Company' });

  const personCreate = router.requests.find((request) => request.url.pathname === '/rest/people' && request.init.method === 'POST');
  assert.deepEqual(personCreate.body, {
    name: { firstName: 'Test', lastName: 'Lead' },
    emails: { primaryEmail: 'test@example.com', additionalEmails: null },
    phones: {
      primaryPhoneNumber: '+971500000000',
      primaryPhoneCountryCode: '',
      primaryPhoneCallingCode: '',
      additionalPhones: null
    },
    companyId: 'company-new'
  });
});

test('does not write records when required metadata is missing', async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    return json({ data: { objects: OBJECTS.filter((object) => object.nameSingular !== 'opportunity') } });
  };

  await assert.rejects(
    syncToTwenty(
      LEAD,
      { TWENTY_BASE_URL: 'https://twenty-missing-metadata.example', TWENTY_API_KEY: 'twenty-secret' },
      fetchImpl
    ),
    (error) => error.safeCode === 'twenty_schema_incompatible'
  );
  assert.equal(calls, 1);
});

test('keeps the Twenty delivery successful when the opportunity exists but its note fails', async () => {
  const router = makeRouter({
    'GET /rest/metadata/objects': json({ data: { objects: OBJECTS } }),
    'GET /rest/people': json({
      data: {
        people: [{
          id: 'person-1',
          name: { firstName: 'Test', lastName: 'Lead' },
          emails: { primaryEmail: 'test@example.com', additionalEmails: null },
          phones: { primaryPhoneNumber: '+971500000000', primaryPhoneCountryCode: '', primaryPhoneCallingCode: '', additionalPhones: null },
          companyId: null
        }]
      }
    }),
    'POST /rest/opportunities': json({ data: { createOpportunity: { id: 'opportunity-1' } } }),
    'POST /rest/notes': json({ statusCode: 500 }, 500)
  });

  const result = await syncToTwenty(
    { ...LEAD, company: '' },
    { TWENTY_BASE_URL: 'https://twenty-note-failure.example', TWENTY_API_KEY: 'twenty-secret' },
    router.fetchImpl
  );

  assert.equal(result.opportunityId, 'opportunity-1');
  assert.equal(result.noteId, null);
  assert.deepEqual(result.warnings, [{ code: 'twenty_note_failed', status: 500 }]);
});

test('rejects missing Twenty configuration before making a request', async () => {
  let called = false;
  await assert.rejects(
    syncToTwenty(LEAD, {}, async () => {
      called = true;
      return json({});
    }),
    (error) => error.safeCode === 'twenty_not_configured'
  );
  assert.equal(called, false);
});
