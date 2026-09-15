# Website Lead Worker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a deployable Cloudflare Worker that securely forwards one D3 website enquiry to Web3Forms and Twenty CRM while preserving the existing visitor experience.

**Architecture:** A dependency-free Worker validates one `/lead` request and runs isolated Web3Forms and metadata-driven Twenty REST clients. The static Jekyll form posts to the Worker and retains its current loading/success/error behavior.

**Tech Stack:** Jekyll, browser JavaScript, Cloudflare Workers ES modules, Wrangler, Node built-in test runner, Ruby Minitest.

**Spec:** `docs/superpowers/specs/2026-09-16-website-lead-worker-design.md`

## Global Constraints

- Keep Web3Forms fully functional but remove its access key from frontend code.
- Treat a submission as successful when at least one destination captures it.
- Use Twenty's authenticated metadata before creating or relating records.
- Do not create custom Twenty fields.
- Do not send a live fake lead during automated verification.
- Keep dependencies minimal and preserve the existing form UI and copy.

---

### Task 1: Worker request boundary and dual-delivery semantics

**Files:**
- Create: `worker/package.json`
- Create: `worker/wrangler.jsonc`
- Create: `worker/src/index.js`
- Create: `worker/test/worker.test.js`

**Interfaces:**
- Consumes: a Fetch API `Request`, Worker `env`, and execution context.
- Produces: default Worker handler plus exported `handleRequest`, `parseLead`, and `deliverLead` functions.

- [ ] **Step 1: Write failing tests** using `node:test`. Construct real `Request` instances and assert literal status/body/header results, including:

  ```js
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    success: true,
    web3forms: true,
    twenty: false,
    requestId: 'request-123'
  });
  assert.equal(response.headers.get('access-control-allow-origin'), 'https://d3dot.space');
  ```

  Cover disallowed origins (403, no upstream calls), invalid email (400), filled `botcheck` (200 neutral response, no calls), bodies above 32 KiB (413), one-destination success (200), both-destination failure (502), and replay of a successful idempotency key (no second upstream calls).
- [ ] **Step 2: Run `npm test` in `worker/`** and verify `ERR_MODULE_NOT_FOUND` for `src/index.js`.
- [ ] **Step 3: Implement the request boundary** with `handleRequest(request, env, ctx, deps)`, `parseLead(request)`, `deliverLead(lead, env, deps)`, exact-origin CORS, literal field limits, safe JSON responses, and an injected/default Cache API adapter.
- [ ] **Step 4: Run `npm test`** and verify the request-boundary cases report zero failures.
- [ ] **Step 5: Commit** the tested Worker boundary.

### Task 2: Web3Forms and metadata-driven Twenty REST clients

**Files:**
- Create: `worker/src/web3forms.js`
- Create: `worker/src/twenty.js`
- Create: `worker/test/web3forms.test.js`
- Create: `worker/test/twenty.test.js`
- Modify: `worker/src/index.js`

**Interfaces:**
- `sendToWeb3Forms(lead, env, fetchImpl)` returns `{ ok, status }` and throws only configuration/network errors.
- `syncToTwenty(lead, env, fetchImpl)` returns `{ personId, companyId, opportunityId, noteId }` or throws a sanitized `IntegrationError`.
- Metadata helpers resolve actual object plural names, writable fields, select values, and relation fields from `/rest/metadata/objects`.

- [ ] **Step 1: Write failing Web3Forms tests** with an injected fetch function. Inspect its real `FormData` request body and assert the Worker secret replaces any submitted key while `name`, `email`, `company`, `phone`, `service`, `message`, `subject`, `from_name`, `source_url`, `submitted_at`, and present `utm_*` values remain.
- [ ] **Step 2: Run `node --test test/web3forms.test.js`** and verify `ERR_MODULE_NOT_FOUND` for `src/web3forms.js`.
- [ ] **Step 3: Implement `sendToWeb3Forms`** against `https://api.web3forms.com/submit`, pass an abort signal derived from `UPSTREAM_TIMEOUT_MS`, require `response.ok` and a JSON body whose `success` is not false, then run the test green.
- [ ] **Step 4: Write failing Twenty tests** using the installed schema's complete Person, Company, Opportunity, Note, and NoteTarget metadata fixtures. Assert literal REST calls such as:

  ```js
  assert.equal(requests[0].url.pathname, '/rest/metadata/objects');
  assert.equal(opportunityBody.stage, 'NEW');
  assert.equal(opportunityBody.companyId, 'company-1');
  assert.equal(opportunityBody.pointOfContactId, 'person-1');
  ```

  Cover person lookup by `emails.primaryEmail`, company lookup by `name`, create-vs-reuse behavior, composite `name`/`emails`/`phones` payloads, `joinColumnName`-derived relation IDs, Opportunity creation, rich-text Note creation, and NoteTarget relation creation.
