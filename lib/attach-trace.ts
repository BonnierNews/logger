import type { RequestHandler } from "express";
import { AsyncLocalStorage } from "node:async_hooks";

import { getGcpProjectId } from "./gcp";
import { getTraceFromTraceparent, createTraceparent, type Trace } from "./traceparent";

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

export async function attachTrace<T extends(...args: any) => any>(fn: T, traceparent?: string) {
  const projectId = await getGcpProjectId();
  traceparent = traceparent ? traceparent : createTraceparent();
  const trace = getTraceFromTraceparent(traceparent);
  const logFields = getLogFieldsFromTrace(trace, projectId);
  //   return (...args: Parameters<T>): ReturnType<T> => {
  return (...args: any): any => {
    return storage.run({ traceparent, logFields }, fn, ...args);
  };
}

function getLogFieldsFromTrace(trace: Trace | undefined, projectId: string | undefined) {
  const logFields: LogFields = {};
  if (trace) {
    logFields.traceId = trace.traceId;
    logFields.spanId = trace.parentId;
    if (projectId) {
      logFields["logging.googleapis.com/trace"] = `projects/${projectId}/traces/${trace.traceId}`;
      logFields["logging.googleapis.com/spanId"] = trace.parentId;
      logFields["logging.googleapis.com/trace_sampled"] = trace.isSampled;
    }
  }
  return logFields;
}

export function getStore(): Store | undefined {
  return storage.getStore();
}
