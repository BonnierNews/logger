import { getStore, middleware } from "../../lib/middleware";

describe("Express middleware", () => {
  it("should store the traceparent header in the store", () => {
    const traceparent = "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01";
    const req = { header: () => traceparent };

    // @ts-expect-error - We don't need the full Express Request object
    middleware(req, {}, () => {
      expect(getStore().traceparent).to.equal(traceparent);
    });
  });

  it("should create a new traceparent and store it in the store if no traceparent header was provided", () => {
    const req = { header: () => {} };

    // @ts-expect-error - We don't need the full Express Request object
    middleware(req, {}, () => {
      const traceparent = getStore().traceparent || "";
      expect(new RegExp(/^[\da-f-]{55}$/).test(traceparent)).to.equal(true);
    });
  });

  it("should return an empty object if the middleware is not used", () => {
    expect(getStore()).to.deep.equal({});
  });
});
