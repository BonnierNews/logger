/**
 * In this example, we also extract and log the service account header from a Google IAP
 * (see https://cloud.google.com/iap/docs/identity-howto), so that we can trace each request
 * to which service it came from.
 */

import { logger as buildLogger, middleware } from "@bonniernews/logger";
import express from "express";

const logger = buildLogger();
const app = express();

app.use(
  middleware({ extractRequestData: (req) => ({ clientServiceAccount: req.headers["x-goog-authenticated-user-email"] }) })
);

app.get("/", (req, res) => {
  logger.info("Hello, world!"); // This will also log clientServiceAccount if the IAP header is present in the request
  res.status(200).send();
});
