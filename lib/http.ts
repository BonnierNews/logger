import { getStore } from "./middleware";

export function getHttpTraceHeader() {
  const { traceparent } = getStore() || {};
  return traceparent ? { traceparent } : {};
}
