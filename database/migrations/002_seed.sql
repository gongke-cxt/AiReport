-- 开发环境默认租户与用户（与 API 默认 header 一致）
-- 与 services/api 中 DEFAULT_TENANT_ID / DEFAULT_USER_ID 保持相同 UUID

INSERT INTO tenants (id, name, plan)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Demo Tenant',
  'free'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, tenant_id, email, name)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'dev@example.com',
  'Dev User'
)
ON CONFLICT (tenant_id, email) DO NOTHING;

-- 可选：内置模版占位
INSERT INTO templates (id, name, description, category, type, dsl_snapshot, semver)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  '销售月度汇总',
  'KPI + 趋势 + 品类占比',
  'sales',
  'report',
  '{"version":"1.0","type":"report","name":"销售月度汇总","pages":[{"id":"p1","widgets":[]}],"datasets":[]}'::jsonb,
  '1.0.0'
)
ON CONFLICT (id) DO NOTHING;
