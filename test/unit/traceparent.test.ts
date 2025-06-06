import { describe, it } from "node:test";

import { createTraceparent, getTraceFromTraceparent } from "../../lib/traceparent";

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

  describe("isSampled", () => {
    [
      { input: "00", expected: false },
      { input: "01", expected: true },
      { input: "02", expected: false },
      { input: "03", expected: true },
      { input: "ff", expected: true },
      { input: "bar", expected: false },
    ].forEach(({ input, expected }) => {
      it(`Should calculate trace-flags "${input}" as isSampled: ${expected}`, () => {
        const traceparent = `00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-${input}`;
        expect(getTraceFromTraceparent(traceparent)?.isSampled).to.equal(expected);
      });
    });
  });
});

describe("Traceparent creation", () => {
  it("should create a traceparent header correctly", () => {
    const traceparent = createTraceparent();
    const [ version, traceId, parentId, isSampled ] = traceparent.split("-");

    expect(version).to.equal("00"); // we only support version 00
    expect(isSampled).to.equal("00"); // default is not sampled

    expect(new RegExp(/^[\da-f]{2}$/).test(version)).to.equal(true, version);
    expect(new RegExp(/^[\da-f]{32}$/).test(traceId)).to.equal(true, traceId);
    expect(new RegExp(/^[\da-f]{16}$/).test(parentId)).to.equal(true, parentId);
    expect(new RegExp(/^[\da-f]{2}$/).test(isSampled)).to.equal(true, isSampled);
  });

  it("Sets flags if passed isSampled true", () => {
    const traceparent = createTraceparent(true);
    const [ , , , isSampled ] = traceparent.split("-");

    expect(isSampled).to.equal("01");
  });
});
