import type { RequestHandler } from "express";
import { type NextRequest } from "next/server.js";

import { getGcpProjectId } from "./gcp";
import { getTraceFromTraceparent, createTraceparent } from "./traceparent";
import { getLogFieldsFromTrace, storage } from "./storage";

export type Middleware = () => RequestHandler;
export type NextMiddleware = () => void;

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
      initialized = true;
      projectId = await getGcpProjectId();
    }

    const traceparent = req.header("traceparent") || createTraceparent();
    const trace = getTraceFromTraceparent(traceparent);
    const logFields = getLogFieldsFromTrace(trace, projectId);

    storage.run({ traceparent, logFields }, () => {
      next();
    });
  };
};

export const nextMiddleware: NextMiddleware = () => {
  let initialized = false;
  let projectId: string | undefined;
  console.log("hej 1"); // eslint-disable-line

  return async (req: NextRequest) => {
    if (!initialized) {
      console.log("hej 2"); // eslint-disable-line
      initialized = true;
      projectId = await getGcpProjectId();
    }

    console.log("hej 3"); // eslint-disable-line
    const requestHeaders = new Headers(req.headers);

    const traceparent = requestHeaders.get("traceparent") || createTraceparent();
    const trace = getTraceFromTraceparent(traceparent);
    const logFields = getLogFieldsFromTrace(trace, projectId);

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    storage.run({ traceparent, logFields }, () => { });
  };
};
