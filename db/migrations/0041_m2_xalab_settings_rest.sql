-- M2 giao diện giống XaLab – các danh mục Cài đặt còn lại: bảng định mức chi tiết, template, nhân viên, nhà cung cấp,
-- danh sách số phiếu kết quả. Chỉ thêm cột / bảng mới; dữ liệu cũ giữ nguyên.

-- Trạng thái (đang dùng / ngừng) cho các danh sách có bộ lọc "Trạng thái" như XaLab.
alter table public.bulk_templates  add column if not exists active boolean not null default true;
alter table public.batch_templates add column if not exists active boolean not null default true;
alter table public.suppliers       add column if not exists active boolean not null default true;

-- "Cài đặt định mức" của một chỉ tiêu trong bảng định mức: từng khoản (dụng cụ lấy mẫu, thiết bị HT, vật liệu HT,
-- dụng cụ phân tích, thiết bị PTN, vật liệu PTN, nhân công) với định mức và đơn giá. Có khoản thì đơn giá định mức = tổng.
create table if not exists public.norm_item_parts (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid not null references public.rate_items(id) on delete cascade,
  category    text not null,
  name        text not null,
  quantity    double precision not null default 0,
  unit_price  double precision not null default 0,
  sort        int not null default 0
);
create index if not exists idx_norm_item_parts_item on public.norm_item_parts(item_id);

-- Nhân viên theo form XaLab (Ông/bà, số điện thoại 2, ký thay, cộng tác viên, phòng ban) và các quyền bị chặn riêng.
alter table public.staff add column if not exists salutation    text;
alter table public.staff add column if not exists phone2        text;
alter table public.staff add column if not exists sign_for      text;
alter table public.staff add column if not exists collaborator  boolean not null default false;
alter table public.staff add column if not exists department_id uuid references public.departments(id) on delete set null;
alter table public.staff add column if not exists denied        jsonb not null default '[]'::jsonb;  -- quyền bị chặn riêng (VD view.customers)

-- Danh sách số phiếu kết quả: mỗi lần cấp số cho một đơn hàng (năm, loại số phiếu, bắt đầu từ số, số lượng).
create table if not exists public.report_numbers (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  created_by  text,
  order_id    uuid references public.orders(id) on delete set null,
  year        int not null,
  kind        text not null,
  start_no    int not null,
  quantity    int not null default 1,
  deleted_at  timestamptz,
  deleted_by  text
);
create index if not exists idx_report_numbers_year_kind on public.report_numbers(year, kind);
