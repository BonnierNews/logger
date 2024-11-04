import type { RequestHandler } from "express";
import { AsyncLocalStorage } from "node:async_hooks";
import { init as gcpInit } from "./gcp";

type Store = {
  traceparent?: string;
  clientServiceAccount?: string;
  [key: string]: unknown;
};

const storage = new AsyncLocalStorage<Store>();

export function middleware(): RequestHandler {
  return async (req, _res, next) => {
    await gcpInit(); // Will only await if not already initialized
    const traceparent = req.header("traceparent");

    storage.run({ traceparent }, () => {
      next();
    });
  };
}

export function getStore() {
  return storage.getStore() || {};
}
