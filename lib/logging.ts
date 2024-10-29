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

// TODO: This is a copy of exp-logger, implement this
// export function buildLogger(opts: SomeType) {
//   return pino({ opts, mixin: getLoggingTraceData });
// }

// function severity(label) {
//   switch (label) {
//     case "trace":
//       return "DEBUG";
//     case "debug":
//       return "DEBUG";
//     case "info":
//       return "INFO";
//     case "warn":
//       return "WARNING";
//     case "error":
//       return "ERROR";
//     case "fatal":
//       return "CRITICAL";
//     default:
//       return "DEFAULT";
//   }
// }

// /**
//  * @typedef LoggerOptions
//  * @property {string} options.logLevel="info" which level of severity to log at
//  * @property {function} options.mixin mixin for additional information in the log statement
//  * @property {function} [options.formatLog] function to do change the shape of the log object
//  */

// /** @typedef {import("pino").Logger} Logger */

// /**
//  * @param {LoggerOptions} options
//  * @return {Logger} the logger.
//  *
//  */
// function init(options) {
//   const env = process.env.NODE_ENV || "development";
//   const shouldPrettyPrint = ["development", "test", "dev"].includes(env);

//   const logLocation = env === "test" && "./logs/test.log";
//   return pino({
//     level: options?.logLevel ?? "info",
//     messageKey: "message",
//     base: undefined,
//     formatters: {
//       level(label) {
//         if (shouldPrettyPrint) {
//           return { level: label };
//         }
//         return { severity: severity(label) };
//       },
//       ...(options?.formatLog && { log: options?.formatLog }),
//     },
//     timestamp: () => `,"time": "${new Date().toISOString()}"`,
//     transport: shouldPrettyPrint
//       ? {
//           target: "pino-pretty",
//           options: {
//             destination: logLocation || 1,
//             colorize: !logLocation,
//             messageKey: "message",
//           },
//         }
//       : undefined,
//     mixin: options?.mixin,
//   });
// }
