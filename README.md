# Patienty

Patienty is an AI-assisted patient management system that helps medical professionals understand patient history and changes quickly.

## Repository structure

```text
Patienty/
├── backend/     # Spring Boot API
├── frontend/    # Next.js web application
└── docs/        # Product and architecture documentation
```

## Local development

Requirements: Java 17, Node.js 24, npm, and Docker.

Create the untracked local environment file and start PostgreSQL:

```powershell
Copy-Item .env.example .env.local
docker compose --env-file .env.local up -d postgres
```

Run the backend and frontend in separate terminals:

```powershell
Set-Location backend
.\gradlew.bat bootRun
```

```powershell
Set-Location frontend
npm ci
npm run dev
```

The backend's default `local` profile imports the repository-root `.env.local`.
The frontend reads only `NEXT_PUBLIC_API_BASE_URL` from that same file; database
credentials are never injected into the Next.js process. If port 5432 is already
in use, change both `POSTGRES_PORT` and the datasource URL in `.env.local`.

The local app is available at `http://localhost:3000`, and the API runs at
`http://localhost:8080`. Stop the database with:

```powershell
docker compose --env-file .env.local down
```

### Demo clinicians

The `local` and opt-in `demo` profiles seed two synthetic clinician accounts
with different patient assignments:

| Account | Password |
| --- | --- |
| `doctor.kim@patienty.local` | `PatientyDemo1!` |
| `doctor.lee@patienty.local` | `PatientyDemo2!` |

These are public demo credentials, not production secrets. Use `prod,demo` for
the deployed synthetic demo; `prod` alone creates only the schema. Authentication
uses an HTTP-only server session and CSRF token flow. Local cookies use
`Secure=false` and `SameSite=Lax`; production defaults to `Secure=true` and
`SameSite=None`.

## Environment files

Only [.env.example](.env.example) is committed.

- `.env.local` is read by Docker Compose, Spring's `local` profile, and the
  frontend development process.
- `.env` is read by Spring's already-active `prod` profile and the frontend
  production process. On managed hosting, store the same values as platform
  secrets instead.
- Both real files are ignored by Git. Never store credentials in the repository.

Activate `prod` or `prod,demo` with a command-line argument or hosting setting,
not from inside `.env`. Host-provided environment variables take precedence over
the files. The frontend allowlists only `NEXT_PUBLIC_API_BASE_URL`; Neon
credentials are never loaded into the Next.js process.

## Neon deployment database

The configured Neon project has separate `development` and `main` branches.
Apply and verify Flyway migrations on `development` first. Only point the
deployment at `main` after that verification succeeds.

1. Put the Neon JDBC URL, role, and password in the ignored root `.env` as
   `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, and
   `SPRING_DATASOURCE_PASSWORD`. Keep `sslmode=require`.
2. Replace the `.invalid` frontend and backend origins in `.env`.
3. Build the backend, then activate the deployment profiles explicitly:

```powershell
Set-Location backend
.\gradlew.bat build
java -jar build/libs/patienty-backend-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod,demo
```

Use `prod,demo` for this synthetic public demo so both clinicians can log in.
Use `prod` alone only when an external clinician-provisioning path exists. On a
managed backend host, set `SPRING_PROFILES_ACTIVE=prod,demo` in the platform
settings instead of relying on the file. Production configuration fails fast when
the database or allowed frontend origin is missing.

The frontend production build reads only the public API URL from root `.env`;
hosting environment values override that file.

Do not expose the Neon connection string to Next.js or any `NEXT_PUBLIC_*`
variable. See Neon's official [connection guide](https://neon.com/docs/connect/connect-from-any-app)
and [secure connection guide](https://neon.com/docs/connect/connect-securely).

## Checks

```powershell
Set-Location backend
.\gradlew.bat test
.\gradlew.bat build
```

```powershell
Set-Location frontend
npm ci
npm run lint
npm run type-check
npm test
npm run build
```

## Documentation

- [Initial architecture and MVP design](docs/architecture.md)
