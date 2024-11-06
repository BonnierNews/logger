import type { Request, RequestHandler } from "express";
import { AsyncLocalStorage } from "node:async_hooks";

type Store = {
  traceparent?: string;
  [key: string]: unknown;
};

const storage = new AsyncLocalStorage<Store>();

type MiddlewareConfig = {
  extractRequestData?: (headers: Request) => Record<string, unknown>;
}

export function middleware({ extractRequestData }: MiddlewareConfig = {}): RequestHandler {
  return (req, _res, next) => {
    const traceparent = req.headers.traceparent as string | undefined;
    const extra = extractRequestData?.(req) || {};

    storage.run({ traceparent, ...extra }, () => {
      next();
    });
  };
}

export function getStore() {
  return storage.getStore() || {};
}
