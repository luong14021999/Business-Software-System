-- M2 giao diện giống XaLab – quy chuẩn theo loại mẫu (10 quy chuẩn, 10 cột) và mã mẫu phụ trên lưới nhập/duyệt.
-- Chỉ thêm cột. spec1_id / spec2_id hiện có vẫn là cột 1, 2 (dùng cho lưới kết quả và bản in).

alter table public.order_type_specs add column if not exists standard_ids jsonb not null default '[]'::jsonb;  -- tối đa 10 quy chuẩn
alter table public.order_type_specs add column if not exists spec_ids     jsonb not null default '[]'::jsonb;  -- tối đa 10 cột quy chuẩn

alter table public.analysis_results add column if not exists sub_code text;  -- mã mẫu phụ
