-- Добавляем новые поля в таблицу companies для профиля компании
ALTER TABLE t_p65890965_refstaff_project.companies
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS invite_token TEXT UNIQUE;

-- Создаем индекс для быстрого поиска по invite_token
CREATE INDEX IF NOT EXISTS idx_companies_invite_token ON t_p65890965_refstaff_project.companies(invite_token);

-- Генерируем уникальные токены для существующих компаний
UPDATE t_p65890965_refstaff_project.companies
SET invite_token = md5(random()::text || clock_timestamp()::text)
WHERE invite_token IS NULL;

-- Добавляем новые поля в таблицу users
ALTER TABLE t_p65890965_refstaff_project.users
ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS wallet_pending DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS is_hr_manager BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Создаем таблицу для отложенных выплат
CREATE TABLE IF NOT EXISTS t_p65890965_refstaff_project.pending_payouts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES t_p65890965_refstaff_project.users(id),
    recommendation_id INTEGER NOT NULL REFERENCES t_p65890965_refstaff_project.recommendations(id),
    amount DECIMAL(10, 2) NOT NULL,
    unlock_date TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pending_payouts_user ON t_p65890965_refstaff_project.pending_payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_payouts_unlock ON t_p65890965_refstaff_project.pending_payouts(unlock_date, status);

-- Создаем таблицу для истории транзакций кошелька
CREATE TABLE IF NOT EXISTS t_p65890965_refstaff_project.wallet_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES t_p65890965_refstaff_project.users(id),
    amount DECIMAL(10, 2) NOT NULL,
    type VARCHAR(20) NOT NULL,
    description TEXT,
    recommendation_id INTEGER REFERENCES t_p65890965_refstaff_project.recommendations(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user ON t_p65890965_refstaff_project.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created ON t_p65890965_refstaff_project.wallet_transactions(created_at);

-- Создаем таблицу для чатов
CREATE TABLE IF NOT EXISTS t_p65890965_refstaff_project.chats (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES t_p65890965_refstaff_project.companies(id),
    employee_id INTEGER NOT NULL REFERENCES t_p65890965_refstaff_project.users(id),
    last_message_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_chats_company ON t_p65890965_refstaff_project.chats(company_id);
CREATE INDEX IF NOT EXISTS idx_chats_employee ON t_p65890965_refstaff_project.chats(employee_id);

-- Создаем таблицу для сообщений в чатах
CREATE TABLE IF NOT EXISTS t_p65890965_refstaff_project.chat_messages (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER NOT NULL REFERENCES t_p65890965_refstaff_project.chats(id),
    sender_id INTEGER NOT NULL REFERENCES t_p65890965_refstaff_project.users(id),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_chat ON t_p65890965_refstaff_project.chat_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON t_p65890965_refstaff_project.chat_messages(created_at);

-- Добавляем поле для реферальной ссылки в вакансии
ALTER TABLE t_p65890965_refstaff_project.vacancies
ADD COLUMN IF NOT EXISTS referral_token TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_vacancies_referral_token ON t_p65890965_refstaff_project.vacancies(referral_token);

-- Генерируем токены для существующих вакансий
UPDATE t_p65890965_refstaff_project.vacancies
SET referral_token = md5(random()::text || clock_timestamp()::text || id::text)
WHERE referral_token IS NULL;