-- M2 giai đoạn 5: danh mục chi tiết theo hướng dẫn nghiệp vụ – phương pháp, nhóm chỉ tiêu, loại thiết bị,
-- nhà sản xuất; chi tiết chỉ tiêu (tên khi in, làm tròn, nhiều phương pháp + giới hạn phát hiện, tài nguyên);
-- giới hạn quy chuẩn dạng chữ (KPH, Không mùi…), ghi chú khi in.

create table if not exists public.lab_methods (
  id           uuid primary key default gen_random_uuid(),
  name         text unique not null,
  description  text,
  active       boolean default true
);
insert into public.lab_methods (name)
select distinct method from public.lab_analytes where coalesce(method, '') <> ''
on conflict (name) do nothing;

-- Nhóm chỉ tiêu; 7 nhóm môi trường lao động phải đúng tên để báo cáo theo Nghị định 44/2016/NĐ-CP xếp đúng mục.
create table if not exists public.analyte_groups (
  id        uuid primary key default gen_random_uuid(),
  name      text unique not null,
  sort      integer default 0,
  is_mtld   boolean default false
);
insert into public.analyte_groups (name, sort, is_mtld) values
  ('Vi khí hậu', 1, true),
  ('Các thông số vật lý', 2, true),
  ('Bụi các loại', 3, true),
  ('Hơi khí độc vô cơ', 4, true),
  ('Hơi khí độc hữu cơ', 5, true),
  ('Yếu tố điện từ trường', 6, true),
  ('Yếu tố phóng xạ', 7, true)
on conflict (name) do nothing;

create table if not exists public.instrument_types (id uuid primary key default gen_random_uuid(), name text unique not null, note text);
create table if not exists public.manufacturers    (id uuid primary key default gen_random_uuid(), name text unique not null, country text, note text);

alter table public.sample_types add column if not exists hazardous       boolean default false;
alter table public.sample_types add column if not exists min_quantity    text;   -- lượng mẫu tối thiểu khi lấy
alter table public.sample_types add column if not exists record_template text;   -- mẫu biên bản lấy mẫu: Nước | Khí | Đất | …

alter table public.lab_analytes add column if not exists print_name   text;      -- tên in trên phiếu kết quả (trống = tên)
alter table public.lab_analytes add column if not exists abbreviation text;
alter table public.lab_analytes add column if not exists is_field     boolean default false; -- chỉ tiêu đo nhanh hiện trường
alter table public.lab_analytes add column if not exists note         text;      -- ghi chú in trên phiếu
alter table public.lab_analytes add column if not exists formula_code text;      -- mã công thức tính (danh mục công thức)
alter table public.lab_analytes add column if not exists industry     text;      -- ngành công nghiệp (chỉ tiêu ánh sáng)
alter table public.lab_analytes add column if not exists spec1_id     uuid references public.specifications(id) on delete set null;
alter table public.lab_analytes add column if not exists spec2_id     uuid references public.specifications(id) on delete set null;
-- Số chữ số thập phân khi in, theo độ lớn kết quả: {"lt0_1":3,"lt1":2,"lt10":2,"lt100":1,"lt1000":0,"ge1000":0}
alter table public.lab_analytes add column if not exists decimals     jsonb;

-- Một chỉ tiêu có thể có nhiều phương pháp; giới hạn phát hiện để cảnh báo kết quả ngoài khoảng phương pháp.
create table if not exists public.analyte_methods (
  id             uuid primary key default gen_random_uuid(),
  analyte_id     uuid not null references public.lab_analytes(id) on delete cascade,
  method         text not null,
  is_default     boolean default false,
  min_value      double precision,
  max_value      double precision,
  subcontractor  text,
  unique (analyte_id, method)
);
insert into public.analyte_methods (analyte_id, method, is_default)
select id, method, true from public.lab_analytes where coalesce(method, '') <> ''
on conflict (analyte_id, method) do nothing;

-- Thiết bị quan trắc/phân tích, dụng cụ lấy mẫu, bảo quản gắn với chỉ tiêu (lập kế hoạch quan trắc).
create table if not exists public.analyte_resources (
  id          uuid primary key default gen_random_uuid(),
  analyte_id  uuid not null references public.lab_analytes(id) on delete cascade,
  kind        text not null check (kind in ('instrument', 'container', 'preservation')),
  name        text not null,
  is_default  boolean default false,
  unique (analyte_id, kind, name)
);

alter table public.specifications       add column if not exists print_name  text;   -- tên cột khi in
alter table public.specifications       add column if not exists print_note  text;   -- ghi chú khi in (VD Kp=0,9; Kq=1)
alter table public.specification_limits add column if not exists not_detected boolean default false; -- quy chuẩn ghi dạng chữ
alter table public.specification_limits add column if not exists nd_text      text;  -- KPH | 0 | Không mùi…
alter table public.specification_limits add column if not exists print_note   text;

alter table public.equipment add column if not exists equipment_type text;
alter table public.equipment add column if not exists is_field       boolean default false;  -- thiết bị quan trắc mang ra hiện trường
