/** 与 `packages/dsl-schema/schemas/report-dashboard-dsl.v1.json` 对齐的手写类型 */

export type DocumentType = "report" | "dashboard";

export type LayoutEngine = "flow" | "grid" | "free";

export type RefreshMode = "manual" | "interval" | "realtime";

export type FilterOp = "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "between" | "like";

export type ParameterKind = "dateRange" | "date" | "string" | "number" | "enum";

export interface Theme {
  id?: string;
  mode?: "light" | "dark";
  tokens?: Record<string, string | number>;
}

export interface Layout {
  engine: LayoutEngine;
  columns?: number;
  rowHeight?: number;
  canvas?: { width?: number; height?: number };
}

export interface FilterClause {
  field: string;
  op: FilterOp;
  value?: unknown;
  paramRef?: string;
}

export interface Binding {
  datasetId?: string;
  x?: string;
  y?: string[];
  series?: string;
  value?: string;
  label?: string;
  columns?: Array<{
    field: string;
    header?: string;
    format?: string;
    [k: string]: unknown;
  }>;
  filters?: FilterClause[];
  sort?: Array<{ field: string; order?: "asc" | "desc" }>;
  limit?: number;
  [k: string]: unknown;
}

export interface RefreshPolicy {
  mode?: RefreshMode;
  seconds?: number;
}

export interface Widget {
  id: string;
  kind: string;
  title?: string;
  rect?: { x?: number; y?: number; w?: number; h?: number; z?: number };
  binding?: Binding;
  style?: Record<string, unknown>;
  interaction?: {
    drill?: Array<Record<string, unknown>>;
    link?: { url?: string; [k: string]: unknown };
  };
  refresh?: RefreshPolicy;
}

export interface Page {
  id: string;
  title?: string;
  layout?: Layout;
  widgets: Widget[];
}

export type SourceRef =
  | { type: "sql"; connectionId: string; sql: string }
  | { type: "table"; connectionId: string; schema?: string; table: string }
  | { type: "http"; url: string; method?: "GET" | "POST" };

export interface Dataset {
  id: string;
  name?: string;
  sourceRef: SourceRef;
  cachePolicy?: { ttlSeconds?: number };
}

export interface Parameter {
  id: string;
  label?: string;
  kind: ParameterKind;
  default?: unknown;
}

export interface ReportDashboardDocument {
  version: "1.0";
  type: DocumentType;
  name?: string;
  description?: string;
  theme?: Theme;
  pages: Page[];
  datasets: Dataset[];
  parameters?: Parameter[];
}

export interface DocumentEnvelope {
  dslVersion: "1.0";
  document: ReportDashboardDocument;
  etag?: string;
}
