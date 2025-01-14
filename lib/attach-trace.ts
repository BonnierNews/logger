import { getLogFieldsFromTrace, storage } from "./storage";
import { getGcpProjectId } from "./gcp";
import { getTraceFromTraceparent, createTraceparent } from "./traceparent";

export async function attachTrace<R, TArgs extends unknown[]>(fn: (...args: TArgs) => R, traceparent?: string) {
  const projectId = await getGcpProjectId();
  traceparent = traceparent ? traceparent : createTraceparent();
  const trace = getTraceFromTraceparent(traceparent);
  const logFields = getLogFieldsFromTrace(trace, projectId);
  return (...args: TArgs): R => {
    return storage.run({ traceparent, logFields }, fn, ...args);
  };
}
