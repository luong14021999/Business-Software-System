-- M2 giai đoạn 7: thông tin hiện trường của yêu cầu (mẫu), phân công người phân tích từng chỉ tiêu,
-- kế hoạch quan trắc của đơn hàng (nhân sự, thiết bị, vật tư – hóa chất, bảo quản).

alter table public.samples add column if not exists sampler          text;              -- người lấy mẫu (nhiều người cách nhau dấu phẩy)
alter table public.samples add column if not exists sample_condition text;              -- tình trạng mẫu khi lấy / nhận
alter table public.samples add column if not exists sample_quantity  text;              -- lượng mẫu (VD "2 lít", "500 g")
alter table public.samples add column if not exists lat              double precision;  -- vĩ độ thực tế khi lấy mẫu
alter table public.samples add column if not exists lng              double precision;  -- kinh độ
alter table public.samples add column if not exists env_conditions   jsonb default '{}'::jsonb;  -- { weather, temperature, humidity, wind, pressure, note }

alter table public.analysis_results add column if not exists analyst text;  -- người được phân công phân tích (khác KTV thực nhập)

create table if not exists public.order_plans (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null unique references public.orders(id) on delete cascade,
  leader      text,                          -- trưởng đoàn
  supervisor  text,                          -- giám sát
  deputy1     text,                          -- phó đoàn 1
  deputy2     text,                          -- phó đoàn 2
  groups      jsonb not null default '[]'::jsonb,  -- [["Tên 1","Tên 2",…], …] các nhóm quan trắc
  start_at    date,
  end_at      date,
  vehicle     text,
  note        text,
  updated_by  text,
  updated_at  timestamptz default now()
);

create table if not exists public.order_plan_items (
  id        uuid primary key default gen_random_uuid(),
  order_id  uuid not null references public.orders(id) on delete cascade,
  kind      text not null check (kind in ('Thiết bị', 'Vật tư – hóa chất', 'Bảo quản')),
  name      text not null,
  quantity  text,
  note      text,
  sort      integer default 0
);
create index if not exists idx_order_plan_items_order on public.order_plan_items(order_id, kind, sort);