- [ ] **Step 5: Run `node --test test/twenty.test.js`** and verify `ERR_MODULE_NOT_FOUND` for `src/twenty.js`.
- [ ] **Step 6: Implement the metadata parser and REST record flow**. Accept common Twenty response envelopes (`data.<plural>`, `data.<mutation>`, or `data`) without guessing record fields; reject missing required objects/fields before writes. Run the Twenty test green.
- [ ] **Step 7: Import both real clients in `src/index.js`, wire them through `Promise.allSettled`, and run `npm test`.**
- [ ] **Step 8: Commit** the tested upstream integrations.

### Task 3: Preserve the website form behavior through the Worker

**Files:**
- Modify: `_includes/home-body.html`
- Modify: `assets/js/main.js`
- Create: `_test/lead_form_integration_test.rb`

**Interfaces:**
- Browser posts the existing `FormData` to `https://api.d3dot.space/lead` with `Accept: application/json` and `Idempotency-Key`.
- Browser appends `source_url`, `submitted_at`, and existing `utm_*` query parameters without changing visible inputs.

- [ ] **Step 1: Write a failing Minitest** that invokes Jekyll to a temporary destination and asserts, for both `ar/index.html` and `en/index.html`:

  ```ruby
  assert_includes html, 'action="https://api.d3dot.space/lead"'
  refute_includes html, 'name="access_key"'
  assert_includes html, 'data-lead-form'
  ```

- [ ] **Step 2: Run `ruby -Itest _test/lead_form_integration_test.rb`** and verify it fails because the direct Web3Forms action and key remain.
- [ ] **Step 3: Change the action and marker in `_includes/home-body.html`. In `assets/js/main.js`, append `source_url`, one ISO `submitted_at`, and only `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, and `utm_content`; send a stable `Idempotency-Key` for that attempt and preserve the existing button/status/reset branches.**
- [ ] **Step 4: Run all Ruby tests and build Jekyll**; verify both pass.
- [ ] **Step 5: Commit** the frontend migration.

### Task 4: Deployment and non-live verification tooling

**Files:**
- Create: `worker/README.md`
- Create: `worker/scripts/test-lead.sh`
- Modify: `.gitignore`

**Interfaces:**
- `npm run deploy` deploys the custom-domain Worker.
- `worker/scripts/test-lead.sh [endpoint]` submits the documented fake lead only on explicit invocation.

- [ ] **Step 1: Add Wrangler commands and deployment documentation** containing these exact secret commands and the custom-domain behavior:

  ```bash
  cd worker
  npx wrangler secret put WEB3FORMS_ACCESS_KEY
  npx wrangler secret put TWENTY_API_KEY
  npm run deploy
  npx wrangler tail
  ```

- [ ] **Step 2: Add an executable fake-lead script** that defaults to `https://api.d3dot.space/lead`, sends `Origin: https://d3dot.space`, uses a unique idempotency key, and posts the exact requested Test Lead fixture without credentials.
- [ ] **Step 3: Run offline syntax checks, Worker tests, Ruby tests, and Jekyll build** without invoking the fake-lead script.
- [ ] **Step 4: Inspect the final diff and scan tracked files for credential patterns.**
- [ ] **Step 5: Commit** the deployment documentation and tooling.

### Task 5: Final verification and handoff

**Files:**
- Verify all files above.

**Interfaces:**
- Produces a deployable branch and a concise handoff with files, endpoint, secrets, Twenty objects, duplicate behavior, test results, deployment command, and manual steps.

- [ ] **Step 1: Run `node --check` for every Worker/browser JavaScript file.**
- [ ] **Step 2: Run `npm test` in `worker/`.**
- [ ] **Step 3: Run both Ruby test files.**
- [ ] **Step 4: Run `JEKYLL_NO_BUNDLER_REQUIRE=true jekyll build`.**
- [ ] **Step 5: Run `git diff --check` and inspect `git status`.**
- [ ] **Step 6: Stop before deployment or live submission when Cloudflare and service secrets are unavailable.**
