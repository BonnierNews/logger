import nock from "nock";
import { before } from "node:test";

import { attachTrace } from "../../lib/attach-trace";
import { GCP_METADATA_URL } from "../../lib/gcp";
import { logger as buildLogger } from "../../lib/logging";

const logs: Record<string, unknown>[] = [];
const stream = { write: (data: string) => logs.push(JSON.parse(data)) };

const logger = buildLogger({}, stream);

const traceId = "0af7651916cd43dd8448eb211c80319c";
const spanId = "b7ad6b7169203331";
const traceparent = `00-${traceId}-${spanId}-01`;

Feature("Logging with tracing", () => {
  before(nock.disableNetConnect);

  afterEachScenario(() => {
    logs.length = 0;
  });

  Scenario("Logging in the attachTrace context", () => {
    Given("we can fetch the GCP project ID from the metadata server", () => {
      nock(GCP_METADATA_URL).get("").reply(200, "test-project");
    });

    When("logging in the executed function context", async () => {
      const runWithTrace = await attachTrace((param) => {
        logger.info(`test ${param}`);
      }, traceparent);
      await runWithTrace(1);
    });

    Then("trace data should be logged", () => {
      expect(logs.length).to.equal(1);
      expect(logs[0]).to.deep.include({
        message: "test 1",
        traceId,
        spanId,
        "logging.googleapis.com/trace": `projects/test-project/traces/${traceId}`,
        "logging.googleapis.com/spanId": spanId,
        "logging.googleapis.com/trace_sampled": true,
      });
    });
  });

  Scenario("Logging in the attachTrace async context", () => {
    Given("we can fetch the GCP project ID from the metadata server", () => {
      nock(GCP_METADATA_URL).get("").reply(200, "test-project");
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
      const runWithTrace = await attachTrace(f, traceparent);
      await runWithTrace();
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

  Scenario("attackTrace to a function and run multiple times with different parameters", () => {
    Given("we can fetch the GCP project ID from the metadata server", () => {
      nock(GCP_METADATA_URL).get("").reply(200, "test-project");
    });

    When("logging in the executed function context", async () => {
      const runWithTrace = await attachTrace((param) => {
        logger.info(`test ${param}`);
      }, traceparent);
      await runWithTrace(1);
      await runWithTrace(2);
      await runWithTrace(3);
    });

    Then("trace data should be logged", () => {
      expect(logs.length).to.equal(3);
      expect(logs[0]).to.deep.include({
        message: "test 1",
        traceId,
        spanId,
        "logging.googleapis.com/trace": `projects/test-project/traces/${traceId}`,
        "logging.googleapis.com/spanId": spanId,
        "logging.googleapis.com/trace_sampled": true,
      });
      expect(logs[1]).to.deep.include({
        message: "test 2",
        traceId,
        spanId,
        "logging.googleapis.com/trace": `projects/test-project/traces/${traceId}`,
        "logging.googleapis.com/spanId": spanId,
        "logging.googleapis.com/trace_sampled": true,
      });
      expect(logs[2]).to.deep.include({
        message: "test 3",
        traceId,
        spanId,
        "logging.googleapis.com/trace": `projects/test-project/traces/${traceId}`,
        "logging.googleapis.com/spanId": spanId,
        "logging.googleapis.com/trace_sampled": true,
      });
    });
  });

  Scenario("Function being called within attachTraceHandler throws error", () => {
    Given("we can fetch the GCP project ID from the metadata server", () => {
      nock(GCP_METADATA_URL).get("").reply(200, "test-project");
    });

    let g: any, f: any;

    And("we have two async functions that logs independently", () => {
      g = () =>
        new Promise((_, reject) => {
          reject(new Error("Something went wrong!"));
        });
      f = async function () {
        await g();
        logger.info("test");
        return true;
      };
    });

    When("handler throws if function attached to throws", async () => {
      const runWithTrace = await attachTrace(f);
      try {
        await runWithTrace();
      } catch (error) {
        expect(error).to.be.an("Error");
      }
    });
  });
});
