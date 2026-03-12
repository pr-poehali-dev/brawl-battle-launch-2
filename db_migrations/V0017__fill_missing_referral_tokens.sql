UPDATE t_p65890965_refstaff_project.vacancies 
SET referral_token = substring(md5(random()::text), 1, 12) 
WHERE referral_token IS NULL;