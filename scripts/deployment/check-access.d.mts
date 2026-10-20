export type AccessEnvironment = {
  TARGET_ENV?: string;
  HOST?: string;
  PORT?: string;
  DEPLOY_USER?: string;
  DEPLOY_KEY?: string;
  KNOWN_HOSTS?: string;
};

export type CommandResult = {
  status: number | null;
  stdout: string;
  stderr: string;
  error?: Error;
  signal?: string | null;
};

export type CommandRunner = (
  file: string,
  args: string[],
  options: {
    encoding: "utf8";
    timeout: number;
    maxBuffer: number;
    shell: false;
    env: Record<string, string>;
  },
) => CommandResult;

export function validateConfiguration(env: AccessEnvironment): {
  environment: "staging" | "production";
  host: string;
  port: string;
  user: "nightsky-deploy";
  key: string;
  knownHosts: string;
};

export function checkAccess(
  env: AccessEnvironment,
  run?: CommandRunner,
): {
  environment: "staging" | "production";
  status: "ready";
  operation: "check";
  crossEnvironmentDenied: true;
};
