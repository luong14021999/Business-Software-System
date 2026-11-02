-- M2 giao diện giống XaLab – đợt 2: đủ trường cho các danh mục Cài đặt và Khách hàng như form Thêm/Sửa của XaLab;
-- thêm các danh mục còn thiếu (phòng ban, nhóm dụng cụ lấy mẫu, dụng cụ phân tích, công thức, loại kế hoạch, ngành công nghiệp,
-- đơn vị hiệu chuẩn, mức ưu tiên, thông tin công ty, quy chuẩn (văn bản) – cột quy chuẩn, biên bản thử nghiệm, hợp đồng khách hàng,
-- lịch quan trắc theo địa điểm). Chỉ thêm, không xóa dữ liệu cũ.

-- Phòng ban / chi nhánh
create table if not exists public.departments (
  id    uuid primary key default gen_random_uuid(),
  name  text not null,
  code  text,
  sort  integer default 0
);

-- Khách hàng
alter table public.customers add column if not exists print_name          text;
alter table public.customers add column if not exists english_name        text;
alter table public.customers add column if not exists tax_code            text;
alter table public.customers add column if not exists bank_account        text;
alter table public.customers add column if not exists fax                 text;
alter table public.customers add column if not exists email               text;
alter table public.customers add column if not exists province            text;
alter table public.customers add column if not exists address_old         text;   -- địa chỉ trước 1/7/2025
alter table public.customers add column if not exists invoice_address     text;
alter table public.customers add column if not exists representative      text;
alter table public.customers add column if not exists representative_title text;
alter table public.customers add column if not exists department_id       uuid references public.departments(id) on delete set null;
alter table public.customers add column if not exists is_requesting_unit  boolean default false;  -- đơn vị yêu cầu quan trắc
alter table public.customers add column if not exists is_inspection       boolean default false;  -- thanh tra
alter table public.customers add column if not exists active              boolean default true;
alter table public.customers add column if not exists created_by          text;

alter table public.customer_contacts add column if not exists salutation  text;   -- Ông / Bà
alter table public.customer_contacts add column if not exists department  text;   -- phòng
alter table public.customer_contacts add column if not exists phone2      text;

alter table public.customer_locations add column if not exists english_name text;

alter table public.monitoring_points add column if not exists english_name text;
alter table public.monitoring_points add column if not exists sort         integer default 0;
alter table public.monitoring_points add column if not exists active       boolean default true;

-- Lịch quan trắc định kỳ của địa điểm (ngày / tháng trong năm)
create table if not exists public.location_schedules (
  id           uuid primary key default gen_random_uuid(),
  location_id  uuid not null references public.customer_locations(id) on delete cascade,
  field_day    integer check (field_day between 1 and 31),
  field_month  integer check (field_month between 1 and 12)
);
create index if not exists idx_location_schedules_location on public.location_schedules(location_id);

-- Hợp đồng khách hàng
create table if not exists public.customer_contracts (
  id               uuid primary key default gen_random_uuid(),
  customer_id      uuid not null references public.customers(id) on delete cascade,
  contract_no      text not null,
  value            double precision default 0,
  signed_at        date,
  liquidated_at    date,
  signer_a         text,
  signer_b         text,
  contract_url     text,
  liquidation_url  text,
  invoice_url      text,
  created_at       timestamptz default now()
);
create index if not exists idx_customer_contracts_customer on public.customer_contracts(customer_id);

-- Phương pháp phân tích
alter table public.lab_methods add column if not exists analyst              text;
alter table public.lab_methods add column if not exists attachment_url       text;
alter table public.lab_methods add column if not exists record_template1     text;
alter table public.lab_methods add column if not exists record_template2     text;
alter table public.lab_methods add column if not exists isokinetic           boolean default false;  -- lấy mẫu khí đẳng động lực
alter table public.lab_methods add column if not exists quick_measure        boolean default false;  -- lấy mẫu khí đo nhanh
alter table public.lab_methods add column if not exists subcontractor_method boolean default false;

-- Nhóm chỉ tiêu phân tích
alter table public.analyte_groups add column if not exists description     text;
alter table public.analyte_groups add column if not exists result_template text;   -- mẫu phiếu kết quả
alter table public.analyte_groups add column if not exists test_field      text;   -- lĩnh vực thử nghiệm: Hóa học / Sinh học
alter table public.analyte_groups add column if not exists owner           text;   -- người phụ trách

