import pino, { DestinationStream, LoggerOptions } from "pino";
import { getStore } from "./middleware";

function getLoggingData() {
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

type BnLoggerOptions = Omit<LoggerOptions, "level" | "formatters"> & {
  logLevel?: "trace" | "debug" | "info" | "warn" | "error" | "fatal";
  formatLog?: NonNullable<LoggerOptions["formatters"]>["log"];
};

export function logger(options: BnLoggerOptions = {}, stream?: DestinationStream | undefined) {
  const env = process.env.NODE_ENV /* c8 ignore next */ || "development";
  const shouldPrettyPrint = ["development", "test", "dev"].includes(env) && !stream;

  const logLocation = env === "test" && "./logs/test.log";

  const {
    logLevel: level = "info",
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
      level,
      base,
      messageKey,
      timestamp,
      formatters: {
        level: (label) =>
          shouldPrettyPrint ? /* c8 ignore next */ { level: label } : { severity: gcpSeverity(label) },
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
    /* c8 ignore next 2 */
    default:
      return "DEFAULT";
  }
}
