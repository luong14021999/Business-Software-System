-- M2 giao diện giống XaLab – Đơn hàng: các trường của form Thêm/Sửa đơn hàng XaLab (hợp đồng, đơn vị yêu cầu,
-- tab Thông tin khác, tab Đơn hàng so sánh). Chỉ thêm cột, không đổi dữ liệu cũ.

alter table public.orders add column if not exists contract_id            uuid references public.customer_contracts(id) on delete set null;
alter table public.orders add column if not exists requesting_unit_id     uuid references public.customers(id) on delete set null;
alter table public.orders add column if not exists compare_order_ids      jsonb not null default '[]'::jsonb;  -- tối đa 5 đơn hàng so sánh
alter table public.orders add column if not exists growing_area_code      text;   -- mã vùng trồng
alter table public.orders add column if not exists packing_facility_code  text;   -- mã cơ sở đóng gói
alter table public.orders add column if not exists vehicle_plate          text;
alter table public.orders add column if not exists trailer_plate          text;   -- biển số rơ-moóc
alter table public.orders add column if not exists container_no           text;
alter table public.orders add column if not exists seal_no                text;   -- mã số niêm phong
alter table public.orders add column if not exists show_field_time        boolean default false;  -- hiển thị giờ quan trắc
alter table public.orders add column if not exists hide_requests          boolean default false;  -- ẩn tất cả các yêu cầu
alter table public.orders add column if not exists activity_report        boolean default false;  -- báo cáo hoạt động thử nghiệm
alter table public.orders add column if not exists industry_id            uuid references public.industries(id) on delete set null;
alter table public.orders add column if not exists department_id          uuid references public.departments(id) on delete set null;
alter table public.orders add column if not exists delivery_count         text;   -- lần trả kết quả
alter table public.orders add column if not exists report_no_en           text;   -- số phiếu kết quả tiếng Anh
alter table public.orders add column if not exists report_no_kind         text;   -- loại số phiếu (VILAS / VIMCERTS / nội bộ)
