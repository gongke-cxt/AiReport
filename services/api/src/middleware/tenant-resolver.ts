import type { RequestHandler } from "express";
import { env } from "../config/env.js";

declare global {
  namespace Express {
    interface Request {
      tenantId: string;
      userId: string;
    }
  }
}

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function pickUuid(header: string | undefined, fallback: string): string {
  if (header && UUID.test(header)) return header;
  return fallback;
}

/**
 * 从 Header 注入租户与用户；缺省时使用环境变量中的开发默认值（需执行 002_seed.sql）。
 */
export const tenantResolver: RequestHandler = (req, _res, next) => {
  req.tenantId = pickUuid(req.headers["x-tenant-id"] as string | undefined, env.DEFAULT_TENANT_ID);
  req.userId = pickUuid(req.headers["x-user-id"] as string | undefined, env.DEFAULT_USER_ID);
  next();
};
