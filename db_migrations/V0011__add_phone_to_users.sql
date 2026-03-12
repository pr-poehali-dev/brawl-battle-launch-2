-- Добавляем поле phone для хранения телефона сотрудников
ALTER TABLE t_p65890965_refstaff_project.users 
ADD COLUMN IF NOT EXISTS phone VARCHAR(50);