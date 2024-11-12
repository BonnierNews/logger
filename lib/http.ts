import { getStore } from "./middleware";

/**
 * Retrieves an object from the request context store with headers that can be used
 * for requests to downstream services.
 *
 * Make sure you are using the `middleware` when using this.
 */
export function getHttpTraceHeader(): Record<string, string> {
  const { traceparent } = getStore() || {};
  return traceparent ? { traceparent } : {};
}
