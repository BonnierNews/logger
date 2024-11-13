import type { RequestHandler } from "express";

import { getHttpTraceHeader } from "../../lib/http";
import { middleware as createMiddleware } from "../../lib/middleware";

describe("HTTP helper", () => {
  let middleware: RequestHandler;

  beforeEach(() => {
    middleware = createMiddleware();
  });

  it("should get the traceparent header from the middleware context", async () => {
    const traceparent = "00-abcdef0123456789abcdef0123456789-abcdef0123456789-01";

    // @ts-expect-error - We don't need the full Express Request object
    await middleware({ header: () => traceparent }, {}, () => {
      expect(getHttpTraceHeader()).to.deep.equal({ traceparent });
    });
  });

  it("should return an empty object if run outside the middleware context", () => {
    expect(getHttpTraceHeader()).to.deep.equal({});
  });
});
