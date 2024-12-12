import gcpMetaData from "gcp-metadata";
import { createSandbox } from "sinon";

import { logger as buildLogger } from "../../lib/logging";
import { attachTraceHandler } from "../../lib/middleware";

const logs: Record<string, unknown>[] = [];
const stream = { write: (data: string) => logs.push(JSON.parse(data)) };

const logger = buildLogger({}, stream);

const sandbox = createSandbox();

const traceId = "0af7651916cd43dd8448eb211c80319c";
const spanId = "b7ad6b7169203331";
const traceparent = `00-${traceId}-${spanId}-01`;

Feature("Logging with tracing", () => {
  afterEachScenario(() => {
    logs.length = 0;
    sandbox.restore();
  });

  Scenario("Logging in the attachTraceHandler context", () => {
    Given("we can fetch the GCP project ID from the metadata server", () => {
      sandbox.stub(gcpMetaData, "isAvailable").resolves(true);
      sandbox.stub(gcpMetaData, "project").resolves("test-project");
    });

    When("logging in the executed function context", async () => {
      await attachTraceHandler(() => {
        logger.info("test");
      }, traceparent);
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

  Scenario("Logging in the attachTraceHandler async context", () => {
    Given("we can fetch the GCP project ID from the metadata server", () => {
      sandbox.stub(gcpMetaData, "isAvailable").resolves(true);
      sandbox.stub(gcpMetaData, "project").resolves("test-project");
    });

    let g: any, f: any;

    And("we have two async functions that logs independently", () => {
      g = () => new Promise((resolve) => resolve(logger.info("test")));
      f = async function () {
        await g();
        logger.info("test2");
        return true;
      };
    });

    When("logging in the executed function context", async () => {
      await attachTraceHandler(f, traceparent);
    });

    Then("we should have two logs with same traceId", () => {
      expect(logs.length).to.equal(2);
      expect(logs[0]).to.deep.include({
        message: "test",
        traceId,
        spanId,
        "logging.googleapis.com/trace": `projects/test-project/traces/${traceId}`,
        "logging.googleapis.com/spanId": spanId,
        "logging.googleapis.com/trace_sampled": true,
      });

      expect(logs[1]).to.deep.include({
        message: "test2",
        traceId,
        spanId,
        "logging.googleapis.com/trace": `projects/test-project/traces/${traceId}`,
        "logging.googleapis.com/spanId": spanId,
        "logging.googleapis.com/trace_sampled": true,
      });
    });
  });

  //   Scenario("Function being called within attachTraceHandler throws error", () => {
  //     Given("we can fetch the GCP project ID from the metadata server", () => {
  //       sandbox.stub(gcpMetaData, "isAvailable").resolves(true);
  //       sandbox.stub(gcpMetaData, "project").resolves("test-project");
  //     });

  //     let g: any, f: any;

  //     And("we have two async functions that logs independently", () => {
  //       g = () => new Promise(() => {
  //         throw new Error();
  //       });
  //       f = async function () {
  //         await g();
  //         logger.info("test");
  //         return true;
  //       };
  //     });

  //     When("handler throws if function attached to throws", async () => {
  //       expect(await attachTraceHandler(f)).to.throw();
  //     });
  //   });

});
