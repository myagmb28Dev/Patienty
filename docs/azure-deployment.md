# Azure deployment

Patienty runs on Azure for Students in Korea Central with the subscription spending limit enabled. The existing Neon project `rough-cell-04681809`, branch `br-wandering-star-afprlas0`, and its data are retained.

## Architecture

- Resource group `rg-patienty`, Consumption environment `cae-patienty`, and ACR Basic registry `patienty520a1be2`.
- Frontend: `patienty-frontend`, 0.25 vCPU / 0.5 GiB, zero to one replica, public HTTPS ingress on port 3000.
- Backend: `patienty-backend`, 0.25 vCPU / 0.5 GiB, exactly one replica, internal ingress on port 8080. Sessions are in memory, so deployments restart sessions and require signing in again.
- The frontend proxies `/api/*` to the internal backend. Browser requests use the frontend origin; actuator endpoints are not proxied.
- A pull-only managed identity reads images. A separate GitHub OIDC identity can push images to this registry and update only the two Patienty apps.
- No dedicated workload profile or Log Analytics workspace is provisioned.

## Configuration

Frontend build arguments:

```text
NEXT_PUBLIC_API_BASE_URL=/
API_PROXY_TARGET=https://<actual backend ingress FQDN>
```

Use the actual FQDN returned by Azure. Do not guess an `.internal` label. Proxy rewrites are built into the frontend image, so changing the target requires a rebuild.

Backend environment:

```text
SPRING_PROFILES_ACTIVE=prod,demo
PATIENTY_CORS_ALLOWED_ORIGINS=https://<frontend FQDN>
PATIENTY_SESSION_COOKIE_SECURE=true
PATIENTY_SESSION_COOKIE_SAME_SITE=lax
PATIENTY_AI_PROVIDER=openrouter
PATIENTY_AI_OPENROUTER_MODEL=google/gemini-2.5-flash
```

Store `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`, and `OPENROUTER_API_KEY` as Container Apps secrets. Keep TLS enabled on the existing Neon connection. Never commit connection strings or temporary provisioning files.

The production connection pool has zero minimum connections, no keepalive, and a one-minute idle timeout so Neon can sleep. Readiness and liveness probes check application state without querying the database every few seconds. A deployment smoke test must additionally log in and fetch data to verify the DB connection. The `/actuator/health` aggregate remains available internally for explicit dependency checks.

## Release

1. Open a feature PR, pass backend and frontend CI, and merge to `main`.
2. Wait for CI to pass on the exact `main` commit to deploy.
3. Configure repository variables `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`, `AZURE_RESOURCE_GROUP`, `AZURE_REGISTRY`, `AZURE_API_PROXY_TARGET`, and `AZURE_PUBLIC_ORIGIN`.
4. Run **Deploy Azure** on `main`. It builds and tags both images with the commit SHA, run ID, and attempt, then updates both apps using OIDC. Deployment is manual to match Contrib and avoid unrequested credit usage on every push.
5. On first provisioning only, use `deploy_apps=false`, create the apps with the published images, secret references, and pull identity, then verify them. Later releases use the default `true`.
6. Verify `/login`, `/api/v1/auth/csrf`, real login, patient data, and AI streaming through the public frontend. Build success alone does not establish deployment success.

Configure startup probes with enough time for Spring Boot to initialize on 0.25 vCPU (for example 60 attempts at 10-second intervals). Backend liveness and readiness paths are `/actuator/health/liveness` and `/actuator/health/readiness`; frontend probes use `/login`. Keep maximum replicas at one.

## Cost and fallback

The frontend scales to zero, but the backend and ACR have continuing costs. Credits and free grants are finite. Neon had used 94% of its monthly compute allowance when migration was prepared on September 22, 2026. Review current usage in Neon before assuming the remaining allowance is sufficient.

Existing Render files are retained during migration as a fallback. Do not destroy old services or data until Azure validation is complete. Keep-alive pings are unnecessary and prevent the frontend or Neon from sleeping. Do not change the Azure subscription to pay-as-you-go as part of this deployment.

References: [Azure health probes](https://learn.microsoft.com/en-us/azure/container-apps/health-probes), [managed-identity image pulls](https://learn.microsoft.com/en-us/azure/container-apps/managed-identity-image-pull).
