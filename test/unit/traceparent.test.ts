import { getTraceFromTraceparent } from "../../lib/traceparent";

describe("Traceparent parsing", () => {
  it("should parse a traceparent header correctly", () => {
    const traceparent = "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01";

    const trace = getTraceFromTraceparent(traceparent);

    expect(trace).to.deep.equal({
      traceId: "0af7651916cd43dd8448eb211c80319c",
      parentId: "b7ad6b7169203331",
      isSampled: true,
    });
  });

  it("should return undefined if the traceparent header is invalid", () => {
    const traceparent = "invalid";

    const trace = getTraceFromTraceparent(traceparent);

    expect(trace).to.equal(undefined);
  });
});
