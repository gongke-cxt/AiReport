# AiReport（AI 智能报表平台）

- **交互设计稿**：[`design-mockup.html`](./design-mockup.html)（浏览器直接打开）
- **开发方案**：[`开发方案-AI智能报表平台.md`](./开发方案-AI智能报表平台.md)
- **安装说明**：[`docs/安装说明.md`](./docs/安装说明.md)
- **项目说明书**：[`docs/项目说明书.md`](./docs/项目说明书.md)
- **DSL Schema**：[`packages/dsl-schema/schemas/report-dashboard-dsl.v1.json`](./packages/dsl-schema/schemas/report-dashboard-dsl.v1.json)
- **API 草案**：[`openapi/openapi.yaml`](./openapi/openapi.yaml)

## 本地开发

```bash
npm install
npm run dev
```

Web 默认运行在 `http://localhost:5173`。

补充说明：

- 仓库只包含源码，不包含 `node_modules`、`dist`、`.env`
- `services/api` 需要单独安装依赖
- 当前 API 仍是骨架状态，详见 [`docs/安装说明.md`](./docs/安装说明.md)

## DSL 样例校验

```bash
npm run validate:dsl
```
