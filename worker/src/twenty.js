const DEFAULT_TIMEOUT_MS = 8000;
const METADATA_TTL_MS = 5 * 60 * 1000;
const metadataCache = new Map();

export class TwentyError extends Error {
  constructor(safeCode, status) {
    super(safeCode);
    this.name = 'TwentyError';
    this.safeCode = safeCode;
    this.status = status;
  }
}

function timeoutMs(env) {
  const parsed = Number(env.UPSTREAM_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);
  if (!Number.isFinite(parsed)) return DEFAULT_TIMEOUT_MS;
  return Math.min(20000, Math.max(1000, parsed));
}

function baseUrl(env) {
  return String(env.TWENTY_BASE_URL || '').replace(/\/+$/, '');
}

async function apiRequest(url, env, fetchImpl, options = {}) {
  const init = {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${env.TWENTY_API_KEY}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {})
    },
    signal: AbortSignal.timeout(timeoutMs(env))
  };
  if (options.method) init.method = options.method;
  if (options.body) init.body = JSON.stringify(options.body);

  let response;
  try {
    response = await fetchImpl(url, init);
  } catch (error) {
    if (error instanceof TwentyError) throw error;
    const code = error?.name === 'TimeoutError' || error?.name === 'AbortError'
      ? 'twenty_timeout'
      : 'twenty_network_error';
    throw new TwentyError(code);
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new TwentyError('twenty_http_error', response.status);
  }
  return payload;
}

function arrayValue(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.edges)) return value.edges.map((edge) => edge.node);
  return null;
}

function extractArray(payload, keys) {
  const roots = [payload?.data, payload].filter(Boolean);
  for (const root of roots) {
    const direct = arrayValue(root);
    if (direct) return direct;
    for (const key of keys) {
      const nested = arrayValue(root?.[key]);
      if (nested) return nested;
    }
  }
  return [];
}