-- Loại mẫu
alter table public.sample_types add column if not exists english_name     text;
alter table public.sample_types add column if not exists record_template2 text;

-- Loại dụng cụ lấy mẫu
alter table public.container_types add column if not exists description text;

-- Nhóm dụng cụ lấy mẫu (XaLab "Containers")
create table if not exists public.sampling_containers (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  symbol           text,
  unit             text,
  description      text,
  container_type   text,
  lifetime_months  text
);

-- Bảo quản
alter table public.preservations add column if not exists sample_type_id uuid references public.sample_types(id) on delete set null;
alter table public.preservations add column if not exists is_field       boolean default false;

-- Thầu phụ
alter table public.subcontractors add column if not exists tax_code        text;
alter table public.subcontractors add column if not exists fax             text;
alter table public.subcontractors add column if not exists email           text;
alter table public.subcontractors add column if not exists address         text;
alter table public.subcontractors add column if not exists invoice_address text;
alter table public.subcontractors add column if not exists contact         text;
alter table public.subcontractors add column if not exists as_internal     boolean default false;  -- áp dụng như không thầu phụ

-- Bảng giá: giá vốn
alter table public.rate_lists add column if not exists cost_price boolean default false;

-- Loại thiết bị ("Danh sách thiết bị" của XaLab)
alter table public.instrument_types add column if not exists description        text;
alter table public.instrument_types add column if not exists unit               text;
alter table public.instrument_types add column if not exists depreciation_years text;
alter table public.instrument_types add column if not exists shifts_per_year    integer;
alter table public.instrument_types add column if not exists manual_url         text;
alter table public.instrument_types add column if not exists is_field           boolean default false;
alter table public.instrument_types add column if not exists department_id      uuid references public.departments(id) on delete set null;

-- Nhà cung cấp: thông tin liên hệ như XaLab
alter table public.suppliers add column if not exists tax_code        text;
alter table public.suppliers add column if not exists fax             text;
alter table public.suppliers add column if not exists email           text;
alter table public.suppliers add column if not exists address         text;
alter table public.suppliers add column if not exists invoice_address text;

-- Hóa chất: mô tả
alter table public.chemicals add column if not exists description text;

-- Danh mục nhỏ mới
create table if not exists public.lab_formulas (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  formula          text,
  field_variables  text,
  description      text
);

create table if not exists public.lab_products (   -- nhóm dụng cụ phân tích
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  code             text,
  unit             text,
  description      text,
  lifetime_months  text
);

create table if not exists public.event_types (   -- loại kế hoạch
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text,
  sort         integer default 0
);

create table if not exists public.industries (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text
);

create table if not exists public.calibration_units (   -- đơn vị hiệu chuẩn
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  tax_code         text,
  phone            text,
  fax              text,
  email            text,
  address          text,
  invoice_address  text
);

create table if not exists public.request_priorities (   -- mức ưu tiên của yêu cầu
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  description   text,
  sort          integer default 0,
  surcharge_pct double precision default 0,
  is_default    boolean default false
);

create table if not exists public.lab_infos (   -- thông tin công ty / phòng thí nghiệm in trên phiếu
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  address      text,
  tax_code     text,
  phone        text,
  fax          text,
  email        text,
  website      text,
  director     text,
  head         text,
  vimcert_no   text,
  vilas_no     text
);

-- Quy chuẩn (văn bản QCVN) – mỗi quy chuẩn có nhiều cột quy chuẩn (bảng specifications hiện có)
create table if not exists public.standards (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null,
  description          text,
  english_description  text,
  sample_type_id       uuid references public.sample_types(id) on delete set null,
  doc_url              text,
  active               boolean default true
);
alter table public.specifications add column if not exists standard_id  uuid references public.standards(id) on delete set null;
alter table public.specifications add column if not exists english_name text;

-- Biên bản thử nghiệm
create table if not exists public.test_records (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text
);
create table if not exists public.test_record_analytes (
  id          uuid primary key default gen_random_uuid(),
  record_id   uuid not null references public.test_records(id) on delete cascade,
  analyte_id  uuid not null references public.lab_analytes(id) on delete cascade,
  sort        integer default 0,
  unique (record_id, analyte_id)
);
