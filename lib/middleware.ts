import type { RequestHandler } from "express";
import { AsyncLocalStorage } from "node:async_hooks";
import { getGcpProjectId } from "./gcp";
import { getTraceFromTraceparent, createTraceparent } from "./traceparent";

type LogFields = {
  traceId?: string;
  spanId?: string;
  "logging.googleapis.com/trace"?: string;
  "logging.googleapis.com/spanId"?: string;
  "logging.googleapis.com/trace_sampled"?: boolean;
  [key: string]: unknown;
};

export type Store = {
  traceparent?: string;
  logFields: LogFields;
};

export type Middleware = () => RequestHandler;

const storage = new AsyncLocalStorage<Store>();

export const middleware: Middleware = () => {
  let initialized = false;
  let projectId: string | undefined;

  return async (req, _res, next) => {
    if (!initialized) {
      initialized = true;
      projectId = await getGcpProjectId();
    }

    const traceparent = req.header("traceparent") || createTraceparent();
    const trace = getTraceFromTraceparent(traceparent);
    const logFields: LogFields = {};

    if (trace) {
      logFields.traceId = trace.traceId;

      if (projectId) {
        logFields["logging.googleapis.com/trace"] = `projects/${projectId}/traces/${trace.traceId}`;
        logFields["logging.googleapis.com/spanId"] = trace.parentId;
        logFields["logging.googleapis.com/trace_sampled"] = trace.isSampled;
      } else {
        logFields.spanId = trace.parentId;
      }
    }

    storage.run({ traceparent, logFields }, () => {
      next();
    });
  };
};

export function getStore(): Store | undefined {
  return storage.getStore();
}
