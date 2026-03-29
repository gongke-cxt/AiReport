import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const schema = JSON.parse(
  readFileSync(join(root, "schemas/report-dashboard-dsl.v1.json"), "utf8")
);
const sample = JSON.parse(
  readFileSync(join(root, "samples/sample-report.v1.json"), "utf8")
);

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);
const ok = validate(sample);

if (!ok) {
  console.error(validate.errors);
  process.exit(1);
}
console.log("[dsl-schema] sample-report.v1.json 校验通过。");
