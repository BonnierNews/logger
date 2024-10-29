# @bonniernews/logger

## Usage

```js
import {
  fetchGcpProjectId,
  getHttpTraceHeader,
  getLoggingTraceData,
  middleware,
} from "@bonniernews/bn-log-tracer";
import express from "express";
import pino from "pino";

const logger = pino({ mixin: getLoggingTraceData });
const app = express();

app.use(middleware);

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
