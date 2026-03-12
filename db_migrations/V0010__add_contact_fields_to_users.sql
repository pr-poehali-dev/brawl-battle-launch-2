-- Добавляем поля контактов для сотрудников
ALTER TABLE t_p65890965_refstaff_project.users 
ADD COLUMN IF NOT EXISTS telegram VARCHAR(100),
ADD COLUMN IF NOT EXISTS vk VARCHAR(100);