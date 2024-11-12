import type { RequestHandler } from "express";
import { getStore, middleware as createMiddleware, Store } from "../../lib/middleware";

describe("Express middleware", () => {
  let middleware: RequestHandler;

  beforeEach(() => {
    middleware = createMiddleware();
  });

  it("should store the traceparent header in the store", async () => {
    const traceparent = "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01";
    const req = { header: () => traceparent };

    // @ts-expect-error - We don't need the full Express Request object
    await middleware(req, {}, () => {
      const store = getStore();
      expect(store).to.have.property("traceparent").and.equal(traceparent);
      expect(store).to.have.property("logFields").and.deep.equal({
        traceId: "0af7651916cd43dd8448eb211c80319c",
        spanId: "b7ad6b7169203331",
      });
    });
  });

  it("should create a new traceparent and store it in the store if no traceparent header was provided", async () => {
    const req = { header: () => {} };

    // @ts-expect-error - We don't need the full Express Request object
    await middleware(req, {}, () => {
      const store = getStore() || ({} as Store);
      expect(new RegExp(/^[\da-f-]{55}$/).test(store.traceparent as string)).to.equal(true);
      const traceParts = store.traceparent?.split("-") || [];
      expect(traceParts).to.be.of.length(4);
      expect(store.logFields?.traceId).to.equal(traceParts[1]);
      expect(store.logFields?.spanId).to.equal(traceParts[2]);
    });
  });

  it("getStore should return undefined if the middleware is not used", () => {
    expect(getStore()).to.deep.equal(undefined);
  });
});
