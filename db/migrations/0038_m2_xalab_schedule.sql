-- M2 giao diện giống XaLab – lịch công tác: "Thời gian làm việc" (VD 8h00 – 17h00) của một kế hoạch cá nhân.
-- Chỉ thêm cột.

alter table public.work_schedule add column if not exists work_time text;
