import type { RequestHandler } from "express";
import { AsyncLocalStorage } from "node:async_hooks";
import { createTraceparent } from "./traceparent";

type Store = {
  traceparent?: string;
  clientServiceAccount?: string;
  [key: string]: unknown;
};

const storage = new AsyncLocalStorage<Store>();

export const middleware: RequestHandler = (req, _res, next) => {
  const traceparent = req.header("traceparent") || createTraceparent();

  storage.run({ traceparent }, () => {
    next();
  });
};

export function getStore() {
  return storage.getStore() || {};
}
