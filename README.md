# @bonniernews/logger

Bonnier News logger library, that makes it easier to unify logging. It is pre-configured for GCP and includes tracing capabilities for Express servers.

```sh
npm install @bonniernews/logger
```

## Usage

Here is an example server with log tracing enabled.

```js
import {
  getTraceparent,
  middleware,
  logger as buildLogger
} from "@bonniernews/logger";
import express from "express";

const logger = buildLogger();
const app = express();

// This middleware will create a request context and
// automatically decorate all logs with tracing data:
app.use(middleware());

app.get("/", async (req, res) => {
  logger.info("Hello, world!");

  // Propagate traceparent to other services
  const response = await fetch("https://some.other.service.bn.nr/some/endpoint", {
    headers: { traceparent: getTraceparent() },
  });

  ...
});
```

The `middleware` should be put as early as possible, since only logs after this middleware will get the tracing data. The middleware will lookup the active project ID from GCP. Alternatively, you can set the `GCP_PROJECT` environment variable for this purpose.

Use the `getTraceparent` function to pass tracing headers to downstream services.
Use `getTraceId` if you only want to know the current trace-id.

If you want to decorate logs with custom data, use the exported `decorateLogs` function. In order to use this, the middleware needs to be installed first.

### attachTraceHandler

If you have a separate script or function, without using an express middleware, where you want to use the logging lib you can use attachTraceHandler

Example

```js
import { getTraceId } from "@bonniernews/logger";

const g = () => new Promise((resolve) => resolve(getTraceId()));
const f = async function () {
  const output = [];
  output.push(getTraceId());
  const a = await g();
  output.push(a);
  return output;
};

const result = await attachTraceHandler(f);
```

## Interface

The library have these named exports:

- `logger`: Used to create a logger, see [below](#logger).
- `middleware`: A middleware to install a request context store that is used to decorate logs with automatic tracing. This middleware enables the use of `decorateLogs`, `getLoggingData`, `getTraceparent` and `getTraceId`.
- `decorateLogs`: Function to add data to the request context.
- `getLoggingData`: Returns decorated data fields together with trace information.
- `getTraceparent`: Returns traceparent header value - to be used for requests to downstream services.
- `getTraceId`: Returns the traceId value - useful if you want to add it to an API error response.
- `createTraceparent`: Utility function to generate a traceparent header value.

### Logger

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
