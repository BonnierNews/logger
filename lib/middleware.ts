import type { RequestHandler } from "express";

import { getGcpProjectId } from "./gcp";
import { getTraceFromTraceparent, createTraceparent } from "./traceparent";
import { getLogFieldsFromTrace, storage } from "./storage";

export type Middleware = () => RequestHandler;

/**
 * Express middleware to be used to automatically decorate all logs with trace information.
 *
 * Only logs that occur inside the request context will be decorated, and applications running
 * in GCP will get the appropriate log fields to show up correctly in the GCP Trace Explorer.
 */
export const middleware: Middleware = () => {
  let initialized = false;
  let projectId: string | undefined;

  return async (req, _res, next) => {
    if (!initialized) {
      projectId = await getGcpProjectId();
      initialized = !!projectId;
    }

    const traceparent = req.header("traceparent") || createTraceparent();
    const trace = getTraceFromTraceparent(traceparent);
    const logFields = getLogFieldsFromTrace(trace, projectId);

    storage.run({ traceparent, logFields }, () => {
      next();
    });
  };
};
