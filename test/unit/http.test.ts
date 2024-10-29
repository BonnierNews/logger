import { getHttpTraceHeader } from "../../lib/http";
import { middleware } from "../../lib/middleware";

describe("HTTP helper", () => {
  it("should get the traceparent header from the middleware context", () => {
    const traceparent = "00-abcdef0123456789abcdef0123456789-abcdef0123456789-01";

    // @ts-expect-error - We don't need the full Express Request object
    middleware({ header: () => traceparent }, {}, () => {
      expect(getHttpTraceHeader()).to.deep.equal({ traceparent });
    });
  });

  it("should return an empty object if run outside the middleware context", () => {
    expect(getHttpTraceHeader()).to.deep.equal({});
  });
});
