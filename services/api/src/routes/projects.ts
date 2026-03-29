import { Router, type Request, type Response } from "express";
import { v4 as uuid } from "uuid";
import { pool } from "../config/db.js";
import { AppError } from "../middleware/error-handler.js";

export const projectsRouter = Router();

/** GET / — 项目列表 */
projectsRouter.get("/", async (req: Request, res: Response) => {
  const tenantId = req.tenantId;
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
  const offset = (page - 1) * pageSize;

  const { rows } = await pool.query(
    `SELECT id, name, type, thumbnail_url, updated_at
     FROM projects WHERE tenant_id=$1 AND NOT is_deleted
     ORDER BY updated_at DESC LIMIT $2 OFFSET $3`,
    [tenantId, pageSize, offset],
  );
  const { rows: cnt } = await pool.query(
    `SELECT count(*)::int AS total FROM projects WHERE tenant_id=$1 AND NOT is_deleted`,
    [tenantId],
  );
  res.json({ items: rows, total: cnt[0]?.total ?? 0 });
});

/** POST / — 创建项目 */
projectsRouter.post("/", async (req: Request, res: Response) => {
  const tenantId = req.tenantId;
  const userId = req.userId;
  const { name, description, type } = req.body;
  if (!name) throw new AppError(400, "name is required");

  const id = uuid();
  await pool.query(
    `INSERT INTO projects (id, tenant_id, name, description, type, created_by)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [id, tenantId, name, description ?? null, type ?? "report", userId],
  );

  // 同时创建空白文档
  await pool.query(
    `INSERT INTO documents (id, project_id, document) VALUES ($1,$2,$3)`,
    [uuid(), id, JSON.stringify({ version: "1.0", type: type ?? "report", pages: [{ id: "p1", widgets: [] }], datasets: [] })],
  );

  res.status(201).json({ id, name, type: type ?? "report" });
});

/** GET /:id/document — 获取 DSL */
projectsRouter.get("/:id/document", async (req: Request, res: Response) => {
  const { rows } = await pool.query(
    `SELECT dsl_version, document, etag FROM documents WHERE project_id=$1`,
    [req.params.id],
  );
  if (!rows[0]) throw new AppError(404, "document not found");
  res.json({ dslVersion: rows[0].dsl_version, document: rows[0].document, etag: rows[0].etag });
});

/** PUT /:id/document — 保存 DSL */
projectsRouter.put("/:id/document", async (req: Request, res: Response) => {
  const userId = req.userId;
  const { document, etag } = req.body;
  if (!document) throw new AppError(400, "document is required");

  const result = await pool.query(
    `UPDATE documents SET document=$1, updated_by=$2,
            etag=encode(gen_random_bytes(16),'hex')
     WHERE project_id=$3 AND ($4::text IS NULL OR etag=$4)
     RETURNING etag`,
    [JSON.stringify(document), userId, req.params.id, etag ?? null],
  );
  if (result.rowCount === 0) throw new AppError(409, "conflict: etag mismatch or not found");
  res.json({ etag: result.rows[0]?.etag });
});
