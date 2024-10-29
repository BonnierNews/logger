import { getStore } from "./middleware";

export function getHttpTraceHeader() {
  const { traceparent } = getStore();
  if (traceparent) return { traceparent };
  return {};
}
