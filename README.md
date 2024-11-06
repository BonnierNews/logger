# @bonniernews/logger

Bonnier News logger library, that makes it easier to unify logging. It is pre-configured for GCP and includes tracing capabilities for Express servers.

```sh
npm install @bonniernews/logger
```

## Usage

Here is an example server with log tracing enabled.

```js
import {
  fetchGcpProjectId,
  getHttpTraceHeader,
  middleware,
  logger as BNLogger
} from "@bonniernews/logger";
import express from "express";

const logger = BNLogger();
const app = express();

app.use(middleware());

// Fetches the project ID from the GCP metadata server in the background on startup.
// This is only necessary if you don't set the `GCP_PROJECT` environment variable.
fetchGcpProjectId();

app.get("/", async (req, res) => {
  logger.info("Hello, world!");

  const response = await fetch("https://some.service.bn.nr/some/endpoint", {
    headers: { ...getHttpTraceHeader() },
  });

  ...
});
```

### Logger Interface

#### Options

This library uses the [Pino logger](https://github.com/pinojs/pino), and instances are created using the same options. In most cases this is not needed, and you can use the defaults:

- Uses `info` as the minimum log level
- JSON logging with `severity` and `message` fields for non-local environments - in line with [GCP structured logging](https://cloud.google.com/logging/docs/structured-logging) standards
- Pretty logging enabled for local development and test environments

#### Log Levels

The logger has the following levels, with their corresponding GCP `severity` mapping:

| Log level | GCP severity |
| --------- | ------------ |
| `trace`   | `DEBUG`      |
| `debug`   | `DEBUG`      |
| `info`    | `INFO`       |
| `warn`    | `WARNING`    |
| `error`   | `ERROR`      |
| `fatal`   | `CRITICAL`   |

#### Log messages

Here are a few examples on how to use the logger:

```js
import { logger } from "@bonniernews/logger";

const log = logger({ level: "debug" });

log.debug("This is just a message");

log.info("This is how to use %s strings: %d", "template", 123);

log.info({ any: { additional: "data" } }, "I'm attaching relevant data");

const error = new Error("Oops!");

// This will set error.message as the log message,
// and add a serialized error object under the `err` key:
log.warn(error);

// The `err` key is special, and triggers error serialization:
log.error({ err: error }, "This message takes precedence over err.message");
```

#### Tracing

If you want to decorate logs with tracing fields for incoming requests, use the library's `middleware`, which will use Node async hooks to store and decorate all logs using the [standardized](https://www.w3.org/TR/trace-context/) `traceparent` header.
