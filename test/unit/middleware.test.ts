import { getStore, middleware } from "../../lib/middleware";

describe("Express middleware", () => {
  it("should store the traceparent header in the store", () => {
    const traceparent = "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01";
    const req = { headers: { traceparent } };

    // @ts-expect-error - We don't need the full Express Request object
    middleware()(req, {}, () => {
      expect(getStore().traceparent).to.equal(traceparent);
    });
  });

  it("should return an empty object if the middleware is not used", () => {
    expect(getStore()).to.deep.equal({});
  });

  it("should extract other header info along with the traceparent header to the store", () => {
    const traceparent = "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01";
    const req = { headers: { traceparent, foo: "bar", dontIncludeMe: "baz" } };

    // @ts-expect-error - We don't need the full Express Request object
    middleware({ extractRequestData: ({ headers }) => ({ foo: headers.foo }) })(req, {}, () => {
      expect(getStore()).to.deep.equal({ traceparent, foo: "bar" });
    });
  });
});
