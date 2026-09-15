# Website Lead Worker Design

## Purpose

Route the existing bilingual D3 website enquiry form through a Cloudflare Worker so a visitor submits once while Web3Forms and Twenty CRM receive the lead independently. Preserve the current form layout, copy, loading state, success state, error state, and reset behavior.

## Existing State

- `_includes/home-body.html` defines one shared form rendered on both `/ar/` and `/en/`.
- The form currently posts `FormData` directly to `https://api.web3forms.com/submit` from `assets/js/main.js`.
- The Web3Forms access key is currently embedded in the generated HTML.
- Required fields are `name`, `email`, and `message`; optional fields are `company`, `phone`, and `service`. The form also includes `subject`, `from_name`, and a `botcheck` honeypot.
- The repository has no existing Worker or Wrangler configuration.

## Architecture

The browser posts `multipart/form-data` to `https://api.d3dot.space/lead`. The Worker validates and normalizes the request, then starts the Web3Forms and Twenty operations independently. It waits for both bounded operations and returns a sanitized result with `success: true` when at least one destination captured the enquiry.

Web3Forms receives the same business fields and notification metadata as today, with `access_key` injected from `WEB3FORMS_ACCESS_KEY`. Twenty uses the self-hosted Core REST API beneath `TWENTY_BASE_URL/rest`. Before writing records, the integration reads authenticated object metadata and derives writable field names and relation capabilities for Person, Company, Opportunity, and Note. It never mutates metadata or creates custom fields.

## Browser Contract

- The form action becomes `https://api.d3dot.space/lead`; the access key is removed from HTML.
- JavaScript preserves the existing button and status behavior.
- Each submit includes the current page URL, submission timestamp, present UTM values, and a browser-generated idempotency key.
- The visitor sees success when the Worker returns an HTTP success and `success !== false`; the form resets exactly as it does now.

## Worker Contract

- Accept only `POST /lead` and CORS preflight for that route.
- Permit browser origins `https://d3dot.space` and `https://www.d3dot.space`. A comma-separated `ALLOWED_ORIGINS` variable may override the list for controlled deployments.
- Require `multipart/form-data` or `application/json`, enforce a 32 KiB request limit, reject a filled honeypot, validate required values, validate email shape, bound every field, and remove control characters.
- Use per-upstream abort timeouts. Never return upstream error bodies or credentials to the browser.
- Log structured destination failures with a request ID and safe status/category only.
- Cache a successful response by idempotency key for five minutes as best-effort duplicate protection. The form's disabled submit button remains the first protection.

## Twenty Record Flow

1. Fetch and cache authenticated metadata for standard objects and their fields.
2. Find a Person by normalized email. Reuse it when found; otherwise create it. Only update supplied, writable standard fields.
3. When a company is supplied, find it by normalized name or create it. Associate the Person where a writable standard company relation exists.
4. Create one Opportunity for the enquiry, relating it to the Person and Company wherever the actual schema supports those relations. Set the stage to the schema's `NEW` option when available.
5. Put the service in the Opportunity name. Preserve source URL, timestamp, contact details, message, and UTM values in a Note related to the Opportunity when the metadata exposes a supported Note target relation. If Notes are unavailable, include a compact, bounded summary in an existing writable text field on the Opportunity when available.

An Opportunity failure makes the Twenty branch fail even when Person or Company creation already succeeded. Web3Forms remains independent.

## Failure Semantics

The response body is `{ "success": boolean, "web3forms": boolean, "twenty": boolean, "requestId": string }`.

- Both succeed: HTTP 200, success.
- Web3Forms only succeeds: HTTP 200, success; log Twenty failure.
- Twenty only succeeds: HTTP 200, success; log Web3Forms failure.
- Both fail: HTTP 502, failure.
- Invalid or disallowed browser request: HTTP 4xx, failure without calling either destination.

## Configuration

Secrets:

- `WEB3FORMS_ACCESS_KEY`
- `TWENTY_API_KEY`

Non-secret Worker variables:

- `TWENTY_BASE_URL=https://twenty.d3dot.space`
- `ALLOWED_ORIGINS=https://d3dot.space,https://www.d3dot.space`
- `UPSTREAM_TIMEOUT_MS=8000`

Wrangler config declares `api.d3dot.space` as a custom domain. Deployment may create the DNS record automatically when the authenticated Cloudflare account owns the zone; otherwise the exact dashboard step is documented.

## Testing and Rollback

- Node's built-in test runner covers validation, CORS, partial success, double failure, Web3Forms payload preservation, metadata-driven Twenty operations, and idempotent replay without external calls.
- Ruby/Jekyll tests confirm the access key is absent from generated HTML and both language pages use the Worker endpoint.
- A shell script submits the requested fake lead only when explicitly invoked against a deployed endpoint. Automated tests never contact Web3Forms or Twenty.
- Rollback is one frontend commit: restore the old form action and key only if Worker forwarding has not passed live verification. Worker files are isolated under `worker/`.
