# Patienty frontend

Next.js 16 App Router client for the Patienty clinical context copilot.

## Run locally

Use Node.js 24 and install dependencies:

```bash
npm ci
npm run dev
```

The frontend reads only `NEXT_PUBLIC_API_BASE_URL` from the repository root:

- development: `../.env.local`
- production build: `../.env`

An existing process environment value takes priority. Database credentials, session
secrets, and every non-allowlisted value are deliberately kept out of the Next.js
process and browser bundle.

## Checks

```bash
npm run lint
npm run type-check
npm test
npm run build
```

## Routes

- `/login` — clinician session login
- `/` — assigned-patient dashboard
- `/patients` — assigned-patient search and filters
- `/patients/[patientId]` — evidence-linked patient overview and assistant
