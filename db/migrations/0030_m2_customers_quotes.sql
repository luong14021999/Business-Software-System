-- M2 giai đoạn 6: liên hệ / địa điểm / vị trí quan trắc của khách hàng; liên hệ, địa điểm, tài liệu lưu trữ của đơn hàng;
-- số lần lấy mẫu + loại chỉ tiêu (hiện trường / phòng TN); báo giá nhiều phiên bản; quy chuẩn theo loại mẫu của đơn.

create table if not exists public.customer_contacts (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid not null references public.customers(id) on delete cascade,
  name         text not null,
  title        text,     -- chức vụ
  phone        text,
  email        text,
  note         text
);
create index if not exists idx_customer_contacts_customer on public.customer_contacts(customer_id);

create table if not exists public.customer_locations (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid not null references public.customers(id) on delete cascade,
  name         text not null,   -- địa chỉ / tên địa điểm quan trắc
  old_name     text,            -- tên địa điểm trước sắp xếp đơn vị hành chính (1/7/2025)
  description  text
);
create index if not exists idx_customer_locations_customer on public.customer_locations(customer_id);

create table if not exists public.monitoring_points (
  id           uuid primary key default gen_random_uuid(),
  location_id  uuid not null references public.customer_locations(id) on delete cascade,
  name         text not null,
  description  text,
  lat          double precision,
  lng          double precision
);
create index if not exists idx_monitoring_points_location on public.monitoring_points(location_id);

alter table public.orders add column if not exists contact_id  uuid references public.customer_contacts(id) on delete set null;
alter table public.orders add column if not exists location_id uuid references public.customer_locations(id) on delete set null;

-- Tài liệu lưu trữ của đơn hàng (đường dẫn Google Drive / máy chủ tệp).
create table if not exists public.order_documents (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  kind        text not null,   -- Biên bản lấy mẫu | Biên bản thử nghiệm | Phiếu kết quả | Báo cáo hoàn thiện | Khác
  url         text not null,
  note        text,
  created_by  text,
  created_at  timestamptz default now()
);
create index if not exists idx_order_documents_order on public.order_documents(order_id);

alter table public.samples add column if not exists point_id   uuid references public.monitoring_points(id) on delete set null;
alter table public.samples add column if not exists dispose_at date;
alter table public.samples add column if not exists spec2_id   uuid references public.specifications(id) on delete set null;

alter table public.analysis_results add column if not exists sampling_times integer default 1;  -- số lần lấy mẫu / đo tại vị trí
alter table public.analysis_results add column if not exists line_kind      text;               -- Hiện trường | Phòng TN

-- Báo giá: mỗi lần lưu là một phiên bản (sau bóc tách hoặc trước bóc tách), dòng hàng lưu nguyên dạng.
create table if not exists public.order_quotes (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders(id) on delete cascade,
  kind          text not null default 'after' check (kind in ('after', 'before')),
  code          text not null,          -- số báo giá
  quoted_at     date,
  discount_pct  double precision default 0,
  vat_rate      double precision default 0,
  note          text,
  lines         jsonb not null default '[]'::jsonb,  -- [{ label, unit, quantity, unitPrice, group }]
  total         double precision default 0,
  created_by    text,
  created_at    timestamptz default now()
);
create index if not exists idx_order_quotes_order on public.order_quotes(order_id, created_at desc);

-- Quy chuẩn theo loại mẫu của đơn hàng (tối đa 2 cột in trên phiếu); "áp cho tất cả yêu cầu" chép xuống từng mẫu.
create table if not exists public.order_type_specs (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders(id) on delete cascade,
  sample_type_id  uuid not null references public.sample_types(id) on delete cascade,
  spec1_id        uuid references public.specifications(id) on delete set null,
  spec2_id        uuid references public.specifications(id) on delete set null,
  unique (order_id, sample_type_id)
);
