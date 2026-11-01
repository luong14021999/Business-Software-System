-- M2 giai đoạn 4: danh mục cài đặt – bảng giá, bảng định mức, mẫu bóc tách, mẫu mẻ thử nghiệm,
-- thầu phụ, dụng cụ lấy mẫu, bảo quản.

-- Bảng giá (kind = 'price') và bảng định mức (kind = 'norm') dùng chung cấu trúc.
create table if not exists public.rate_lists (
  id      uuid primary key default gen_random_uuid(),
  kind    text not null check (kind in ('price', 'norm')),
  name    text not null,
  note    text,
  active  boolean default true
);
create table if not exists public.rate_items (
  id              uuid primary key default gen_random_uuid(),
  list_id         uuid not null references public.rate_lists(id) on delete cascade,
  sample_type_id  uuid references public.sample_types(id) on delete cascade,
  analyte         text not null,
  amount          double precision default 0,   -- giá bán / đơn giá định mức (đ/mẫu)
  cost            double precision,             -- giá vốn (chỉ bảng giá)
  unique (list_id, sample_type_id, analyte)
);
create index if not exists idx_rate_items_list on public.rate_items(list_id);
alter table public.orders add column if not exists price_list_id uuid references public.rate_lists(id) on delete set null;

-- Mẫu bóc tách: danh sách chỉ tiêu dựng sẵn theo loại mẫu.
create table if not exists public.bulk_templates (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  sample_type_id  uuid references public.sample_types(id) on delete cascade,
  description     text,
  lines           jsonb not null default '[]'::jsonb,  -- [{ name, unit, method, subcontractor }]
  created_by      text
);

-- Mẫu mẻ thử nghiệm: phương pháp, người phân tích, thiết bị, hóa chất hay dùng.
create table if not exists public.batch_templates (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  method           text,
  analyst          text,
  instrument_code  text,
  chemicals        text,
  note             text
);

create table if not exists public.subcontractors (
  id      uuid primary key default gen_random_uuid(),
  name    text unique not null,
  code    text,           -- số hiệu VILAS / VIMCERTS…
  phone   text,
  note    text,
  active  boolean default true
);

create table if not exists public.container_types (
  id      uuid primary key default gen_random_uuid(),
  name    text unique not null,
  symbol  text,
  volume  text,
  note    text
);

create table if not exists public.preservations (
  id           uuid primary key default gen_random_uuid(),
  name         text unique not null,
  description  text
);
