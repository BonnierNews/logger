import gcpMetaData from "gcp-metadata";
import { createSandbox } from "sinon";
import { NextRequest } from "next/server";

import { logger as buildLogger } from "../../lib/logging";
import { nextMiddleware as createMiddleware, NextRequestHandler } from "../../lib/middleware";

const logs: Record<string, unknown>[] = [];
const stream = { write: (data: string) => logs.push(JSON.parse(data)) };

const logger = buildLogger({}, stream);

const sandbox = createSandbox();

const traceId = "0af7651916cd43dd8448eb211c80319c";
const spanId = "b7ad6b7169203331";
const traceparent = `00-${traceId}-${spanId}-01`;

Feature("Logging with tracing", () => {
  let middleware: NextRequestHandler = createMiddleware();

  afterEachScenario(() => {
    logs.length = 0;
    sandbox.restore();
    middleware = createMiddleware();
  });

  Scenario("Logging in the middleware context", () => {
    Given("we can fetch the GCP project ID from the metadata server", () => {
      sandbox.stub(gcpMetaData, "isAvailable").resolves(true);
      sandbox.stub(gcpMetaData, "project").resolves("test-project");
    });

    When("logging in the middleware context", async () => {
      const request = new NextRequest("https://www.google.com", { headers: { traceparent } });

      await middleware(request, () => {
        logger.info("test");
      });
    });

    Then("trace data should be logged", () => {
      expect(logs.length).to.equal(1);
      expect(logs[0]).to.deep.include({
        message: "test",
        traceId,
        spanId,
        "logging.googleapis.com/trace": `projects/test-project/traces/${traceId}`,
        "logging.googleapis.com/spanId": spanId,
        "logging.googleapis.com/trace_sampled": true,
      });
    });
  });

  // Scenario("Logging in the middleware context, but without traceparent header", () => {
  //   Given("we can fetch the GCP project ID from the metadata server", () => {
  //     sandbox.stub(gcpMetaData, "isAvailable").resolves(true);
  //     sandbox.stub(gcpMetaData, "project").resolves("test-project");
  //   });

  //   When("logging in the middleware context", async () => {
  //     // @ts-expect-error - We don't need the full Express Request object
  //     await middleware({ header: () => "" }, {}, () => {
  //       logger.info("test");
  //     });
  //   });

  //   Then("a trace should be automatically generated, and trace data should be logged", () => {
  //     expect(logs.length).to.equal(1);
  //     expect(logs[0]).to.deep.include({ message: "test" });
  //     expect(logs[0]).to.include.all.keys([
  //       "traceId",
  //       "spanId",
  //       "logging.googleapis.com/trace",
  //       "logging.googleapis.com/spanId",
  //       "logging.googleapis.com/trace_sampled",
  //     ]);
  //   });
  // });

  // Scenario("Logging in the middleware context, but with invalid traceparent header", () => {
  //   Given("we can fetch the GCP project ID from the metadata server", () => {
  //     sandbox.stub(gcpMetaData, "isAvailable").resolves(true);
  //     sandbox.stub(gcpMetaData, "project").resolves("test-project");
  //   });

  //   When("logging in the middleware context", async () => {
  //     // @ts-expect-error - We don't need the full Express Request object
  //     await middleware({ header: () => "foo" }, {}, () => {
  //       logger.info("test");
  //     });
  //   });

  //   Then("no trace data should be logged", () => {
  //     expect(logs.length).to.equal(1);
  //     expect(logs[0]).to.deep.include({ message: "test" });
  //     expect(logs[0]).to.not.have.any.keys([
  //       "traceId",
  //       "spanId",
  //       "logging.googleapis.com/trace",
  //       "logging.googleapis.com/spanId",
  //       "logging.googleapis.com/trace_sampled",
  //     ]);
  //   });
  // });

  // Scenario("Logging outside of the middleware context", () => {
  //   When("logging outside the middleware context", () => {
  //     logger.info("test");
  //   });

  //   Then("no trace data should be logged", () => {
  //     expect(logs.length).to.equal(1);
  //     expect(logs[0]).to.deep.include({ message: "test" });
  //     expect(logs[0]).to.not.have.any.keys([
  //       "traceId",
  //       "spanId",
  //       "logging.googleapis.com/trace",
  //       "logging.googleapis.com/spanId",
  //       "logging.googleapis.com/trace_sampled",
  //     ]);
  //   });
  // });

  // Scenario("Logging in the middleware context, without metadata server", () => {
  //   Given("we can't fetch the GCP project ID from the metadata server", () => {
  //     sandbox.stub(gcpMetaData, "isAvailable").resolves(false);
  //   });

  //   When("logging in the middleware context", async () => {
  //     // @ts-expect-error - We don't need the full Express Request object
  //     await middleware({ header: () => traceparent }, {}, () => {
  //       logger.info("test");
  //     });
  //   });

  //   Then("trace data should be logged", () => {
  //     expect(logs.length).to.equal(1);
  //     expect(logs[0]).to.deep.include({ message: "test" });
  //     expect(logs[0]).to.include.all.keys([ "traceId", "spanId" ]);
  //     expect(logs[0]).to.not.have.any.keys([
  //       "logging.googleapis.com/trace",
  //       "logging.googleapis.com/spanId",
  //       "logging.googleapis.com/trace_sampled",
  //     ]);
  //   });
  // });
});
