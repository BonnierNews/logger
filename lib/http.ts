import { getStore } from "./middleware";

export function getHttpTraceHeader(): Record<string, string> {
  const { traceparent } = getStore() || {};
  return traceparent ? { traceparent } : {};
}
