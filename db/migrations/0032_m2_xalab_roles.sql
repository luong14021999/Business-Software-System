-- M2 giai đoạn 9: thay vai trò cũ của phòng thí nghiệm bằng vai trò theo XaLab (khớp LEGACY_ROLE_MAP trong permissions.ts).
--   Trưởng phòng  → Quản lý + Nuôi cấy mô + Giống (giữ quyền M3.1 / M3.2 vốn có của Trưởng phòng)
--   QA/QC         → Quản lý
--   KTV           → NV phân tích
--   Tiếp nhận mẫu → NV nhận mẫu
-- Vai trò khác (Quản trị, Lãnh đạo Viện, Nuôi cấy mô, Giống, Quản lý danh mục, Chỉ xem) giữ nguyên; bỏ trùng.

with m(old_role, new_role) as (
  values ('Trưởng phòng', 'Quản lý'), ('Trưởng phòng', 'Nuôi cấy mô'), ('Trưởng phòng', 'Giống'),
         ('QA/QC', 'Quản lý'), ('KTV', 'NV phân tích'), ('Tiếp nhận mẫu', 'NV nhận mẫu')
)
update public.user_roles u
set roles = (
      select coalesce(jsonb_agg(distinct x order by x), '[]'::jsonb)
      from (
        select coalesce(m.new_role, r) x
        from jsonb_array_elements_text(u.roles) r
        left join m on m.old_role = r
      ) t
    ),
    note = trim(both ' ' from concat_ws(' · ', nullif(u.note, ''), 'Đổi vai trò theo XaLab (GĐ9): ' || (select string_agg(r, ', ') from jsonb_array_elements_text(u.roles) r))),
    updated_by = 'migration 0032',
    updated_at = now()
where u.roles ?| array['Trưởng phòng', 'QA/QC', 'KTV', 'Tiếp nhận mẫu'];
