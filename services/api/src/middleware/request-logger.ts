import type { RequestHandler } from "express";

export const requestLogger: RequestHandler = (req, _res, next) => {
  const start = Date.now();
  _res.on("finish", () => {
    const ms = Date.now() - start;
    console.log(`[${req.method}] ${req.originalUrl} ${_res.statusCode} ${ms}ms`);
  });
  next();
};
