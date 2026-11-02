-- M2 giao diện giống XaLab – nhóm Quản lý: mã thiết bị đủ trường XaLab, hiệu chuẩn nội bộ / định kỳ,
-- nhập / xuất kho thiết bị, lô hóa chất nhập / xuất kho, hồ sơ (văn bản) có file đính kèm.
-- Chỉ thêm cột / bảng mới; dữ liệu cũ giữ nguyên.

-- Mã thiết bị (form "Thông tin loại thiết bị phân tích/quan trắc" của XaLab).
alter table public.equipment add column if not exists instrument_type_id uuid references public.instrument_types(id) on delete set null;
alter table public.equipment add column if not exists manufacturer_id    uuid references public.manufacturers(id) on delete set null;
alter table public.equipment add column if not exists supplier_id        uuid references public.suppliers(id) on delete set null;
alter table public.equipment add column if not exists year_made          int;
alter table public.equipment add column if not exists calibration_days   int;               -- tần suất hiệu chuẩn (ngày/lần)
alter table public.equipment add column if not exists condition          text default 'Không rõ';  -- Không rõ / Tốt / Bình thường / Kém / Hỏng
alter table public.equipment add column if not exists quality_level      text;               -- cấp quản lý chất lượng
alter table public.equipment add column if not exists management_system  text;               -- hệ thống quản lý
alter table public.equipment add column if not exists active             boolean not null default true;

-- Lịch sử hiệu chuẩn: một lần cập nhật gồm hiệu chuẩn nội bộ (ngày, người thực hiện) và định kỳ (ngày, đơn vị).
alter table public.calibration_logs add column if not exists equipment_id  uuid references public.equipment(id) on delete cascade;
alter table public.calibration_logs add column if not exists internal_date date;
alter table public.calibration_logs add column if not exists internal_by   text;
alter table public.calibration_logs add column if not exists condition     text;
create index if not exists idx_calibration_logs_equipment on public.calibration_logs(equipment_id);

-- Nhập kho / xuất kho thiết bị (xuất kho có thể gắn đơn hàng mang ra hiện trường).
create table if not exists public.instrument_moves (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null check (kind in ('nhap', 'xuat')),
  moved_at    date not null default current_date,
  order_id    uuid references public.orders(id) on delete set null,
  deliverer   text,
  receiver    text,
  note        text,
  created_at  timestamptz not null default now()
);
create table if not exists public.instrument_move_items (
  id            uuid primary key default gen_random_uuid(),
  move_id       uuid not null references public.instrument_moves(id) on delete cascade,
  equipment_id  uuid not null references public.equipment(id) on delete cascade,
  unique (move_id, equipment_id)
);
create index if not exists idx_instrument_move_items_eq on public.instrument_move_items(equipment_id);

-- Hóa chất: lô nhập kho (mỗi lô nhiều hóa chất) và phiếu xuất kho (lấy từ từng dòng lô).
create table if not exists public.chemical_imports (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,          -- tên lô hàng
  imported_at  date not null default current_date,
  deliverer    text,
  receiver     text,
  note         text,
  created_at   timestamptz not null default now()
);
create table if not exists public.chemical_import_items (
  id           uuid primary key default gen_random_uuid(),
  import_id    uuid not null references public.chemical_imports(id) on delete cascade,
  chemical_id  uuid not null references public.chemicals(id) on delete restrict,
  qty          double precision not null default 0,
  expiry       date,
  note         text,                   -- ghi chú ở bảng tồn kho
  disposed     boolean not null default false
);
create index if not exists idx_chemical_import_items_import on public.chemical_import_items(import_id);
create table if not exists public.chemical_exports (
  id           uuid primary key default gen_random_uuid(),
  exported_at  date not null default current_date,
  deliverer    text,
  receiver     text,
  note         text,
  created_at   timestamptz not null default now()
);
create table if not exists public.chemical_export_items (
  id              uuid primary key default gen_random_uuid(),
  export_id       uuid not null references public.chemical_exports(id) on delete cascade,
  import_item_id  uuid not null references public.chemical_import_items(id) on delete restrict,
  qty             double precision not null default 0,
  purpose         text
);
create index if not exists idx_chemical_export_items_export on public.chemical_export_items(export_id);
create index if not exists idx_chemical_export_items_item on public.chemical_export_items(import_item_id);

-- Hồ sơ (văn bản) của phòng thí nghiệm, file đính kèm lưu trong CSDL (giới hạn kích thước ở API).
create table if not exists public.van_bans (
  id          uuid primary key default gen_random_uuid(),
  number      text not null,           -- số văn bản
  issued_at   date,
  issuer      text,                    -- cơ quan ban hành
  summary     text,                    -- trích yếu
  note        text,
  assignees   jsonb not null default '[]'::jsonb,  -- nhân viên được giao
  active      boolean not null default true,
  file_name   text,
  file_type   text,
  file_data   bytea,
  created_at  timestamptz not null default now()
);
