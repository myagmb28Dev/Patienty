const RENDER_API_KEY = process.env.RENDER_API_KEY;
const SERVICE_ID = process.env.RENDER_SERVICE_ID;
const ENV_VARS_JSON = process.env.RENDER_ENV_VARS_JSON;

if (!RENDER_API_KEY || !SERVICE_ID || !ENV_VARS_JSON) {
  console.log("Skipping Render env sync: RENDER_API_KEY, RENDER_SERVICE_ID, or RENDER_ENV_VARS_JSON not set.");
  process.exit(0);
}

async function syncEnvVars() {
  let envVars;
  try {
    envVars = JSON.parse(ENV_VARS_JSON);
  } catch (error) {
    console.error("Invalid JSON format in RENDER_ENV_VARS_JSON:", error);
    process.exit(1);
  }

  const payload = Object.entries(envVars).map(([key, value]) => ({
    key,
    value: String(value),
  }));

  const response = await fetch(`https://api.render.com/v1/services/${SERVICE_ID}/env-vars`, {
    method: "PUT",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": `Bearer ${RENDER_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Failed to sync env vars to Render service ${SERVICE_ID}:`, response.status, errorText);
    process.exit(1);
  }

  console.log(`Successfully synced ${payload.length} environment variables to Render service ${SERVICE_ID}.`);
}

syncEnvVars().catch((err) => {
  console.error("Unexpected error syncing Render env vars:", err);
  process.exit(1);
});
