# IRIS Backend Production Runbook

## Required secrets

Set these values outside the repository before starting `docker-compose.prod.yml`:

- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `INTERNAL_SERVICE_KEY`
- `GATEWAY_PORT` (optional, defaults to `4000`)
- SMTP variables when `EMAIL_ENABLED=true`

Use long, random values and rotate them through the deployment secret manager.

## Start

```powershell
$env:JWT_ACCESS_SECRET = "<secret>"
$env:JWT_REFRESH_SECRET = "<secret>"
$env:INTERNAL_SERVICE_KEY = "<secret>"
docker compose -f docker-compose.prod.yml up -d --build
```

Only the gateway is published in the production Compose file. MongoDB and internal services stay on the private Docker network.

## Verification

```powershell
Invoke-RestMethod http://localhost:4000/health
docker compose -f docker-compose.prod.yml logs --tail 100
```

Expected service health is `UP`. An unauthenticated request to `/api/v1/users/me` must return `401`.

## Final audit checklist

- JWT access and refresh secrets are deployment-provided.
- Internal service calls require `x-service-key`.
- Admin bootstrap is disabled after initial setup and rate limited.
- OTP sends are throttled per identifier and OTP attempts are capped.
- Unsupported SMS delivery is rejected rather than marked sent.
- Invoice status transitions are audited and notifications are non-blocking.
- Invoice attachments are authorized, size-limited, downloadable, and cleaned up after failed persistence.
- Invoice filters and update date relationships are validated.
- Invoice and notification validation tests pass with `npm test` in their service directories.
- OpenAPI contract is available at `docs/openapi.yaml`.
- SMTP credentials, TLS termination, backups, monitoring, and log retention are configured by the operator.
