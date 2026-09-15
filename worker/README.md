# D3 Website Lead Worker

This Worker accepts the existing D3 website enquiry once and independently forwards it to Web3Forms and the self-hosted Twenty CRM.

## Endpoint and behavior

- Production endpoint: `POST https://api.d3dot.space/lead`
- Allowed browser origins: `https://d3dot.space` and `https://www.d3dot.space`
- A visitor receives a successful result when Web3Forms or Twenty captures the enquiry.
- Upstream error details and credentials are never returned to the visitor.
- A successful idempotency key is cached for five minutes as best-effort retry protection.
- The Worker reads Twenty object metadata before record writes and never changes the CRM schema.

## Twenty permissions

In Twenty, enable Advanced mode if necessary, then open **Settings → API & Webhooks → Create API key**. Assign the key a least-privilege role with:

- Data model settings permission, required by Twenty's authenticated metadata endpoint. The Worker only issues metadata `GET` requests.
- People: read, create, update
- Companies: read, create
- Opportunities: create
- Notes: create
- Note Targets: create

Copy the API key when it is shown; Twenty displays it only once.

## Configure Cloudflare secrets

From this `worker` directory, authenticate Wrangler and add both secrets:

```bash
npx wrangler login
npx wrangler secret put WEB3FORMS_ACCESS_KEY
npx wrangler secret put TWENTY_API_KEY
```

Enter each value only at Wrangler's hidden prompt. Do not place it on the command line, in `.dev.vars`, or in a committed file. Confirm the secret names:

```bash
npx wrangler secret list
```

`TWENTY_BASE_URL`, allowed origins, and the eight-second upstream timeout are non-secret variables in `wrangler.jsonc`.

## Offline verification

These commands use fakes and local builds only. They do not contact Web3Forms or Twenty:

```bash
cd worker
npm test
npm run check
cd ..
ruby -Itest _test/lead_form_integration_test.rb
ruby -Itest _test/quote_cta_links_test.rb
JEKYLL_NO_BUNDLER_REQUIRE=true jekyll build
```

## Deploy

Deploy the Worker before publishing the website commit that changes the form action:

```bash
cd worker
npm run deploy
```

The Wrangler route declares `api.d3dot.space` as a Cloudflare Worker custom domain. When the authenticated account owns the `d3dot.space` zone and no conflicting record exists, Wrangler creates the required DNS entry and certificate association.

If deployment reports a custom-domain or DNS conflict, do not delete an existing record blindly. In the Cloudflare dashboard open **Workers & Pages → d3-website-leads → Settings → Domains & Routes → Add → Custom Domain**, enter `api.d3dot.space`, review the conflicting record shown by Cloudflare, and approve replacement only if that record is not used by another service.

Inspect production logs without exposing request contents:

```bash
npx wrangler tail
```

Expected failure log events are `lead_delivery_failed` for a failed destination and `lead_delivery_warning` when an Opportunity was created but its Note could not be attached.

## Live test — explicit invocation only

Automated verification never runs the live test. After deployment and secret configuration, run:

```bash
cd worker
./scripts/test-lead.sh --send
```

To test another deployed endpoint:

```bash
./scripts/test-lead.sh --send https://example.workers.dev/lead
```

The response should be HTTP 200 with both destination flags true:

```json
{
  "success": true,
  "web3forms": true,
  "twenty": true,
  "requestId": "..."
}
```

Then confirm:

1. A Web3Forms email notification was received.
2. `test@example.com` exists once under People in Twenty.
3. `D3 Test Company` exists once and is associated with the Person.
4. A new `Website Lead — ERP Implementation` Opportunity exists in stage New.
5. The Opportunity has a `Website enquiry — ERP Implementation` Note containing the message, page URL, timestamp, and UTM values.

Re-running with the script creates a new idempotency key and therefore a new Opportunity, as expected for a new enquiry. Retrying the exact same HTTP request with the same key is deduplicated for five minutes.

## Safe release and rollback

Keep the existing live website on direct Web3Forms submission until the deployed Worker passes the live test. Publish the static website change only afterward. If Worker verification fails, leave the current website deployment unchanged and inspect `npx wrangler tail`; the Worker and frontend changes are separate commits so the frontend migration can be withheld without removing the Worker.
