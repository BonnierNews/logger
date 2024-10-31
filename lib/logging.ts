import pino, { LoggerOptions } from "pino";
import { getGcpProjectId } from "./gcp";
import { getStore } from "./middleware";
import { getTraceFromTraceparent } from "./traceparent";

export function getLoggingTraceData() {
  const { traceparent, ...rest } = getStore();
  if (!traceparent) return {};

  const trace = getTraceFromTraceparent(traceparent);
  if (!trace) return rest;

  const logData = { traceId: trace.traceId, spanId: trace.parentId, ...rest };

  const gcpProjectId = getGcpProjectId();
  if (!gcpProjectId) {
    console.log("GCP Project ID not found");
    return logData;
  }

  return {
    ...logData,
    "logging.googleapis.com/trace": `projects/${gcpProjectId}/traces/${trace.traceId}`,
    "logging.googleapis.com/spanId": trace.parentId,
    "logging.googleapis.com/trace_sampled": trace.isSampled,
  };
}

type BnLoggerOptions = Omit<LoggerOptions, "level"> & {
  logLevel?: "trace" | "debug" | "info" | "warn" | "error" | "fatal";
  formatLog?: NonNullable<LoggerOptions["formatters"]>["log"];
  fetchGcpProjectId?: boolean;
};

export function logger(options: BnLoggerOptions = {}) {
  const env = process.env.NODE_ENV || "development";
  const shouldPrettyPrint = ["development", "test", "dev"].includes(env);

  const logLocation = env === "test" && "./logs/test.log";

  const {
    logLevel: level = "info",
    base = undefined,
    messageKey = "message",
    timestamp = () => `,"time": "${new Date().toISOString()}"`,
    formatLog,
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
    mixin,
    fetchGcpProjectId = true,
    ...rest
  } = options;

  if (fetchGcpProjectId) getGcpProjectId();

  return pino({
    level,
    base,
    messageKey,
    timestamp,
    formatters: {
      level(label) {
        if (shouldPrettyPrint) {
          return { level: label };
        }
        return { severity: gcpSeverity(label) };
      },
      ...(formatLog && { log: formatLog }),
    },
    transport,
    mixin: (...args) => ({ ...getLoggingTraceData(), ...mixin?.(...args) }),
    ...rest,
  });
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
