import { AsyncLocalStorage } from "node:async_hooks";

import { type Trace } from "./traceparent";

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

export const storage = new AsyncLocalStorage<Store>();

export function getLogFieldsFromTrace(trace: Trace | undefined, projectId: string | undefined) {
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
