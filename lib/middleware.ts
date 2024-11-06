import type { RequestHandler } from "express";
import { AsyncLocalStorage } from "node:async_hooks";

type Store = {
  traceparent?: string;
  [key: string]: unknown;
};

const storage = new AsyncLocalStorage<Store>();

export const middleware: RequestHandler = (req, _res, next) => {
  const traceparent = req.header("traceparent");

  storage.run({ traceparent }, () => {
    next();
  });
};

export function getStore() {
  return storage.getStore() || {};
}
