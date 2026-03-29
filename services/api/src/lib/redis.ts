import { createClient } from "redis";
import { env } from "../config/env.js";

export const redis = createClient({ url: env.REDIS_URL });

redis.on("error", (err) => console.error("[redis]", err));

let connected = false;

export async function ensureRedis() {
  if (!connected) {
    await redis.connect();
    connected = true;
  }
  return redis;
}
