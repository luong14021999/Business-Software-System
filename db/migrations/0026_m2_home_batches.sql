-- M2 giai đoạn 2: bảng tin nội bộ, lịch công tác tuần, mẻ thử nghiệm.

create table if not exists public.lab_posts (
  id          uuid primary key default gen_random_uuid(),
  author      text not null,
  body        text not null,
  created_at  timestamptz default now()
);
create index if not exists idx_lab_posts_created on public.lab_posts(created_at desc);

-- Lịch công tác: mỗi dòng một việc của một nhân viên trong một ngày.
create table if not exists public.work_schedule (
  id          uuid primary key default gen_random_uuid(),
  staff_name  text not null,
  day         date not null,
  kind        text default 'Kế hoạch',   -- Kế hoạch quan trắc | Lấy mẫu | Phân tích | Công tác | Họp | Nghỉ phép | Khác
  title       text not null,
  hours       double precision,
  order_id    uuid references public.orders(id) on delete set null,
  note        text,
  created_by  text,
  created_at  timestamptz default now()
);
create index if not exists idx_work_schedule_day on public.work_schedule(day);

-- Mẻ thử nghiệm: gom các dòng kết quả cùng phương pháp để phân tích một lần.
create table if not exists public.test_batches (
  id               uuid primary key default gen_random_uuid(),
  code             text unique not null,   -- 2026.11.001
  method           text,
  analyst          text,
  instrument_code  text,
  chemicals        text,
  started_at       timestamptz,
  finished_at      timestamptz,
  status           text default 'Phân tích', -- Phân tích | Duyệt | Trả kết quả
  note             text,
  created_by       text,
  created_at       timestamptz default now()
);

alter table public.analysis_results add column if not exists batch_id uuid references public.test_batches(id) on delete set null;
create index if not exists idx_analysis_results_batch on public.analysis_results(batch_id);
