-- Добавляем поле ИНН в таблицу компаний
ALTER TABLE t_p65890965_refstaff_project.companies 
ADD COLUMN inn VARCHAR(12) NULL;

-- Создаем уникальный индекс для ИНН (игнорируя NULL)
CREATE UNIQUE INDEX idx_companies_inn_unique ON t_p65890965_refstaff_project.companies(inn) 
WHERE inn IS NOT NULL;

-- Комментарий для поля
COMMENT ON COLUMN t_p65890965_refstaff_project.companies.inn IS 'ИНН компании (10 цифр для юр.лиц, 12 для ИП), должен быть уникальным';