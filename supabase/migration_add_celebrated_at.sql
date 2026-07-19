-- MIGRATION: run this in the Supabase SQL editor if you already ran the
-- original schema.sql before this update. New projects don't need this —
-- it's already included in the main schema.sql file.

alter table goals add column if not exists celebrated_at timestamptz;
