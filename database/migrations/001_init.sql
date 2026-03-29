-- ============================================================
-- AiReport 初始化 Schema
-- PostgreSQL 14+ / 建议 utf8mb4 等价 utf-8
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============ 租户与用户 ============

CREATE TABLE tenants (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(200) NOT NULL,
  plan        VARCHAR(30) NOT NULL DEFAULT 'free',
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  email       VARCHAR(320) NOT NULL,
  name        VARCHAR(100) NOT NULL,
  password_hash VARCHAR(200),
  avatar_url  TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, email)
);

CREATE TABLE roles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  name        VARCHAR(60)  NOT NULL,
  permissions JSONB NOT NULL DEFAULT '[]',
  UNIQUE (tenant_id, name)
);

CREATE TABLE user_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- ============ 数据源连接 ============

CREATE TYPE connection_type AS ENUM (
  'mysql', 'postgresql', 'sqlserver', 'oracle',
  'clickhouse', 'elasticsearch', 'rest', 'excel', 'csv'
);

CREATE TABLE connections (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  name          VARCHAR(200) NOT NULL,
  type          connection_type NOT NULL,
  config        JSONB NOT NULL DEFAULT '{}',
  credentials_enc BYTEA,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  last_probe_at TIMESTAMPTZ,
  last_probe_ok BOOLEAN,
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_connections_tenant ON connections(tenant_id);

-- ============ 元数据快照 ============

CREATE TABLE metadata_snapshots (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id   UUID NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
  schema_name     VARCHAR(200),
  tables          JSONB NOT NULL DEFAULT '[]',
  refreshed_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_meta_conn ON metadata_snapshots(connection_id);

-- ============ 语义层 ============

CREATE TABLE semantic_models (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  name        VARCHAR(200) NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE measure_agg AS ENUM ('sum', 'count', 'avg', 'min', 'max', 'count_distinct', 'custom');

CREATE TABLE measures (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_id        UUID NOT NULL REFERENCES semantic_models(id) ON DELETE CASCADE,
  name            VARCHAR(200) NOT NULL,
  display_name    VARCHAR(200),
  expression      TEXT NOT NULL,
  agg             measure_agg NOT NULL DEFAULT 'sum',
  format          VARCHAR(60),
  synonyms        TEXT[] DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE dimensions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_id        UUID NOT NULL REFERENCES semantic_models(id) ON DELETE CASCADE,
  name            VARCHAR(200) NOT NULL,
  display_name    VARCHAR(200),
  expression      TEXT NOT NULL,
  hierarchy       TEXT[],
  synonyms        TEXT[] DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE relationships (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_id    UUID NOT NULL REFERENCES semantic_models(id) ON DELETE CASCADE,
  from_table  VARCHAR(200) NOT NULL,
  from_column VARCHAR(200) NOT NULL,
  to_table    VARCHAR(200) NOT NULL,
  to_column   VARCHAR(200) NOT NULL,
  join_type   VARCHAR(20) NOT NULL DEFAULT 'left'
);

-- ============ 项目与文档 ============

CREATE TYPE project_type AS ENUM ('report', 'dashboard');

CREATE TABLE projects (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  name          VARCHAR(300) NOT NULL,
  description   TEXT,
  type          project_type NOT NULL DEFAULT 'report',
  thumbnail_url TEXT,
  is_deleted    BOOLEAN NOT NULL DEFAULT FALSE,
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_projects_tenant ON projects(tenant_id) WHERE NOT is_deleted;

CREATE TABLE documents (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  dsl_version   VARCHAR(20) NOT NULL DEFAULT '1.0',
  document      JSONB NOT NULL,
  etag          VARCHAR(64) NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  updated_by    UUID REFERENCES users(id),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id)
);

-- ============ 发布 ============

CREATE TABLE publishments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id    UUID NOT NULL REFERENCES projects(id),
  version       INTEGER NOT NULL DEFAULT 1,
  snapshot      JSONB NOT NULL,
  public_token  VARCHAR(64) UNIQUE,
  comment       TEXT,
  published_by  UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_pub_project ON publishments(project_id);

-- ============ 模版 ============

CREATE TABLE templates (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(300) NOT NULL,
  description   TEXT,
  category      VARCHAR(60),
  tags          TEXT[] DEFAULT '{}',
  type          project_type NOT NULL DEFAULT 'report',
  thumbnail_url TEXT,
  dsl_snapshot  JSONB NOT NULL,
  field_mapping JSONB DEFAULT '{}',
  semver        VARCHAR(30) NOT NULL DEFAULT '1.0.0',
  is_builtin    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE template_installations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  template_id UUID NOT NULL REFERENCES templates(id),
  project_id  UUID REFERENCES projects(id),
  installed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ AI 会话 ============

CREATE TABLE ai_sessions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  user_id     UUID NOT NULL REFERENCES users(id),
  project_id  UUID REFERENCES projects(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE ai_msg_role AS ENUM ('user', 'assistant', 'system');

CREATE TABLE ai_messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id  UUID NOT NULL REFERENCES ai_sessions(id) ON DELETE CASCADE,
  role        ai_msg_role NOT NULL,
  content     TEXT NOT NULL,
  dsl_patch   JSONB,
  tokens_used INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ai_msg_session ON ai_messages(session_id, created_at);

-- ============ 查询审计 ============

CREATE TABLE query_audit (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  user_id       UUID REFERENCES users(id),
  connection_id UUID REFERENCES connections(id),
  sql_text      TEXT,
  row_count     INTEGER,
  elapsed_ms    INTEGER,
  status        VARCHAR(20) NOT NULL DEFAULT 'ok',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_query_audit_tenant ON query_audit(tenant_id, created_at DESC);

-- ============ 通用 updated_at 触发器 ============

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tenants_updated BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_users_updated   BEFORE UPDATE ON users   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_conn_updated    BEFORE UPDATE ON connections FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_sem_updated     BEFORE UPDATE ON semantic_models FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_proj_updated    BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_doc_updated     BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
