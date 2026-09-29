# User Generator

Secure Vercel web app for creating and deleting fresh Aurora test users (`mobileaurora_*`), mirroring the Maestro `create:fresh-aurora-user` / `delete:fresh-aurora-user` flows from `mobile-app-v2`.

All Digital Banking and Transmit secrets stay **server-side**. The browser only sees:

- a shared app-password login
- generated username / password after create
- the saved user list (from private Vercel Blob)

## Features

- App-password gate with signed httpOnly session cookie (12h)
- Light / dark theme (Appearance switcher in the sidebar and on the login page; persisted in local storage, applied before first paint so there is no flash)
- Console UI with a left sidebar: navigation (Fresh users / External users) plus a global `dev` / `tst` environment switcher shared across every page (persisted in local storage; governs provisioning and the registry view). Provisioning writes a Digital Banking user. Login creates the Transmit user. Transmit admin credentials are optional and only used to delete that user later; an env without them shows **Unavailable** for cleanup, not for provision.
- External users reference catalog with Retail / SMB / Comingled tabs, KPI summary cards, search, pod filter, and one-click copy
- Optional username override (empty → random `mobileaurora_*`); optional ECIF ID / Interpose ID overrides (empty → seed defaults used by Maestro)
- Persist created users in **private** Vercel Blob (`users/{env}/{username}.json`)
- Delete users (best-effort Transmit remove-from-app when admin creds exist, plus Digital Banking delete and Blob cleanup)
- Aurora migration via Digital Banking user-flags (same path Maestro uses when SSO admin is unreachable — required on Vercel)

### How `dev` vs `tst` works

- **Digital Banking** credentials stay shared (`client_id`, `client_secret`, `x_api_key`).
- **Transmit admin** credentials are optional, per env, and used only when deleting a user login has already created:
  - `dev` → `TRANSMIT_CLIENT_ID_DEV` / `TRANSMIT_CLIENT_SECRET_DEV`, default base `https://api.transmitsecurity.io`
  - `tst` → `TRANSMIT_CLIENT_ID_TST` / `TRANSMIT_CLIENT_SECRET_TST` / `TRANSMIT_API_BASE_URL_TST`
- An env with those vars missing is marked **Unavailable** in the switcher. Provisioning still works. Delete skips Transmit cleanup and reports a warning.
- Created users are stored under `users/{dev|tst}/`. Login authenticates the Digital Banking password and creates the Transmit app user.

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
| `TRANSMIT_CLIENT_ID_DEV` | no | Transmit admin client id for deleting the DEV user login creates. Missing → DEV cleanup shows Unavailable |
| `TRANSMIT_CLIENT_SECRET_DEV` | no | Transmit admin client secret for DEV cleanup |
| `TRANSMIT_API_BASE_URL_DEV` | no | Default `https://api.transmitsecurity.io` |
| `TRANSMIT_CLIENT_ID_TST` | no | Transmit admin client id for TST cleanup. Missing → TST cleanup shows Unavailable |
| `TRANSMIT_CLIENT_SECRET_TST` | no | Transmit admin client secret for TST cleanup |
| `TRANSMIT_API_BASE_URL_TST` | no | Required once TST admin credentials are set. No default |
| `BLOB_READ_WRITE_TOKEN` | yes | Vercel Blob read/write token |
| `AUTH_DIGITAL_BANKING_API_BASE_URL` | no | Default `https://qa-api.firsthorizon.com` (shared) |

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
| Username | Random `mobileaurora_<16 digits>` (13-digit epoch timestamp ms + 3 random digits), or an optional custom login (3–64 letters, digits, `.`, `_`, `-`) |
| Password | `Bank1234567!` |
| ECIF ID | Optional override; default `102175008`. Create stores interpose only; the generator then updates the user with `ecifId`, which GET returns as `ecif` |
| Interpose ID | Optional override; default `00004451009944740791` (**required** for login customer lookup) |

Create now verifies after provision that:

- Digital Banking has a usable `interpose` fhnId and an `ecif` fhnId equal to the requested party id (not missing / not `"undefined"`)
- Aurora flags are `auroraUser=true`, `migrationEligible=true`, `migrationStatus=COMPLETE`
- The Transmit app user is not created here. The first successful login creates it from this SSO user

### Login troubleshooting

Mobile copy **“Something went wrong / We encountered an issue processing your request”** is the Transmit login form’s catch-all for unmapped journey errors. A stored ECIF value of `"undefined"` fails party lookup as `FH_0000048`.

- Leave ECIF/Interpose empty unless you have a known-good customer; bad overrides break login.
- The seed pair above is one real customer. Create stores the interpose id, then a follow-up update stores the ECIF party id.
- Maestro `create:fresh-aurora-user` and this app’s flags-only path produce the same migration flags when compared side-by-side.
- Password auth for freshly provisioned users can succeed while a later journey policy step still rejects the session — that surfaces as Request Denied / rejection, not this app’s create failure.

## Scripts mirrored

Logic is ported (not imported) from:

- `mobile/mobile-app-v2/tests/maestro/scripts/provision-fresh-aurora-user.ts`
- Digital Banking + Transmit helpers under `apps/auth/tests/playwright/helpers/`
