import gcpMetaData from "gcp-metadata";
import pino from "pino";
import { createSandbox } from "sinon";
import { fetchGcpProjectId, reset } from "../../lib/gcp";
import { getLoggingTraceData } from "../../lib/logging";
import { middleware } from "../../lib/middleware";

const logs: string[] = [];
const stream = {
  write: (data: string) => logs.push(data),
};
const logger = pino({ mixin: getLoggingTraceData }, stream);

const sandbox = createSandbox();

const traceId = "0af7651916cd43dd8448eb211c80319c";
const spanId = "b7ad6b7169203331";
const traceparent = `00-${traceId}-${spanId}-01`;

Feature("Logging", () => {
  afterEachScenario(() => {
    logs.length = 0;
    sandbox.restore();
    reset();
  });

  Scenario("Logging in the middleware context", () => {
    Given("we can fetch the GCP project ID from the metadata server", async () => {
      sandbox.stub(gcpMetaData, "isAvailable").resolves(true);
      sandbox.stub(gcpMetaData, "project").resolves("test-project");
      await fetchGcpProjectId();
    });

    When("logging in the middleware context", () => {
      // @ts-expect-error - We don't need the full Express Request object
      middleware({ header: () => traceparent }, {}, () => {
        logger.info("test");
      });
    });

    Then("trace data should be logged", () => {
      expect(logs.length).to.equal(1);
      const log = JSON.parse(logs[0]);
      expect(log).to.deep.include({
        msg: "test",
        traceId,
        spanId,
        "logging.googleapis.com/trace": `projects/test-project/traces/${traceId}`,
        "logging.googleapis.com/spanId": spanId,
        "logging.googleapis.com/trace_sampled": true,
      });
    });
  });

  Scenario("Logging in the middleware context, but without traceparent header", () => {
    Given("we can fetch the GCP project ID from the metadata server", async () => {
      sandbox.stub(gcpMetaData, "isAvailable").resolves(true);
      sandbox.stub(gcpMetaData, "project").resolves("test-project");
      await fetchGcpProjectId();
    });

    When("logging in the middleware context", () => {
      // @ts-expect-error - We don't need the full Express Request object
      middleware({ header: () => "" }, {}, () => {
        logger.info("test");
      });
    });

    Then("no trace data should be logged", () => {
      expect(logs.length).to.equal(1);
      const log = JSON.parse(logs[0]);
      expect(log).to.deep.include({ msg: "test" });
      expect(log).not.to.have.all.keys([
        "traceId",
        "spanId",
        "logging.googleapis.com/trace",
        "logging.googleapis.com/spanId",
        "logging.googleapis.com/trace_sampled",
      ]);
    });
  });

  Scenario("Logging in the middleware context, but with invalid traceparent header", () => {
    Given("we can fetch the GCP project ID from the metadata server", async () => {
      sandbox.stub(gcpMetaData, "isAvailable").resolves(true);
      sandbox.stub(gcpMetaData, "project").resolves("test-project");
      await fetchGcpProjectId();
    });

    When("logging in the middleware context", () => {
      // @ts-expect-error - We don't need the full Express Request object
      middleware({ header: () => "foo" }, {}, () => {
        logger.info("test");
      });
    });

    Then("no trace data should be logged", () => {
      expect(logs.length).to.equal(1);
      const log = JSON.parse(logs[0]);
      expect(log).to.deep.include({ msg: "test" });
      expect(log).not.to.have.all.keys([
        "traceId",
        "spanId",
        "logging.googleapis.com/trace",
        "logging.googleapis.com/spanId",
        "logging.googleapis.com/trace_sampled",
      ]);
    });
  });

  Scenario("Logging outside of the middleware context", () => {
    When("logging outside the middleware context", () => {
      logger.info("test");
    });

    Then("no trace data should be logged", () => {
      expect(logs.length).to.equal(1);
      const log = JSON.parse(logs[0]);
      expect(log).to.deep.include({ msg: "test" });
      expect(log).not.to.have.all.keys([
        "traceId",
        "spanId",
        "logging.googleapis.com/trace",
        "logging.googleapis.com/spanId",
        "logging.googleapis.com/trace_sampled",
      ]);
    });
  });

  Scenario("Logging in the middleware context, without metadata server", () => {
    Given("we can't fetch the GCP project ID from the metadata server", async () => {
      sandbox.stub(gcpMetaData, "isAvailable").resolves(false);
      await fetchGcpProjectId();
    });

    When("logging in the middleware context", () => {
      // @ts-expect-error - We don't need the full Express Request object
      middleware({ header: () => traceparent }, {}, () => {
        logger.info("test");
      });
    });

    Then("trace data should be logged", () => {
      expect(logs.length).to.equal(1);
      const log = JSON.parse(logs[0]);
      expect(log).to.deep.include({ msg: "test" });
      expect(log).not.to.have.all.keys([
        "traceId",
        "spanId",
        "logging.googleapis.com/trace",
        "logging.googleapis.com/spanId",
        "logging.googleapis.com/trace_sampled",
      ]);
    });
  });
});
