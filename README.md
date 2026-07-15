# User Generator

Secure Vercel web app for creating and deleting fresh Aurora test users (`mobileaurora_*`), mirroring the Maestro `create:fresh-aurora-user` / `delete:fresh-aurora-user` flows from `mobile-app-v2`.

All Digital Banking and Transmit secrets stay **server-side**. The browser only sees:

- a shared app-password login
- generated username / password after create
- the saved user list (from private Vercel Blob)

## Features

- App-password gate with signed httpOnly session cookie (12h)
- Create users for `dev` or `tst`
- Persist created users in **private** Vercel Blob (`users/{env}/{username}.json`)
- Delete users (Transmit remove-from-app + Digital Banking delete + Blob cleanup)
- Aurora migration via Digital Banking user-flags (same path Maestro uses when SSO admin is unreachable — required on Vercel)

## Local development

```bash
cp .env.example .env.local
# fill APP_PASSWORD, SESSION_SECRET, Digital Banking + Transmit secrets,
# and BLOB_READ_WRITE_TOKEN (from a Vercel Blob store)

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Generate a session secret:

```bash
openssl rand -base64 32
```

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `APP_PASSWORD` | yes | Shared UI password |
| `SESSION_SECRET` | yes | HMAC cookie signing (≥16 chars; use 32+) |
| `client_id` | yes | Digital Banking OAuth client |
| `client_secret` | yes | Digital Banking OAuth secret |
| `x_api_key` | yes | Digital Banking API key (sent as `x-api-key` header) |
| `TRANSMIT_CLIENT_ID_TST` | yes* | Transmit client id (*or `TRANSMIT_ADMIN_CLIENT_ID`) |
| `TRANSMIT_CLIENT_SECRET_TST` | yes* | Transmit client secret (*or `TRANSMIT_ADMIN_CLIENT_SECRET`) |
| `BLOB_READ_WRITE_TOKEN` | yes | Vercel Blob read/write token |
| `AUTH_DIGITAL_BANKING_API_BASE_URL` | no | Default `https://qa-api.firsthorizon.com` |
| `TRANSMIT_ADMIN_API_BASE_URL` | no | Default `https://api.transmitsecurity.io` |

Never prefix these with `NEXT_PUBLIC_`.

## Vercel deploy checklist

1. Push this repo to GitHub and import the project in Vercel.
2. **Storage → Create / Link Blob store** for the project (sets `BLOB_READ_WRITE_TOKEN`).
3. In Project → Settings → Environment Variables, add all secrets from `.env.example` for Production (and Preview if needed).
4. Deploy. Create/delete routes use `maxDuration = 60` (Pro plan if you need the full minute).
5. Open the deployment URL → sign in with `APP_PASSWORD` → create a user.

### Security notes

- Middleware blocks unauthenticated access to everything except `/login`.
- Mutations require an authenticated session; errors are sanitized before returning to the client.
- Blob objects are stored with `access: "private"` so credentials are not world-readable via URL.
- Password comparison uses timing-safe equality.

## Credentials produced

| Field | Value |
| --- | --- |
| Username | `mobileaurora_<9 digits>` |
| Password | `Bank1234567!` |

## Scripts mirrored

Logic is ported (not imported) from:

- `mobile/mobile-app-v2/tests/maestro/scripts/provision-fresh-aurora-user.ts`
- Digital Banking + Transmit helpers under `apps/auth/tests/playwright/helpers/`
