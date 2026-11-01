-- M2 · Đơn hàng → bóc tách → mẫu → nhập/duyệt kết quả theo đơn, so sánh quy chuẩn (giai đoạn 1).

-- Loại mẫu: tiền tố dùng để sinh mã mẫu (VD NM + ngày + số thứ tự → NM300726-001).
create table if not exists public.sample_types (
  id                uuid primary key default gen_random_uuid(),
  name              text unique not null,
  prefix            text not null,
  sort              integer default 0,
  default_container text,
  description       text,
  active            boolean default true
);

-- Chỉ tiêu phân tích theo loại mẫu (danh mục dùng khi bóc tách).
create table if not exists public.lab_analytes (
  id              uuid primary key default gen_random_uuid(),
  sample_type_id  uuid not null references public.sample_types(id) on delete cascade,
  name            text not null,
  group_name      text,
  unit            text,
  method          text,
  loq             text,
  scope           text default 'VILAS',   -- VILAS | Nội bộ | Thầu phụ
  accredited_no   integer,                -- số thứ tự phép thử trong phạm vi VILAS 1501
  sort            integer default 0,
  active          boolean default true,
  unique (sample_type_id, name)
);

-- Quy chuẩn (QCVN…) và giới hạn từng chỉ tiêu.
create table if not exists public.specifications (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,             -- VD QCVN 08:2023/BTNMT
  column_name     text,                      -- cột áp dụng, VD "Bảng 2 – Mức B"
  sample_type_id  uuid references public.sample_types(id) on delete set null,
  note            text,
  active          boolean default true
);
create table if not exists public.specification_limits (
  id          uuid primary key default gen_random_uuid(),
  spec_id     uuid not null references public.specifications(id) on delete cascade,
  analyte     text not null,
  min_value   double precision,
  max_value   double precision,
  note        text,
  unique (spec_id, analyte)
);

-- Đơn hàng: gom các yêu cầu (mẫu) của một lần khách gửi mẫu / một đợt quan trắc.
create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  code             text unique not null,       -- 26.6 = năm 2026, đơn thứ 6
  name             text not null,
  kind             text default 'Mẫu gửi',     -- Mẫu gửi | Quan trắc môi trường | Môi trường lao động | Nông sản – thực phẩm
  customer_id      uuid references public.customers(id) on delete set null,
  contact          text,
  location         text,
  contract_no      text,
  requesting_unit  text,
  field_at         timestamptz,                -- ngày quan trắc / lấy mẫu
  received_at      timestamptz,                -- ngày nhận mẫu
  due_at           timestamptz,                -- ngày trả kết quả (hẹn khách)
  internal_due_at  timestamptz,                -- ngày trả kết quả nội bộ
  delivered_at     timestamptz,                -- ngày trả kết quả thực tế
  dispose_at       date,                       -- ngày hủy mẫu
  sales_staff      text,
  field_staff      text,
  signer           text,
  qa_staff         text,
  delivery_method  text,
  report_no        text,
  status           text default 'Báo giá',     -- Báo giá | Quan trắc | Phân tích | Trả kết quả | Thanh lý | Hủy
  note             text,
  created_by       text,
  created_at       timestamptz default now()
);
create index if not exists idx_orders_status on public.orders(status, created_at desc);

alter table public.samples add column if not exists order_id             uuid references public.orders(id) on delete set null;
alter table public.samples add column if not exists sample_type_id       uuid references public.sample_types(id) on delete set null;
alter table public.samples add column if not exists location_name        text;      -- vị trí / tên mẫu
alter table public.samples add column if not exists customer_sample_code text;
alter table public.samples add column if not exists is_qc                boolean default false;
alter table public.samples add column if not exists is_duplicate         boolean default false;
alter table public.samples add column if not exists sampled_at           timestamptz;
alter table public.samples add column if not exists stage                text;      -- Đợi lấy mẫu | Lấy mẫu | Nhận mẫu | Đang phân tích | Đợi duyệt | Duyệt | Không duyệt | Trả kết quả | Lưu mẫu | Hủy mẫu
alter table public.samples add column if not exists spec_id              uuid references public.specifications(id) on delete set null;
create index if not exists idx_samples_order_id on public.samples(order_id);

