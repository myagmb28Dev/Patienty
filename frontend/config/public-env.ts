import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "dotenv";

export const PUBLIC_ENV_KEYS = ["NEXT_PUBLIC_API_BASE_URL"] as const;

type EnvValues = Record<string, string | undefined>;

export function applyPublicEnv(
  source: EnvValues,
  target: EnvValues = process.env,
) {
  for (const key of PUBLIC_ENV_KEYS) {
    if (target[key] === undefined && source[key] !== undefined) {
      target[key] = source[key];
    }
  }
  return target;
}

export function loadPublicRootEnv({
  cwd = process.cwd(),
  mode = process.env.NODE_ENV,
  target = process.env,
}: {
  cwd?: string;
  mode?: string;
  target?: EnvValues;
} = {}) {
  const filename = mode === "production" ? ".env" : ".env.local";
  const filepath = path.resolve(cwd, "..", filename);

  if (!existsSync(filepath)) return target;

  const parsed = parse(readFileSync(filepath));
  return applyPublicEnv(parsed, target);
}
