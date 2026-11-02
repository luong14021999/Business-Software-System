-- M2 giao diện giống XaLab – các trang con của đơn hàng: phí quản lý trên báo giá, bảo quản theo từng mẫu.
-- Chỉ thêm cột / bảng mới.

alter table public.order_quotes add column if not exists management_fee_pct double precision default 0;

-- Bảo quản của đơn hàng: cách bảo quản áp cho từng yêu cầu (mẫu), như trang "Bảo quản của đơn hàng" của XaLab.
create table if not exists public.sample_preservations (
  id               uuid primary key default gen_random_uuid(),
  sample_id        uuid not null references public.samples(id) on delete cascade,
  preservation_id  uuid not null references public.preservations(id) on delete cascade,
  unique (sample_id, preservation_id)
);
create index if not exists idx_sample_preservations_sample on public.sample_preservations(sample_id);