alter table public.analysis_results add column if not exists subcontractor  text;   -- VILAS | Nội bộ | tên đơn vị thầu phụ
alter table public.analysis_results add column if not exists result_prefix  text;   -- "<", ">", "KPH"
alter table public.analysis_results add column if not exists sort           integer default 0;

insert into public.sample_types (name, prefix, sort) values
  ('Đất', 'Đ', 1),
  ('Nước mặt', 'NM', 2),
  ('Nước dưới đất', 'NN', 3),
  ('Nước thải', 'NT', 4),
  ('Phân bón', 'PB', 5),
  ('Rau, quả', 'RQ', 6)
on conflict (name) do nothing;

-- Chỉ tiêu ban đầu: 60 phép thử trong phạm vi công nhận VILAS 1501.
insert into public.lab_analytes (sample_type_id, name, unit, method, loq, accredited_no, sort)
select st.id, v.name, nullif(v.unit, ''), v.method, nullif(v.loq, ''), v.no, v.sort
from (values
  ('Đất', 'Xác định độ ẩm và hệ số khô kiệt', '', 'TCVN 4048:2011', '', 1, 1),
  ('Đất', 'Xác định hàm lượng Cacbon hữu cơ tổng số – Phương pháp Walkley Black', '%', 'TCVN 8941:2011', '0,08%', 2, 2),
  ('Đất', 'Xác định hàm lượng Sulfate hòa tan trong nước và trong axit', '%', 'TCVN 6656:2000', '0,02%', 3, 3),
  ('Đất', 'Xác định hàm lượng Nitơ tổng số – Phương pháp Kjeldahl cải biên', 'mg/g', 'TCVN 6498:1999', '0,06 mg/g', 4, 4),
  ('Đất', 'Xác định hàm lượng Kali tổng số', '% K₂O', 'TCVN 8660:2011', '0,024% K₂O', 5, 5),
  ('Đất', 'Xác định hàm lượng kali dễ tiêu', 'mg/kg', 'TCVN 8662:2011', '5,00 mg/kg', 6, 6),
  ('Đất', 'Xác định thành phần cấp hạt', '', 'TCVN 8567:2010', '', 7, 7),
  ('Đất', 'Xác định dung lượng cation trao đổi (CEC) – Phương pháp dùng amon axetat', 'cmol(+)/kg', 'TCVN 8568:2010', '0,36 cmol(+)/kg', 8, 8),
  ('Đất', 'Xác định hàm lượng Cu trong dịch chiết đất bằng cường thủy – Phương pháp F-AAS (Phương pháp A)', 'mg/kg', 'TCVN 6496A:2009', '7,5 mg/kg', 9, 9),
  ('Đất', 'Xác định hàm lượng Zn trong dịch chiết đất bằng cường thủy – Phương pháp F-AAS (Phương pháp A)', 'mg/kg', 'TCVN 6496A:2009', '6,0 mg/kg', 10, 10),
  ('Đất', 'Xác định hàm lượng Cd trong dịch chiết đất bằng cường thủy – Phương pháp GF-AAS (Phương pháp B)', 'mg/kg', 'TCVN 6496B:2009', '0,02 mg/kg', 11, 11),
  ('Đất', 'Xác định hàm lượng Pb trong dịch chiết đất bằng cường thủy – Phương pháp GF-AAS (Phương pháp B)', 'mg/kg', 'TCVN 6496B:2009', '0,25 mg/kg', 12, 12),
  ('Đất', 'Xác định hàm lượng Cr trong dịch chiết đất bằng cường thủy – Phương pháp F-AAS (Phương pháp A)', 'mg/kg', 'TCVN 6496A:2009', '9,00 mg/kg', 13, 13),
  ('Đất', 'Xác định tổng hàm lượng và hàm lượng các ion thành phần muối hòa tan của đất trong phòng thí nghiệm', '%', 'TCVN 12615:2019', '0,025%', 14, 14),
  ('Đất', 'Xác định khối lượng theo thể tích nguyên khối khô (Dung trọng)', '', 'TCVN 6860:2001', '', 15, 15),
  ('Đất', 'Xác định độ dẫn điện riêng (EC)', 'mS/m', 'TCVN 6650:2000', '1,36 mS/m', 16, 16),
  ('Đất', 'Xác định hàm lượng phospho tổng số – Phương pháp so màu', '% P₂O₅', 'TCVN 8940:2011', '0,04% P₂O₅', 17, 17),
  ('Đất', 'Xác định hàm lượng phospho dễ tiêu', 'mg P₂O₅/100g', 'TCVN 5256:2009', '3,4 mg P₂O₅/100g', 18, 18),
  ('Đất', 'Xác định hàm lượng Nitơ dễ tiêu', 'mg/100g', 'TCVN 5255:2009', '0,17 mg/100g', 19, 19),
  ('Đất', 'Xác định hàm lượng As trong dịch chiết đất bằng cường thủy – Phương pháp GF-AAS', 'mg/kg', 'TCVN 8467:2010', '0,4 mg/kg', 20, 20),
  ('Đất', 'Xác định pH (pH H₂O và pH KCl)', '', 'TCVN 5979:2021', '2,0 ~ 10,0', 21, 21),
  ('Đất', 'Xác định hàm lượng Hg trong dịch chiết đất bằng cường thủy – Phương pháp CV-AAS', 'mg/kg', 'TCVN 8882:2011', '0,5 mg/kg', 22, 22),
  ('Đất', 'Xác định các cation bazơ trao đổi – Phương pháp dùng amoni axetat', '', 'TCVN 8569:2010', 'K: 0,1 · Na: 0,5 · Ca: 1,0 · Mg: 1,0 meq/100g', 23, 23),
  ('Đất', 'Xác định dư lượng thuốc bảo vệ thực vật nhóm phospho hữu cơ: Chlorpyrifos; Diazinon; Malthion; Ipropenfos; Dimethoate; Methyl parathion; Ethion; Fenthion; Dichorvos; Fenitrothion; Quinalphos; Anilofos – Phương pháp GC-MS', 'mg/kg', 'AEMD-HD.M.SOP.GC/MS-02A:2025 (Ref: EN 15662:2018)', '0,02 mg/kg mỗi chất', 24, 24),
  ('Nước mặt', 'Xác định hàm lượng Pb – Phương pháp GF-AAS', 'μg/L', 'TCVN 13091:2020', '4,0 μg/L', 25, 1),
  ('Nước dưới đất', 'Xác định hàm lượng Pb – Phương pháp GF-AAS', 'μg/L', 'TCVN 13091:2020', '4,0 μg/L', 25, 1),
  ('Nước mặt', 'Xác định hàm lượng Cadimi – Phương pháp GF-AAS', 'μg/L', 'TCVN 6197:2008', '0,5 μg/L', 26, 2),
  ('Nước dưới đất', 'Xác định hàm lượng Cadimi – Phương pháp GF-AAS', 'μg/L', 'TCVN 6197:2008', '0,5 μg/L', 26, 2),
  ('Nước mặt', 'Xác định hàm lượng As – Phương pháp GF-AAS', 'μg/L', 'SMEWW 3113B:2023', '1,0 μg/L', 27, 3),
  ('Nước dưới đất', 'Xác định hàm lượng As – Phương pháp GF-AAS', 'μg/L', 'SMEWW 3113B:2023', '1,0 μg/L', 27, 3),
  ('Nước mặt', 'Xác định hàm lượng Hg – Phương pháp CV-AAS', 'μg/L', 'TCVN 7877:2008', '0,5 μg/L', 28, 4),
  ('Nước dưới đất', 'Xác định hàm lượng Hg – Phương pháp CV-AAS', 'μg/L', 'TCVN 7877:2008', '0,5 μg/L', 28, 4),
  ('Nước mặt', 'Xác định hàm lượng Cu – Phương pháp F-AAS', 'mg/L', 'TCVN 6193:1996', '0,05 mg/L', 29, 5),
  ('Nước dưới đất', 'Xác định hàm lượng Cu – Phương pháp F-AAS', 'mg/L', 'TCVN 6193:1996', '0,05 mg/L', 29, 5),
  ('Nước mặt', 'Xác định hàm lượng Zn – Phương pháp F-AAS', 'mg/L', 'TCVN 6193:1996', '0,05 mg/L', 30, 6),
  ('Nước dưới đất', 'Xác định hàm lượng Zn – Phương pháp F-AAS', 'mg/L', 'TCVN 6193:1996', '0,05 mg/L', 30, 6),
  ('Nước mặt', 'Xác định hàm lượng Cr – Phương pháp F-AAS', 'mg/L', 'TCVN 6222:2008', '0,05 mg/L', 31, 7),
  ('Nước dưới đất', 'Xác định hàm lượng Cr – Phương pháp F-AAS', 'mg/L', 'TCVN 6222:2008', '0,05 mg/L', 31, 7),
  ('Nước mặt', 'Xác định hàm lượng Mn – Phương pháp F-AAS', 'mg/L', 'SMEWW 3111B:2023', '0,05 mg/L', 32, 8),
  ('Nước dưới đất', 'Xác định hàm lượng Mn – Phương pháp F-AAS', 'mg/L', 'SMEWW 3111B:2023', '0,05 mg/L', 32, 8),
  ('Nước mặt', 'Xác định hàm lượng Fe – Phương pháp F-AAS', 'mg/L', 'SMEWW 3111B:2023', '0,05 mg/L', 33, 9),
  ('Nước dưới đất', 'Xác định hàm lượng Fe – Phương pháp F-AAS', 'mg/L', 'SMEWW 3111B:2023', '0,05 mg/L', 33, 9),
  ('Nước mặt', 'Xác định nhu cầu oxy sinh hóa sau 5 ngày (BOD₅) – Phương pháp dùng cho mẫu không pha loãng', 'mg/L', 'TCVN 6001-2:2008', '2 mg/L', 34, 10),
  ('Nước dưới đất', 'Xác định nhu cầu oxy sinh hóa sau 5 ngày (BOD₅) – Phương pháp dùng cho mẫu không pha loãng', 'mg/L', 'TCVN 6001-2:2008', '2 mg/L', 34, 10),
  ('Nước mặt', 'Xác định hàm lượng Oxy hòa tan (DO) – Phương pháp đầu dò điện hóa', 'mg/L', 'TCVN 7325:2016', '0,1 mg/L', 35, 11),
  ('Nước dưới đất', 'Xác định hàm lượng Oxy hòa tan (DO) – Phương pháp đầu dò điện hóa', 'mg/L', 'TCVN 7325:2016', '0,1 mg/L', 35, 11),
  ('Nước mặt', 'Xác định hàm lượng tổng chất rắn hòa tan (TDS)', 'mg/L', 'SMEWW 2540C:2023', '6,0 mg/L', 36, 12),
  ('Nước dưới đất', 'Xác định hàm lượng tổng chất rắn hòa tan (TDS)', 'mg/L', 'SMEWW 2540C:2023', '6,0 mg/L', 36, 12),
  ('Nước mặt', 'Xác định hàm lượng tổng chất rắn lơ lửng (TSS) bằng cách lọc qua cái lọc sợi thủy tinh', 'mg/L', 'SMEWW 2540D:2023', '5 mg/L', 37, 13),
  ('Nước dưới đất', 'Xác định hàm lượng tổng chất rắn lơ lửng (TSS) bằng cách lọc qua cái lọc sợi thủy tinh', 'mg/L', 'SMEWW 2540D:2023', '5 mg/L', 37, 13),
  ('Nước mặt', 'Xác định độ kiềm phenolphtalein và độ kiềm tổng số', 'mg/L', 'SMEWW 2320B:2023', '17,0 mg/L', 38, 14),
  ('Nước dưới đất', 'Xác định độ kiềm phenolphtalein và độ kiềm tổng số', 'mg/L', 'SMEWW 2320B:2023', '17,0 mg/L', 38, 14),
  ('Nước mặt', 'Xác định độ dẫn điện (EC)', 'mS/m', 'TCVN 13086:2020', '1,36 mS/m', 39, 15),
  ('Nước dưới đất', 'Xác định độ dẫn điện (EC)', 'mS/m', 'TCVN 13086:2020', '1,36 mS/m', 39, 15),
  ('Nước mặt', 'Xác định pH', '', 'TCVN 6492:2011', '2 ~ 12', 40, 16),
  ('Nước dưới đất', 'Xác định pH', '', 'TCVN 6492:2011', '2 ~ 12', 40, 16),
  ('Nước mặt', 'Xác định hàm lượng Sunfat – Phương pháp trọng lượng sử dụng Bari clorua', 'mg/L', 'TCVN 6200:1996', '12,4 mg/L', 41, 17),
  ('Nước dưới đất', 'Xác định hàm lượng Sunfat – Phương pháp trọng lượng sử dụng Bari clorua', 'mg/L', 'TCVN 6200:1996', '12,4 mg/L', 41, 17),
  ('Phân bón', 'Xác định pH', '', 'TCVN 13263-9:2020', '2 ~ 12', 42, 1),
  ('Phân bón', 'Xác định hàm lượng nitơ hữu hiệu', '', 'TCVN 9295:2012', '', 43, 2),
  ('Phân bón', 'Xác định acid Humic và acid fulvic', '', 'TCVN 8561:2010', '', 44, 3),
  ('Phân bón', 'Xác định độ ẩm', '', 'TCVN 9297:2012', '', 45, 4),
  ('Phân bón', 'Xác định hàm lượng cacbon hữu cơ tổng số – Phương pháp Walkley Black', '%', 'TCVN 9294:2012', '0,22%', 46, 5),
  ('Phân bón', 'Xác định hàm lượng Nitơ tổng số – Phương pháp Kjeldahl', '%', 'TCVN 8557:2010', '0,052%', 47, 6),
  ('Phân bón', 'Xác định hàm lượng Phospho hữu hiệu', '%', 'TCVN 8559:2010', '0,13%', 48, 7),
  ('Phân bón', 'Xác định hàm lượng Phospho tổng số', '%', 'TCVN 8563:2010', '5,08%', 49, 8),
  ('Phân bón', 'Xác định hàm lượng Kali hữu hiệu', '%', 'TCVN 8560:2018', '0,1%', 50, 9),
  ('Phân bón', 'Xác định hàm lượng Pb tổng số – Phương pháp GF-AAS', 'mg/kg', 'TCVN 9290:2018', '0,5 mg/kg', 51, 10),
  ('Phân bón', 'Xác định hàm lượng Cd tổng số – Phương pháp GF-AAS', 'mg/kg', 'TCVN 9291:20158', '0,03 mg/kg', 52, 11),
  ('Phân bón', 'Xác định hàm lượng As tổng số – Phương pháp GF-AAS', 'mg/kg', 'TCVN 11403:2016', '0,5 mg/kg', 53, 12),
  ('Phân bón', 'Xác định hàm lượng Cu tổng số – Phương pháp F-AAS', 'mg/kg', 'TCVN 9286:2018', '3,0 mg/kg', 54, 13),
  ('Phân bón', 'Xác định hàm lượng Zn tổng số – Phương pháp F-AAS', 'mg/kg', 'TCVN 9289:2012', '4,0 mg/kg', 55, 14),
  ('Phân bón', 'Xác định hàm lượng Mn tổng số – Phương pháp F-AAS', 'mg/kg', 'TCVN 9288:2012', '6,0 mg/kg', 56, 15),
  ('Phân bón', 'Xác định hàm lượng Fe tổng số – Phương pháp F-AAS', 'mg/kg', 'TCVN 9283:2012', '6,0 mg/kg', 57, 16),
  ('Nước mặt', 'Xác định dư lượng thuốc bảo vệ thực vật nhóm phospho hữu cơ: Chlorpyrifos; Diazinon; Malthion; Ipropenfos; Dimethoate; Methyl parathion; Ethion; Fenthion; Dichorvos; Fenitrothion; Quinalphos; Anilofos – Phương pháp GC-MS', 'μg/L', 'AEMD-HD.M.SOP.GC/MS-02B:2025 (Ref: EPA SW-846 Method 3510 + Method 3520)', '0,02 μg/L mỗi chất', 58, 18),
  ('Rau, quả', 'Xác định dư lượng thuốc bảo vệ thực vật nhóm phospho hữu cơ: Chlorpyrifos; Diazinon; Malthion; Ipropenfos; Dimethoate; Methyl parathion; Ethion; Fenthion; Dichorvos; Fenitrothion; Quinalphos; Anilofos – Phương pháp GC-MS', '', 'AEMD-HD.M.SOP.GC/MS-02C:2025 (Ref: TCVN 12848:2020 + SANTE/11813/2017 + EN 15662:2018)', 'Mẫu tươi: 0,01 mg/kg · Mẫu khô: 0,02 mg/kg (mỗi chất)', 59, 1)

) as v(type_name, name, unit, method, loq, no, sort)
join public.sample_types st on st.name = v.type_name
on conflict (sample_type_id, name) do nothing;
