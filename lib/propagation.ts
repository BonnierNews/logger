import { getStore } from "./middleware";
import { getTraceFromTraceparent } from "./traceparent"

/**
 * Retrieves an object from the request context store with headers that can be used
 * for requests to downstream services.
 *
 * Make sure you are using the `middleware` when using this.
 */
export function getTraceparentObject(): Record<"traceparent", string> | undefined {
  const { traceparent } = getStore() || {};
  return traceparent ? { traceparent } : undefined;
}

/**
 * Retrieves traceparent string from the request context store that can be used
 * for requests to downstream services.
 *
 * Make sure you are using the `middleware` when using this.
 */
export function getTraceparent(): string | undefined {
  const { traceparent } = getStore() || {};
  return traceparent;
}

/**
 * Retrieves traceId from the request context store
 *
 * Make sure you are using the `middleware` when using this.
 */
export function getTraceId(): string | undefined {
  const { traceparent } = getStore() || {};
  return traceparent
    ? getTraceFromTraceparent(traceparent)?.traceId
    : undefined;
}
