import crypto from "crypto";

/**
 * Traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-00
 *
 * base16(version) = 00
 * base16(trace-id) = 4bf92f3577b34da6a3ce929d0e0e4736
 * base16(parent-id) = 00f067aa0ba902b7
 * base16(trace-flags) = 00  // 00 is not sampled, 01 is sampled
 */
export function getTraceFromTraceparent(traceHeader: string) {
  const parts = traceHeader.split("-");

  if (!parts || parts.length !== 4) return;

  return {
    traceId: parts[1],
    parentId: parts[2],
    isSampled: parts[3] !== "00",
  };
}

export function createTraceparent(isSampled: boolean = false) {
  const version = "00";
  const traceId = crypto.randomBytes(16).toString("hex");
  const parentId = crypto.randomBytes(8).toString("hex");
  const flags = isSampled ? "01" : "00";

  return `${version}-${traceId}-${parentId}-${flags}`;
}
