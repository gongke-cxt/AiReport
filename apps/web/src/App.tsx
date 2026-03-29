export function App() {
  return (
    <div className="shell">
      <aside className="side">
        <div className="brand">
          <span className="logo">Ai</span>
          <div>
            <div className="brand-name">AiReport</div>
            <div className="brand-sub">工程骨架</div>
          </div>
        </div>
        <nav className="nav">
          <a className="nav-item active">工作台</a>
          <a className="nav-item">AI 创建</a>
          <a className="nav-item">模版</a>
          <a className="nav-item">数据源</a>
        </nav>
      </aside>
      <main className="main">
        <header className="top">
          <h1>工作台</h1>
          <p className="hint">
            完整交互稿见仓库根目录{" "}
            <code>design-mockup.html</code>；API 草案见 <code>openapi/openapi.yaml</code>。
          </p>
        </header>
        <section className="cards">
          <article className="card">
            <h2>DSL Schema</h2>
            <p>
              <code>packages/dsl-schema/schemas/report-dashboard-dsl.v1.json</code>
            </p>
          </article>
          <article className="card">
            <h2>TypeScript 类型</h2>
            <p>
              <code>packages/dsl-types/src/index.ts</code>
            </p>
          </article>
          <article className="card">
            <h2>校验样例</h2>
            <p>
              根目录执行 <code>npm run validate:dsl</code>
            </p>
          </article>
        </section>
      </main>
    </div>
  );
}
