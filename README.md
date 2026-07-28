# User Generator

Secure Vercel web app for creating and deleting fresh Aurora test users (`mobileaurora_*`), mirroring the Maestro `create:fresh-aurora-user` / `delete:fresh-aurora-user` flows from `mobile-app-v2`.

All Digital Banking and Transmit secrets stay **server-side**. The browser only sees:

- a shared app-password login
- generated username / password after create
- the saved user list (from private Vercel Blob)

## Features

- App-password gate with signed httpOnly session cookie (12h)
- Create users for `dev` or `tst` (dropdown; last choice remembered in the browser)
- Optional ECIF ID / Interpose ID overrides (empty → seed defaults used by Maestro)
- Persist created users in **private** Vercel Blob (`users/{env}/{username}.json`)
- Delete users (Transmit remove-from-app + Digital Banking delete + Blob cleanup)
- Aurora migration via Digital Banking user-flags (same path Maestro uses when SSO admin is unreachable — required on Vercel)

### How `dev` vs `tst` works

Same as Maestro `provision-fresh-aurora-user`:

- **Shared credentials**: Digital Banking (QA) and Transmit admin (`*_TST` / `TRANSMIT_ADMIN_*`) are the same for both envs.
- **What changes**: Transmit create includes username + password auth on `dev`; on `tst` username is omitted and password-auth 403 is tolerated. Users are stored under `users/{dev|tst}/`.

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
| `TRANSMIT_CLIENT_ID_TST` | yes* | Transmit client id for **both** UI envs (*or `TRANSMIT_ADMIN_CLIENT_ID`) |
| `TRANSMIT_CLIENT_SECRET_TST` | yes* | Transmit client secret for **both** UI envs (*or `TRANSMIT_ADMIN_CLIENT_SECRET`) |
| `BLOB_READ_WRITE_TOKEN` | yes | Vercel Blob read/write token |
| `AUTH_DIGITAL_BANKING_API_BASE_URL` | no | Default `https://qa-api.firsthorizon.com` (shared) |
| `TRANSMIT_ADMIN_API_BASE_URL` | no | Default `https://api.transmitsecurity.io` (shared) |

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
| ECIF ID | Optional override; default `102175008` (often **not** persisted by Digital Banking — only interpose is) |
| Interpose ID | Optional override; default `00004451009944740791` (**required** for login customer lookup) |

Create now verifies after provision that:

- Digital Banking has a usable `interpose` fhnId (not missing / not `"undefined"`)
- Aurora flags are `auroraUser=true`, `migrationEligible=true`, `migrationStatus=COMPLETE`
- Transmit user exists (and username resolves on `dev`)

### Login troubleshooting

Mobile copy **“Something went wrong / We encountered an issue processing your request”** is the Transmit login form’s catch-all for unmapped journey errors (often interpose/customer lookup such as `FH_0000034`).

- Leave ECIF/Interpose empty unless you have a known-good customer interpose; bad overrides break login.
- Prefer the seed interpose above; Digital Banking create keeps **only** the interpose fhnId (ECIF is dropped by the API).
- Maestro `create:fresh-aurora-user` and this app’s flags-only path produce the same migration flags when compared side-by-side.
- Password auth for freshly provisioned users can succeed while a later journey policy step still rejects the session — that surfaces as Request Denied / rejection, not this app’s create failure.

## Scripts mirrored

Logic is ported (not imported) from:

- `mobile/mobile-app-v2/tests/maestro/scripts/provision-fresh-aurora-user.ts`
- Digital Banking + Transmit helpers under `apps/auth/tests/playwright/helpers/`
