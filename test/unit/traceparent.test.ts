import { getTraceFromTraceparent, isSampled } from "../../lib/traceparent";

describe("Traceparent parsing", () => {
  it("should parse a traceparent header correctly", async () => {
    const traceparent = "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01";

    const trace = getTraceFromTraceparent(traceparent);

    expect(trace).to.deep.equal({
      traceId: "0af7651916cd43dd8448eb211c80319c",
      parentId: "b7ad6b7169203331",
      isSampled: true,
    });
  });

  it("should return undefined if the traceparent header is invalid", async () => {
    const traceparent = "invalid";

    const trace = getTraceFromTraceparent(traceparent);

    expect(trace).to.equal(undefined);
  });

  describe('isSampled', () => { 
    [
      { input: "00", expected: false },
      { input: "01", expected: true },
      { input: "02", expected: false },
      { input: "03", expected: true },
      { input: "ff", expected: true },
    ].forEach(({ input, expected }) => {
      it(`Should calculate isSampled("${input}") as ${expected}`, () => {
        expect(isSampled(input)).to.equal(expected);
      });
    });
   })
});
