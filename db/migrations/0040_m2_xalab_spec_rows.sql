-- M2 giao diện giống XaLab – Cột quy chuẩn: "Giá trị khi in" của từng chỉ tiêu (trống = in theo tối thiểu / tối đa).
-- Chỉ thêm cột.

alter table public.specification_limits add column if not exists print_text text;
