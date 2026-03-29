import express from "express";
import cors from "cors";
import helmet from "helmet";
import { errorHandler } from "./middleware/error-handler.js";
import { requestLogger } from "./middleware/request-logger.js";
import { tenantResolver } from "./middleware/tenant-resolver.js";
import { aiRouter } from "./routes/ai.js";
import { projectsRouter } from "./routes/projects.js";
import { connectionsRouter } from "./routes/connections.js";
import { queryRouter } from "./routes/query.js";
import { publishRouter } from "./routes/publish.js";
import { templatesRouter } from "./routes/templates.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: "2mb" }));
  app.use(requestLogger);

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", ts: new Date().toISOString() });
  });

  const v1 = express.Router();
  v1.use(tenantResolver);
  v1.use("/ai", aiRouter);
  v1.use("/projects", projectsRouter);
  v1.use("/connections", connectionsRouter);
  v1.use("/query", queryRouter);
  v1.use("/publish", publishRouter);
  v1.use("/templates", templatesRouter);

  app.use("/api/v1", v1);
  app.use(errorHandler);

  return app;
}
