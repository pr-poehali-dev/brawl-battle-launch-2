-- Создание схемы для проекта RefStaff
CREATE SCHEMA IF NOT EXISTS t_p65890965_refstaff_project;

-- Таблица компаний
CREATE TABLE IF NOT EXISTS t_p65890965_refstaff_project.companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    employee_count INTEGER DEFAULT 0,
    invite_token VARCHAR(100) UNIQUE DEFAULT substring(md5(random()::text), 1, 16),
    logo_url TEXT,
    description TEXT,
    website VARCHAR(255),
    industry VARCHAR(100),
    subscription_end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица пользователей (сотрудники и работодатели)
CREATE TABLE IF NOT EXISTS t_p65890965_refstaff_project.users (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES t_p65890965_refstaff_project.companies(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    position VARCHAR(150),
    department VARCHAR(100),
    role VARCHAR(50) DEFAULT 'employee',
    level INTEGER DEFAULT 1,
    experience_points INTEGER DEFAULT 0,
    total_recommendations INTEGER DEFAULT 0,
    successful_hires INTEGER DEFAULT 0,
    total_earnings DECIMAL(12, 2) DEFAULT 0,
    wallet_balance DECIMAL(12, 2) DEFAULT 0,
    wallet_pending DECIMAL(12, 2) DEFAULT 0,
    avatar_url TEXT,
    is_hr_manager BOOLEAN DEFAULT FALSE,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица вакансий
CREATE TABLE IF NOT EXISTS t_p65890965_refstaff_project.vacancies (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES t_p65890965_refstaff_project.companies(id),
    title VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    salary_display VARCHAR(100),
    requirements TEXT,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    reward_amount DECIMAL(12, 2) DEFAULT 30000,
    payout_delay_days INTEGER DEFAULT 30,
    referral_token VARCHAR(100) UNIQUE DEFAULT substring(md5(random()::text), 1, 12),
    created_by INTEGER REFERENCES t_p65890965_refstaff_project.users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица рекомендаций
CREATE TABLE IF NOT EXISTS t_p65890965_refstaff_project.recommendations (
    id SERIAL PRIMARY KEY,
    vacancy_id INTEGER REFERENCES t_p65890965_refstaff_project.vacancies(id),
    recommended_by INTEGER REFERENCES t_p65890965_refstaff_project.users(id),
    candidate_name VARCHAR(255) NOT NULL,
    candidate_email VARCHAR(255) NOT NULL,
    candidate_phone VARCHAR(50),
    comment TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    reward_amount DECIMAL(12, 2) DEFAULT 30000,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица отложенных выплат
CREATE TABLE IF NOT EXISTS t_p65890965_refstaff_project.pending_payouts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES t_p65890965_refstaff_project.users(id),
    recommendation_id INTEGER REFERENCES t_p65890965_refstaff_project.recommendations(id),
    amount DECIMAL(12, 2) NOT NULL,
    unlock_date TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unlocked_at TIMESTAMP
);

-- Таблица транзакций кошелька
CREATE TABLE IF NOT EXISTS t_p65890965_refstaff_project.wallet_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES t_p65890965_refstaff_project.users(id),
    amount DECIMAL(12, 2) NOT NULL,
    type VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица чатов
CREATE TABLE IF NOT EXISTS t_p65890965_refstaff_project.chats (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES t_p65890965_refstaff_project.companies(id),
    employee_id INTEGER REFERENCES t_p65890965_refstaff_project.users(id),
    last_message_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица сообщений в чатах
CREATE TABLE IF NOT EXISTS t_p65890965_refstaff_project.chat_messages (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER REFERENCES t_p65890965_refstaff_project.chats(id),
    sender_id INTEGER REFERENCES t_p65890965_refstaff_project.users(id),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_users_company_id ON t_p65890965_refstaff_project.users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON t_p65890965_refstaff_project.users(email);
CREATE INDEX IF NOT EXISTS idx_vacancies_company_id ON t_p65890965_refstaff_project.vacancies(company_id);
CREATE INDEX IF NOT EXISTS idx_vacancies_status ON t_p65890965_refstaff_project.vacancies(status);
CREATE INDEX IF NOT EXISTS idx_recommendations_vacancy_id ON t_p65890965_refstaff_project.recommendations(vacancy_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_recommended_by ON t_p65890965_refstaff_project.recommendations(recommended_by);
CREATE INDEX IF NOT EXISTS idx_recommendations_status ON t_p65890965_refstaff_project.recommendations(status);
CREATE INDEX IF NOT EXISTS idx_pending_payouts_user_id ON t_p65890965_refstaff_project.pending_payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_payouts_unlock_date ON t_p65890965_refstaff_project.pending_payouts(unlock_date);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON t_p65890965_refstaff_project.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_company_id ON t_p65890965_refstaff_project.chats(company_id);
CREATE INDEX IF NOT EXISTS idx_chats_employee_id ON t_p65890965_refstaff_project.chats(employee_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_id ON t_p65890965_refstaff_project.chat_messages(chat_id);