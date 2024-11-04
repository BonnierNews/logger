import { getStore, middleware } from "../../lib/middleware";

describe("Express middleware", async () => {
  it("should store the traceparent header in the store", async () => {
    const traceparent = "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01";
    const req = { header: () => traceparent };

    // @ts-expect-error - We don't need the full Express Request object
    await middleware()(req, {}, () => {
      expect(getStore().traceparent).to.equal(traceparent);
    });
  });

  it("should return an empty object if the middleware is not used", () => {
    expect(getStore()).to.deep.equal({});
  });
});
