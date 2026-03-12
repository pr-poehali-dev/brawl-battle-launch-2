-- Добавляем поле для настраиваемого срока выплаты в вакансии (в днях)
ALTER TABLE t_p65890965_refstaff_project.vacancies
ADD COLUMN IF NOT EXISTS payout_delay_days INTEGER DEFAULT 30;

-- Обновляем существующие вакансии
UPDATE t_p65890965_refstaff_project.vacancies
SET payout_delay_days = 30
WHERE payout_delay_days IS NULL;