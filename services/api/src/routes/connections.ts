import { Router, type Request, type Response } from "express";
import { v4 as uuid } from "uuid";
import { pool } from "../config/db.js";
import { AppError } from "../middleware/error-handler.js";

export const connectionsRouter = Router();

/** GET / — 当前租户下的连接列表 */
connectionsRouter.get("/", async (req: Request, res: Response) => {
  const { rows } = await pool.query(
    `SELECT id, name, type, is_active, last_probe_at, last_probe_ok, created_at
     FROM connections WHERE tenant_id=$1 ORDER BY created_at DESC`,
    [req.tenantId],
  );
  res.json({ items: rows });
});

/** POST / — 创建连接（异步探测占位：直接返回 202） */
connectionsRouter.post("/", async (req: Request, res: Response) => {
  const { name, type, config } = req.body;
  if (!name || !type) throw new AppError(400, "name and type are required");

  const id = uuid();
  await pool.query(
    `INSERT INTO connections (id, tenant_id, name, type, config, created_by)
     VALUES ($1,$2,$3,$4::connection_type,$5::jsonb,$6)`,
    [id, req.tenantId, name, type, JSON.stringify(config ?? {}), req.userId],
  );

  const probeJobId = uuid();
  res.status(202).json({ connectionId: id, probeJobId });
});

/** GET /:id/metadata — 元数据快照 */
connectionsRouter.get("/:id/metadata", async (req: Request, res: Response) => {
  const { rows } = await pool.query(
    `SELECT connection_id, schema_name, tables, refreshed_at
     FROM metadata_snapshots WHERE connection_id=$1 ORDER BY refreshed_at DESC LIMIT 1`,
    [req.params.id],
  );
  if (!rows[0]) {
    res.json({
      connectionId: req.params.id,
      refreshedAt: null,
      schemas: [],
      message: "暂无元数据，请先完成连接探测任务",
    });
    return;
  }
  const row = rows[0] as { schema_name: string | null; tables: unknown; refreshed_at: Date };
  res.json({
    connectionId: req.params.id,
    refreshedAt: row.refreshed_at,
    schemas: [{ name: row.schema_name ?? "default", tables: row.tables }],
  });
});
