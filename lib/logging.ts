import pino, {
  Level,
  DestinationStream as PinoDestinationStream,
  Logger as PinoLogger,
  LoggerOptions as PinoOptions,
} from "pino";

import { getStore } from "./storage";

/**
 * Get the decorated log fields.
 */
export function getLoggingData(): Record<string, unknown> {
  const store = getStore();
  return store ? store.logFields : {};
}

/**
 * Add any additional log data to the request context. To use this feature, you must enable the
 * request storage by initializing the built-in middleware.
 */
export function decorateLogs(obj: Record<string, unknown>) {
  const store = getStore();

  if (!store) throw new Error("@bonniernews/logger middleware has not been initialized");

  for (const key in obj) {
    store.logFields[key] = obj[key];
  }
}

export type Logger = PinoLogger<never, boolean>;

export type LoggerOptions = Omit<PinoOptions, "level" | "formatters"> & {
  level?: Level;
  logLevel?: Level;
  formatLog?: NonNullable<PinoOptions["formatters"]>["log"];
};

export type DestinationStream = PinoDestinationStream;

/**
 * Creates a pino logger that is pre-configured and ready to be used with minimal setup.
 */
export function logger(options: LoggerOptions = {}, stream?: DestinationStream | undefined): Logger {
  const env = process.env.NODE_ENV || "development";
  const shouldPrettyPrint = [ "development", "test", "dev" ].includes(env) && !stream;

  const logLocation = env === "test" && "./logs/test.log";

  const {
    logLevel = "info",
    level,
    base = undefined,
    messageKey = "message",
    timestamp = () => `,"time": "${new Date().toISOString()}"`,
    formatLog,
    /* c8 ignore start */
    transport = shouldPrettyPrint
      ? {
        target: "pino-pretty",
        options: {
          destination: logLocation || 1,
          colorize: !logLocation,
          messageKey: "message",
        },
      }
      : undefined,
    /* c8 ignore stop */
    mixin,
    ...rest
  } = options;

  return pino(
    {
      level: level || logLevel,
      base,
      messageKey,
      timestamp,
      formatters: {
        level: (label) => (shouldPrettyPrint ? { level: label } : { severity: gcpSeverity(label) }),
        ...(formatLog && { log: formatLog }),
      },
      transport,
      mixin: (...args) => ({ ...getLoggingData(), ...mixin?.(...args) }),
      ...rest,
    },
    stream
  );
}

function gcpSeverity(label: string) {
  switch (label) {
    case "trace":
      return "DEBUG";
    case "debug":
      return "DEBUG";
    case "info":
      return "INFO";
    case "warn":
      return "WARNING";
    case "error":
      return "ERROR";
    case "fatal":
      return "CRITICAL";
    default:
      return "DEFAULT";
  }
}
