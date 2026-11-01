-- Bỏ phần mềm M4 (Nghiên cứu – dịch vụ – tra cứu KH&CN).
-- Bảng đếm lượt cổng công khai vẫn dùng cho phản hồi lô cây giống (M3.1.6) → chuyển sang public trước khi xóa schema m4.
do $$
begin
  if to_regclass('m4.public_hits') is not null and to_regclass('public.public_hits') is null then
    alter table m4.public_hits set schema public;
  end if;
end $$;

create table if not exists public.public_hits (
  id        bigserial primary key,
  action    text not null,                            -- feedback
  ip_hash   text not null,
  at        timestamptz default now()
);
create index if not exists idx_public_hits_action_ip on public.public_hits(action, ip_hash, at desc);

-- Cột M3 trỏ sang bảng M4
alter table m3_tissue.orders   drop column if exists contract_id;
alter table m3_breed.varieties drop column if exists ip_asset_id;
alter table m3_breed.varieties drop column if exists guide_knowledge_id;

drop schema if exists m4 cascade;
