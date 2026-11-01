-- M2 giai đoạn 3: báo giá, công nợ thanh toán theo đợt cho đơn hàng; đơn giá tham khảo của chỉ tiêu.

-- Mã vạch Code 128 không mã hóa được chữ có dấu → tiền tố mã mẫu đất dùng "D".
update public.sample_types set prefix = 'D'
where name = 'Đất' and prefix = 'Đ'
  and not exists (select 1 from public.samples where code like 'Đ%' and order_id is not null);

alter table public.lab_analytes add column if not exists unit_price double precision default 0;  -- đơn giá tham khảo / mẫu (chưa thuế)

alter table public.orders add column if not exists quote_no     text;
alter table public.orders add column if not exists quoted_at    date;
alter table public.orders add column if not exists amount       double precision default 0;  -- giá trị đơn hàng trước thuế, trước giảm giá
alter table public.orders add column if not exists discount_pct double precision default 0;
alter table public.orders add column if not exists vat_rate     double precision default 0;

create table if not exists public.order_payments (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  amount      double precision not null default 0,
  paid_at     date,
  method      text,          -- Tiền mặt | Chuyển khoản
  note        text,
  created_by  text,
  created_at  timestamptz default now()
);
create index if not exists idx_order_payments_order on public.order_payments(order_id);
