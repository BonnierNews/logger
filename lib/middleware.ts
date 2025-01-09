import type { RequestHandler } from "express";

import { attachTrace } from "./attach-trace";

export type Middleware = () => RequestHandler;

/**
 * Express middleware to be used to automatically decorate all logs with trace information.
 *
 * Only logs that occur inside the request context will be decorated, and applications running
 * in GCP will get the appropriate log fields to show up correctly in the GCP Trace Explorer.
 */
export const middleware: Middleware = () => {
  return async (req, _res, next) => {
    const traceparent = req.header("traceparent");
    const runWithTrace = await attachTrace(next, traceparent);
    await runWithTrace();
  };
};
