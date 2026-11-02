// Xóa sạch dữ liệu mẫu M2 đã tạo bằng `npm run db:seed-demo` (đúng các id trong db/seed/m2-demo-ids.json).
// Không đụng tới dữ liệu khác. Chạy: npm run db:clean-demo
import { config } from "dotenv";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
config({ path: ".env.local", quiet: true });

const IDS_FILE = "db/seed/m2-demo-ids.json";
if (!existsSync(IDS_FILE)) {
  console.log("Không có dữ liệu mẫu nào để xóa.");
  process.exit(0);
}
const sql = neon(process.env.DATABASE_URL!);
const ids = JSON.parse(readFileSync(IDS_FILE, "utf8")) as Record<string, string[]>;

// Con trước, cha sau (khóa ngoại).
const ORDER = [
  "test_reports", "report_numbers", "assignments", "work_schedule", "lab_posts", "tool_usage_logs", "van_bans",
  "chemical_exports", "chemical_imports", "instrument_moves", "calibration_logs",
  "sample_preservations", "order_type_specs", "analysis_results", "test_batches", "samples",
  "order_plan_items", "order_plans", "order_payments", "order_quotes", "orders",
  "customer_contracts", "location_schedules", "monitoring_points", "customer_locations", "customer_contacts",
  "analyte_resources", "analyte_mappings", "test_record_analytes", "test_records", "batch_templates", "bulk_templates",
  "rate_items", "rate_lists", "specification_limits", "specifications", "standards",
  "subcontractors", "suppliers", "manufacturers", "instrument_types", "lab_infos", "lab_formulas", "lab_products",
  "preservations", "container_types", "sampling_containers", "calibration_units", "request_priorities", "event_types", "industries", "departments",
];
const unknown = Object.keys(ids).filter((t) => !ORDER.includes(t));
if (unknown.length) throw new Error(`Bảng chưa có trong thứ tự xóa: ${unknown.join(", ")}`);

let total = 0;
for (const table of ORDER) {
  const list = ids[table] ?? [];
  if (!list.length) continue;
  const rows = await sql.query(`delete from public.${table} where id = any($1::uuid[]) returning id`, [list]);
  await sql.query(`delete from public.change_log where entity_id = any($1::text[])`, [list]);
  total += rows.length;
  console.log(`  ${table}: ${rows.length}`);
}
rmSync(IDS_FILE);
console.log(`✅ Đã xóa ${total} bản ghi mẫu.`);
