#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" != "--send" ]]; then
  echo "This script creates a real Web3Forms notification and Twenty CRM lead."
  echo "Run: $0 --send [https://api.d3dot.space/lead]"
  exit 2
fi

endpoint="${2:-https://api.d3dot.space/lead}"
if [[ "$endpoint" != https://* ]]; then
  echo "Refusing to send lead data to a non-HTTPS endpoint." >&2
  exit 2
fi

timestamp="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
idempotency_key="d3-live-test-$(date -u +%Y%m%d%H%M%S)-${RANDOM}"

curl --fail-with-body --silent --show-error \
  --request POST "$endpoint" \
  --header "Accept: application/json" \
  --header "Origin: https://d3dot.space" \
  --header "Idempotency-Key: $idempotency_key" \
  --form-string "name=Test Lead" \
  --form-string "email=test@example.com" \
  --form-string "phone=+971500000000" \
  --form-string "company=D3 Test Company" \
  --form-string "service=ERP Implementation" \
  --form-string "message=Testing website → Worker → Web3Forms + Twenty integration" \
  --form-string "subject=New website enquiry — D3" \
  --form-string "from_name=D3 Website" \
  --form-string "source_url=https://d3dot.space/en/?utm_source=integration-test" \
  --form-string "submitted_at=$timestamp" \
  --form-string "utm_source=integration-test"

echo
