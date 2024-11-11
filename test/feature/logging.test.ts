import type { RequestHandler } from "express";
import gcpMetaData from "gcp-metadata";
import { createSandbox } from "sinon";
import { logger as BNLogger, decorateLogs, Logger } from "../../lib/logging";
import { middleware as createMiddleware } from "../../lib/middleware";

const logs: Record<string, unknown>[] = [];
const stream = { write: (data: string) => logs.push(JSON.parse(data)) };

const logger = BNLogger({}, stream);

const sandbox = createSandbox();

const traceId = "0af7651916cd43dd8448eb211c80319c";
const spanId = "b7ad6b7169203331";
const traceparent = `00-${traceId}-${spanId}-01`;

Feature("Logging with tracing", () => {
  let middleware: RequestHandler = createMiddleware();

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
      // @ts-expect-error - We don't need the full Express Request object
      await middleware({ header: () => traceparent }, {}, () => {
        logger.info("test");
      });
    });

    Then("trace data should be logged", () => {
      expect(logs.length).to.equal(1);
      expect(logs[0]).to.deep.include({
        message: "test",
        traceId,
        "logging.googleapis.com/trace": `projects/test-project/traces/${traceId}`,
        "logging.googleapis.com/spanId": spanId,
        "logging.googleapis.com/trace_sampled": true,
      });
    });
  });

  Scenario("Logging in the middleware context, but without traceparent header", () => {
    Given("we can fetch the GCP project ID from the metadata server", () => {
      sandbox.stub(gcpMetaData, "isAvailable").resolves(true);
      sandbox.stub(gcpMetaData, "project").resolves("test-project");
    });

    When("logging in the middleware context", async () => {
      // @ts-expect-error - We don't need the full Express Request object
      await middleware({ header: () => "" }, {}, () => {
        logger.info("test");
      });
    });

    Then("a trace should be automatically generated, and trace data should be logged", () => {
      expect(logs.length).to.equal(1);
      expect(logs[0]).to.deep.include({ message: "test" });
      expect(logs[0]).to.include.all.keys([
        "traceId",
        "logging.googleapis.com/trace",
        "logging.googleapis.com/spanId",
        "logging.googleapis.com/trace_sampled",
      ]);
    });
  });

  Scenario("Logging in the middleware context, but with invalid traceparent header", () => {
    Given("we can fetch the GCP project ID from the metadata server", () => {
      sandbox.stub(gcpMetaData, "isAvailable").resolves(true);
      sandbox.stub(gcpMetaData, "project").resolves("test-project");
    });

    When("logging in the middleware context", async () => {
      // @ts-expect-error - We don't need the full Express Request object
      await middleware({ header: () => "foo" }, {}, () => {
        logger.info("test");
      });
    });

    Then("no trace data should be logged", () => {
      expect(logs.length).to.equal(1);
      expect(logs[0]).to.deep.include({ message: "test" });
      expect(logs[0]).to.not.have.any.keys([
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
      expect(logs[0]).to.not.have.any.keys([
        "traceId",
        "spanId",
        "logging.googleapis.com/trace",
        "logging.googleapis.com/spanId",
        "logging.googleapis.com/trace_sampled",
      ]);
    });
  });

  Scenario("Logging in the middleware context, without metadata server", () => {
    Given("we can't fetch the GCP project ID from the metadata server", () => {
      sandbox.stub(gcpMetaData, "isAvailable").resolves(false);
    });

    When("logging in the middleware context", async () => {
      // @ts-expect-error - We don't need the full Express Request object
      await middleware({ header: () => traceparent }, {}, () => {
        logger.info("test");
      });
    });

    Then("trace data should be logged", () => {
      expect(logs.length).to.equal(1);
      expect(logs[0]).to.deep.include({ message: "test" });
      expect(logs[0]).to.include.all.keys(["traceId", "spanId"]);
      expect(logs[0]).to.not.have.any.keys([
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
  let middleware: RequestHandler = createMiddleware();

  afterEachScenario(() => {
    logs.length = 0;
    sandbox.restore();
    middleware = createMiddleware();
  });

  Scenario("Logging with custom mixin", () => {
    let localLogger: Logger;
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
    let localLogger: Logger;
    Given("a logger with a custom mixin", () => {
      localLogger = BNLogger({ mixin: () => ({ foo: "bar" }) }, stream);
    });

    And("we can fetch the GCP project ID from the metadata server", async () => {
      sandbox.stub(gcpMetaData, "isAvailable").resolves(true);
      sandbox.stub(gcpMetaData, "project").resolves("test-project");
    });

    When("logging in the middleware context", async () => {
      // @ts-expect-error - We don't need the full Express Request object
      await middleware({ header: () => traceparent }, {}, () => {
        localLogger.info("test");
      });
    });

    Then("custom mixin data should be merged with trace data and logged", () => {
      expect(logs.length).to.equal(1);
      expect(logs[0]).to.deep.include({
        message: "test",
        foo: "bar",
        traceId,
        "logging.googleapis.com/trace": `projects/test-project/traces/${traceId}`,
        "logging.googleapis.com/spanId": spanId,
        "logging.googleapis.com/trace_sampled": true,
      });
    });
  });

  Scenario("Logging with `formatLog`", () => {
    let localLogger: Logger;
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

Feature("Decorating logs", () => {
  afterEachScenario(() => {
    logs.length = 0;
    sandbox.restore();
  });

  Scenario("Decorate logs with improper initialization", () => {
    Given("Middleware has not been initialized", () => {
      // noop
    });

    Then("decorateLogs throws an error on use", () => {
      expect(() => decorateLogs({ key: "value" })).to.throw();
    });
  });

  Scenario("Decorated fields are tied to request scope", () => {
    const middleware: RequestHandler = createMiddleware();
    let logger: Logger;

    Given("a logger", () => {
      logger = BNLogger({}, stream);
    });

    When("using the logger in different contexts", async () => {
      await new Promise<void>((resolve) => {
        // @ts-expect-error - We don't need the full Express Request object
        middleware({ header: () => "" }, {}, () => {
          decorateLogs({ one: "one", two: "two" });

          logger.info("Request context");
          resolve();
        });
      });

      logger.info("No context");
    });

    Then("The log contains the decorated", () => {
      expect(logs.length).to.equal(2);
      expect(logs[0]).to.deep.include({
        message: "Request context",
        one: "one",
        two: "two",
      });
    });

    And("The log outside request context is without those fields", () => {
      expect(logs.length).to.equal(2);
      expect(logs[1]).to.deep.include({ message: "No context" });
      expect(logs[1]).to.not.have.any.keys(["one", "two"]);
    });
  });
});
