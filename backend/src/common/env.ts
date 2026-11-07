const REQUIRED = [
  "PORT",
  "DATABASE_URL",
  "GRAPHHOPPER_URL",
  "GRAPHHOPPER_TOKEN",
] as const;

export function validateEnv(env: Record<string, unknown>) {
  const missing = REQUIRED.filter((key) => !env[key]);
  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }
  return env;
}
