ALTER TABLE t_p65890965_refstaff_project.companies
  ADD COLUMN IF NOT EXISTS telegram text NULL,
  ADD COLUMN IF NOT EXISTS vk text NULL;