import { describe, beforeEach, it } from "node:test";
import type { RequestHandler } from "express";

import { getTraceparent, getTraceId } from "../../lib/propagation";
import { middleware as createMiddleware } from "../../lib/middleware";

describe("Propagations", () => {
  let middleware: RequestHandler;
  const traceparent = "00-abcdef0123456789abcdef0123456789-abcdef0123456789-01";

  beforeEach(() => {
    middleware = createMiddleware();
  });

  describe("getTraceparent", () => {
    it("should get the traceparent string from the middleware context", async () => {
      // @ts-expect-error - We don't need the full Express Request object
      await middleware({ header: () => traceparent }, {}, () => {
        expect(getTraceparent()).to.equal(traceparent);
      });
    });

    it("should return undefined if run outside the middleware context", () => {
      expect(getTraceparent()).to.equal(undefined);
    });
  });

  describe("getTraceId", () => {
    it("should get the traceId from the middleware context", async () => {
      // @ts-expect-error - We don't need the full Express Request object
      await middleware({ header: () => traceparent }, {}, () => {
        expect(getTraceId()).to.equal("abcdef0123456789abcdef0123456789");
      });
    });

    it("should return undefined if run outside the middleware context", () => {
      expect(getTraceId()).to.equal(undefined);
    });
  });
});
