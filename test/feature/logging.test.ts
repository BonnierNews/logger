import gcpMetaData from "gcp-metadata";
import pino from "pino";
import { createSandbox } from "sinon";
import { fetchGcpProjectId, reset } from "../../lib/gcp";
import { logger as BNLogger } from "../../lib/logging";
import { middleware } from "../../lib/middleware";

const logs: Record<string, unknown>[] = [];
const stream = { write: (data: string) => logs.push(JSON.parse(data)) };

const logger = BNLogger({}, stream);

const sandbox = createSandbox();

const traceId = "0af7651916cd43dd8448eb211c80319c";
const spanId = "b7ad6b7169203331";
const traceparent = `00-${traceId}-${spanId}-01`;

Feature("Logging with tracing", () => {
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
      expect(logs[0]).to.deep.include({ message: "test" });
      expect(logs[0]).not.to.have.all.keys([
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
      expect(logs[0]).to.deep.include({ message: "test" });
      expect(logs[0]).not.to.have.all.keys([
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
      expect(logs[0]).to.deep.include({ message: "test" });
      expect(logs[0]).not.to.have.all.keys([
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
      expect(logs[0]).to.deep.include({ message: "test" });
      expect(logs[0]).not.to.have.all.keys([
        "traceId",
        "spanId",
        "logging.googleapis.com/trace",
        "logging.googleapis.com/spanId",
        "logging.googleapis.com/trace_sampled",
      ]);
    });
  });
});

Feature("GCP logging severities", () => {
  afterEachScenario(() => {
    logs.length = 0;
  });

  Scenario("Logging at info level", () => {
    When("logging at info level", () => {
      logger.info("test");
    });

    Then("the GCP severity should be INFO", () => {
      expect(logs.length).to.equal(1);
      expect(logs[0]).to.deep.include({
        message: "test",
        severity: "INFO",
      });
    });
  });

  Scenario("Logging at fatal level", () => {
    When("logging at fatal level", () => {
      logger.fatal("test");
    });

    Then("the GCP severity should be CRITICAL", () => {
      expect(logs.length).to.equal(1);
      expect(logs[0]).to.deep.include({
        message: "test",
        severity: "CRITICAL",
      });
    });
  });
});

Feature("Logging options", () => {
  afterEachScenario(() => {
    logs.length = 0;
    sandbox.restore();
    reset();
  });

  Scenario("Logging with custom mixin", () => {
    let localLogger: pino.Logger;
    Given("a logger with a custom mixin", () => {
      localLogger = BNLogger({ mixin: () => ({ foo: "bar" }) }, stream);
    });

    When("logging", () => {
      localLogger.info("test");
    });

    Then("custom mixin data should be logged", () => {
      expect(logs.length).to.equal(1);
      expect(logs[0]).to.deep.include({
        message: "test",
        foo: "bar",
      });
    });
  });

  Scenario("Logging with custom mixin and trace context", () => {
    let localLogger: pino.Logger;
    Given("a logger with a custom mixin", () => {
      localLogger = BNLogger({ mixin: () => ({ foo: "bar" }) }, stream);
    });

    And("we can fetch the GCP project ID from the metadata server", async () => {
      sandbox.stub(gcpMetaData, "isAvailable").resolves(true);
      sandbox.stub(gcpMetaData, "project").resolves("test-project");
      await fetchGcpProjectId();
    });

    When("logging in the middleware context", () => {
      // @ts-expect-error - We don't need the full Express Request object
      middleware({ header: () => traceparent }, {}, () => {
        localLogger.info("test");
      });
    });

    Then("custom mixin data should be merged with trace data and logged", () => {
      expect(logs.length).to.equal(1);
      expect(logs[0]).to.deep.include({
        message: "test",
        foo: "bar",
        traceId,
        spanId,
        "logging.googleapis.com/trace": `projects/test-project/traces/${traceId}`,
        "logging.googleapis.com/spanId": spanId,
        "logging.googleapis.com/trace_sampled": true,
      });
    });
  });

  Scenario("Logging with `formatLog`", () => {
    let localLogger: pino.Logger;
    Given("a logger with a custom mixin", () => {
      localLogger = BNLogger(
        {
          formatLog: (obj) => {
            return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key.toUpperCase(), value]));
          },
        },
        stream
      );
    });

    When("logging", () => {
      localLogger.info({ foo: "bar" }, "test");
    });

    Then("the formatter should be used", () => {
      expect(logs.length).to.equal(1);
      expect(logs[0]).to.deep.include({
        FOO: "bar",
      });
    });
  });
});
