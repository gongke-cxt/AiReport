import { Router, type Request, type Response } from "express";
import { v4 as uuid } from "uuid";
import { pool } from "../config/db.js";

export const aiRouter = Router();

/** POST /ai/sessions — 创建 AI 会话 */
aiRouter.post("/sessions", async (req: Request, res: Response) => {
  const tenantId = req.tenantId;
  const userId = req.userId;
  const projectId = req.body.projectId ?? null;
  const id = uuid();

  await pool.query(
    `INSERT INTO ai_sessions (id, tenant_id, user_id, project_id) VALUES ($1,$2,$3,$4)`,
    [id, tenantId, userId, projectId],
  );
  res.status(201).json({ id, createdAt: new Date().toISOString() });
});

/** POST /ai/sessions/:id/messages — 发送消息（SSE 占位） */
aiRouter.post("/sessions/:id/messages", async (req: Request, res: Response) => {
  const sessionId = req.params.id;
  const { content, stream } = req.body;

  // 持久化用户消息
  const msgId = uuid();
  await pool.query(
    `INSERT INTO ai_messages (id, session_id, role, content) VALUES ($1,$2,'user',$3)`,
    [msgId, sessionId, content],
  );

  if (stream) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // 占位：真实实现调用 LLM 流式输出 DSL
    res.write(`data: ${JSON.stringify({ type: "outline", text: "正在分析需求..." })}\n\n`);

    setTimeout(() => {
      res.write(`data: ${JSON.stringify({ type: "dsl", document: { version: "1.0", type: "report", pages: [], datasets: [] } })}\n\n`);
      res.write("data: [DONE]\n\n");
      res.end();
    }, 500);
    return;
  }

  res.json({
    outline: "AI 占位回复 — 集成大模型后替换此逻辑",
    document: null,
    clarifyingQuestions: [],
  });
});
