import pino, { DestinationStream, LoggerOptions } from "pino";
import { getGcpProjectId } from "./gcp";
import { getStore } from "./middleware";
import { getTraceFromTraceparent } from "./traceparent";

export function getLoggingTraceData() {
  const { traceparent, ...rest } = getStore();
  if (!traceparent) return rest;

  const trace = getTraceFromTraceparent(traceparent);
  if (!trace) return rest;

  const logData = { traceId: trace.traceId, spanId: trace.parentId, ...rest };

  const gcpProjectId = getGcpProjectId();
  if (!gcpProjectId) return logData;

  return {
    ...logData,
    "logging.googleapis.com/trace": `projects/${gcpProjectId}/traces/${trace.traceId}`,
    "logging.googleapis.com/spanId": trace.parentId,
    "logging.googleapis.com/trace_sampled": trace.isSampled,
  };
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
      mixin: (...args) => ({ ...getLoggingTraceData(), ...mixin?.(...args) }),
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
