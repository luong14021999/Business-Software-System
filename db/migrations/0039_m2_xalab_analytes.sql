-- M2 giao diện giống XaLab – Chỉ tiêu phân tích đủ trường và tab như XaLab, Chỉ tiêu phụ.
-- Chỉ thêm cột / bảng; nới ràng buộc loại tài nguyên của chỉ tiêu (thêm thiết bị phân tích, người phân tích, hóa chất lấy mẫu).

alter table public.lab_analytes add column if not exists english_name    text;
alter table public.lab_analytes add column if not exists sampling_method text;                          -- phương pháp lấy mẫu
alter table public.lab_analytes add column if not exists no_k_factor     boolean not null default false; -- không nhân hệ số K trong mẫu khí thải
alter table public.lab_analytes add column if not exists not_in_quote    boolean not null default false; -- không đưa vào báo giá đơn hàng
alter table public.lab_analytes add column if not exists allocated_cost  boolean not null default false; -- chi phí phân bổ

-- "instrument" (đã có) = thiết bị quan trắc; thêm instrument_lab = thiết bị phân tích, analyst = người phân tích, chemical = hóa chất lấy mẫu.
alter table public.analyte_resources drop constraint if exists analyte_resources_kind_check;
alter table public.analyte_resources add constraint analyte_resources_kind_check
  check (kind in ('instrument', 'instrument_lab', 'container', 'preservation', 'analyst', 'chemical'));

-- Chỉ tiêu phụ: khi bóc tách chỉ tiêu chính (theo loại mẫu, phương pháp) thì tự thêm các chỉ tiêu phụ.
create table if not exists public.analyte_mappings (
  id               uuid primary key default gen_random_uuid(),
  sample_type_id   uuid references public.sample_types(id) on delete cascade,
  main_analyte_id  uuid not null references public.lab_analytes(id) on delete cascade,
  method           text,                                   -- trống = mọi phương pháp
  accessory_ids    jsonb not null default '[]'::jsonb,     -- chỉ tiêu phụ + chỉ tiêu phụ thêm 1–20
  hide_accessory   boolean not null default false,
  created_at       timestamptz not null default now()
);
create index if not exists idx_analyte_mappings_main on public.analyte_mappings(main_analyte_id);