function parseJsonValue(value, fallback) {
  if (value && typeof value === 'object') return value;
  if (typeof value !== 'string' || !value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeField(field) {
  return {
    ...field,
    settings: parseJsonValue(field.settings, {}),
    options: parseJsonValue(field.options, [])
  };
}

function normalizeObject(object, allFields) {
  let fields = extractArray(object.fields, ['fields', 'fieldMetadataItems']);
  if (fields.length === 0) {
    fields = allFields.filter((field) => field.objectMetadataId === object.id);
  }
  return { ...object, fields: fields.map(normalizeField) };
}

async function loadMetadata(env, fetchImpl) {
  const key = baseUrl(env);
  const cached = metadataCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.objects;

  const objectsPayload = await apiRequest(`${key}/rest/metadata/objects`, env, fetchImpl);
  const rawObjects = extractArray(objectsPayload, ['objects', 'objectMetadataItems']);
  if (rawObjects.length === 0) {
    throw new TwentyError('twenty_schema_incompatible');
  }

  let allFields = [];
  if (rawObjects.every((object) => extractArray(object.fields, ['fields', 'fieldMetadataItems']).length === 0)) {
    const fieldsPayload = await apiRequest(`${key}/rest/metadata/fields`, env, fetchImpl);
    allFields = extractArray(fieldsPayload, ['fields', 'fieldMetadataItems']);
  }

  const objects = rawObjects.map((object) => normalizeObject(object, allFields));
  metadataCache.set(key, { objects, expiresAt: Date.now() + METADATA_TTL_MS });
  return objects;
}

function isWritable(field) {
  return field &&
    field.isActive !== false &&
    field.isUIReadOnly !== true &&
    field.writability !== 'SYSTEM';
}

function findObject(objects, singularName) {
  return objects.find((object) => object.isActive !== false && object.nameSingular === singularName);
}

function findField(object, name, type) {
  return object?.fields.find((field) =>
    field.name === name &&
    (!type || field.type === type) &&
    isWritable(field)
  );
}

function relationIdField(object, targetObject, preferredName) {
  const field = object?.fields.find((candidate) => {
    if (!isWritable(candidate) || !['RELATION', 'MORPH_RELATION'].includes(candidate.type)) return false;
    if (candidate.relationTargetObjectMetadataId) {
      return candidate.relationTargetObjectMetadataId === targetObject?.id;
    }
    return candidate.name === preferredName;
  });
  return field?.settings?.joinColumnName || null;
}

function buildSchema(objects) {
  const person = findObject(objects, 'person');
  const company = findObject(objects, 'company');
  const opportunity = findObject(objects, 'opportunity');
  const note = findObject(objects, 'note');
  const noteTarget = findObject(objects, 'noteTarget');

  const required = [
    person,
    company,
    opportunity,
    findField(person, 'name', 'FULL_NAME'),
    findField(person, 'emails', 'EMAILS'),
    findField(company, 'name', 'TEXT'),
    findField(opportunity, 'name', 'TEXT')
  ];
  if (required.some((item) => !item)) {
    throw new TwentyError('twenty_schema_incompatible');
  }

  return {
    person,
    company,
    opportunity,
    note,
    noteTarget,
    personName: findField(person, 'name', 'FULL_NAME'),
    personEmails: findField(person, 'emails', 'EMAILS'),
    personPhones: findField(person, 'phones', 'PHONES'),
    personCompanyId: relationIdField(person, company, 'company'),
    opportunityName: findField(opportunity, 'name', 'TEXT'),
    opportunityStage: findField(opportunity, 'stage', 'SELECT'),
    opportunityCompanyId: relationIdField(opportunity, company, 'company'),
    opportunityPersonId: relationIdField(opportunity, person, 'pointOfContact'),
    noteTitle: findField(note, 'title', 'TEXT'),
    noteBody: findField(note, 'bodyV2', 'RICH_TEXT'),
    noteTargetNoteId: relationIdField(noteTarget, note, 'note'),
    noteTargetOpportunityId: relationIdField(noteTarget, opportunity, 'targetOpportunity')
  };
}

function responseRoot(payload) {
  return payload?.data ?? payload;
}

function extractRecord(payload, object, operation) {
  const root = responseRoot(payload);
  if (root?.id) return root;

  const operationKey = `${operation}${object.nameSingular[0].toUpperCase()}${object.nameSingular.slice(1)}`;
  const candidates = [
    root?.[operationKey],
    root?.[object.nameSingular],
    root?.[object.namePlural]
  ];
  for (const candidate of candidates) {
    if (candidate?.id) return candidate;
    if (Array.isArray(candidate) && candidate[0]?.id) return candidate[0];
  }
  for (const candidate of Object.values(root || {})) {
    if (candidate?.id) return candidate;
  }
  throw new TwentyError('twenty_invalid_response');
}

async function findOne(object, fieldPath, value, env, fetchImpl, comparator = 'eq') {
  const url = new URL(`${baseUrl(env)}/rest/${object.namePlural}`);
  url.searchParams.set('filter', `${fieldPath}[${comparator}]:${JSON.stringify(value)}`);
  url.searchParams.set('limit', '1');
  const payload = await apiRequest(url.toString(), env, fetchImpl);
  return extractArray(payload, [object.namePlural])[0] || null;
}

async function createRecord(object, body, env, fetchImpl) {
  const payload = await apiRequest(
    `${baseUrl(env)}/rest/${object.namePlural}`,
    env,
    fetchImpl,
    { method: 'POST', body }
  );
  return extractRecord(payload, object, 'create');
}

async function updateRecord(object, id, body, env, fetchImpl) {
  const payload = await apiRequest(
    `${baseUrl(env)}/rest/${object.namePlural}/${encodeURIComponent(id)}`,
    env,
    fetchImpl,
    { method: 'PATCH', body }
  );
  return extractRecord(payload, object, 'update');
}

function splitName(fullName) {
  const parts = fullName.split(/\s+/).filter(Boolean);
  return {
    firstName: parts.shift() || fullName,
    lastName: parts.join(' ')
  };
}

function emailValue(email) {
  return { primaryEmail: email, additionalEmails: null };
}

function phoneValue(phone) {
  return {
    primaryPhoneNumber: phone,
    primaryPhoneCountryCode: '',
    primaryPhoneCallingCode: '',
    additionalPhones: null
  };
}

function personCreateBody(lead, schema, companyId) {
  const body = {
    [schema.personName.name]: splitName(lead.name),
    [schema.personEmails.name]: emailValue(lead.email)
  };
  if (lead.phone && schema.personPhones) body[schema.personPhones.name] = phoneValue(lead.phone);
  if (companyId && schema.personCompanyId) body[schema.personCompanyId] = companyId;
  return body;
}

function personUpdateBody(person, lead, schema, companyId) {
  const body = {};
  const submittedName = splitName(lead.name);
  const existingName = person[schema.personName.name] || {};
  if (!existingName.firstName || !existingName.lastName) {
    body[schema.personName.name] = {
      firstName: existingName.firstName || submittedName.firstName,
      lastName: existingName.lastName || submittedName.lastName
    };
  }

  if (lead.phone && schema.personPhones) {
    const existingPhones = person[schema.personPhones.name] || {};
    if (!existingPhones.primaryPhoneNumber) body[schema.personPhones.name] = phoneValue(lead.phone);
  }

  if (companyId && schema.personCompanyId && !person[schema.personCompanyId]) {
    body[schema.personCompanyId] = companyId;
  }
  return body;
}

function newStageValue(stageField) {
  return stageField?.options?.find((option) =>
    option.value === 'NEW' || String(option.label || '').toLowerCase() === 'new'
  )?.value;
}

function opportunityBody(lead, schema, personId, companyId) {
  const body = {
    [schema.opportunityName.name]: `Website Lead — ${lead.service || 'General enquiry'}`
  };
  const stage = newStageValue(schema.opportunityStage);
  if (stage) body[schema.opportunityStage.name] = stage;
  if (companyId && schema.opportunityCompanyId) body[schema.opportunityCompanyId] = companyId;
  if (personId && schema.opportunityPersonId) body[schema.opportunityPersonId] = personId;
  return body;
}

function noteMarkdown(lead) {
  const lines = [
    'Source: Website',
    `Service: ${lead.service || 'Not specified'}`,
    `Name: ${lead.name}`,
    `Email: ${lead.email}`,
    `Phone: ${lead.phone || 'Not supplied'}`,
    `Company: ${lead.company || 'Not supplied'}`,
    `Page: ${lead.source_url || 'Not supplied'}`,
    `Submitted: ${lead.submitted_at || new Date().toISOString()}`
  ];
  const utmValues = ['source', 'medium', 'campaign', 'term', 'content']
    .map((name) => [name, lead[`utm_${name}`]])
    .filter(([, value]) => value);
  for (const [name, value] of utmValues) lines.push(`UTM ${name}: ${value}`);
  lines.push('', 'Message:', lead.message);
  return lines.join('\n');
}

function blocknoteBody(markdown) {
  return JSON.stringify([{
    id: crypto.randomUUID(),
    type: 'paragraph',
    props: {
      textColor: 'default',
      backgroundColor: 'default',
      textAlignment: 'left'
    },
    content: [{ type: 'text', text: markdown, styles: {} }],
    children: []
  }]);
}

async function createOpportunityNote(lead, schema, opportunityId, env, fetchImpl) {
  if (!schema.note || !schema.noteTarget || !schema.noteTitle || !schema.noteBody ||
      !schema.noteTargetNoteId || !schema.noteTargetOpportunityId) {
    return { noteId: null, warnings: [{ code: 'twenty_notes_unavailable' }] };
  }

  const markdown = noteMarkdown(lead);
  try {
    const note = await createRecord(schema.note, {
      [schema.noteTitle.name]: `Website enquiry — ${lead.service || 'General'}`,
      [schema.noteBody.name]: {
        markdown,
        blocknote: blocknoteBody(markdown)
      }
    }, env, fetchImpl);
    await createRecord(schema.noteTarget, {
      [schema.noteTargetNoteId]: note.id,
      [schema.noteTargetOpportunityId]: opportunityId
    }, env, fetchImpl);
    return { noteId: note.id, warnings: [] };
  } catch (error) {
    return {
      noteId: null,
      warnings: [{
        code: 'twenty_note_failed',
        ...(Number.isInteger(error?.status) ? { status: error.status } : {})
      }]
    };
  }
}

export async function syncToTwenty(lead, env, fetchImpl = fetch) {
  if (!env.TWENTY_BASE_URL || !env.TWENTY_API_KEY) {
    throw new TwentyError('twenty_not_configured');
  }

  const objects = await loadMetadata(env, fetchImpl);
  const schema = buildSchema(objects);

  let person = await findOne(
    schema.person,
    `${schema.personEmails.name}.primaryEmail`,
    lead.email,
    env,
    fetchImpl
  );

  let company = null;
  if (lead.company) {
    company = await findOne(schema.company, 'name', lead.company, env, fetchImpl, 'ilike');
    if (!company) {
      company = await createRecord(schema.company, { name: lead.company }, env, fetchImpl);
    }
  }

  if (!person) {
    person = await createRecord(
      schema.person,
      personCreateBody(lead, schema, company?.id),
      env,
      fetchImpl
    );
  } else {
    const update = personUpdateBody(person, lead, schema, company?.id);
    if (Object.keys(update).length > 0) {
      await updateRecord(schema.person, person.id, update, env, fetchImpl);
    }
  }

  const opportunity = await createRecord(
    schema.opportunity,
    opportunityBody(lead, schema, person.id, company?.id),
    env,
    fetchImpl
  );

  const noteResult = await createOpportunityNote(
    lead,
    schema,
    opportunity.id,
    env,
    fetchImpl
  );

  return {
    personId: person.id,
    companyId: company?.id || null,
    opportunityId: opportunity.id,
    noteId: noteResult.noteId,
    ...(noteResult.warnings.length > 0 ? { warnings: noteResult.warnings } : {})
  };
}
