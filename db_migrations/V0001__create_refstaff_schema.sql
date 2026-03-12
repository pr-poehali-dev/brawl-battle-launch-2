-- RefStaff Database Schema

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    logo_url VARCHAR(500),
    subscription_tier VARCHAR(50) DEFAULT 'trial',
    subscription_expires_at TIMESTAMP,
    employee_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users/Employees table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    position VARCHAR(150),
    department VARCHAR(150),
    role VARCHAR(50) DEFAULT 'employee',
    avatar_url VARCHAR(500),
    level INTEGER DEFAULT 1,
    experience_points INTEGER DEFAULT 0,
    total_recommendations INTEGER DEFAULT 0,
    successful_hires INTEGER DEFAULT 0,
    total_earnings DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vacancies table
CREATE TABLE IF NOT EXISTS vacancies (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id),
    title VARCHAR(255) NOT NULL,
    department VARCHAR(150),
    salary_min DECIMAL(10, 2),
    salary_max DECIMAL(10, 2),
    salary_display VARCHAR(100),
    requirements TEXT,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    reward_amount DECIMAL(10, 2) DEFAULT 30000,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP
);

-- Recommendations table
CREATE TABLE IF NOT EXISTS recommendations (
    id SERIAL PRIMARY KEY,
    vacancy_id INTEGER REFERENCES vacancies(id),
    recommended_by INTEGER REFERENCES users(id),
    candidate_name VARCHAR(255) NOT NULL,
    candidate_email VARCHAR(255) NOT NULL,
    candidate_phone VARCHAR(50),
    resume_url VARCHAR(500),
    comment TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    reward_amount DECIMAL(10, 2) DEFAULT 30000,
    paid_at TIMESTAMP,
    reviewed_by INTEGER REFERENCES users(id),
    reviewed_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    requirement_type VARCHAR(50),
    requirement_value INTEGER,
    xp_reward INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User achievements junction table
CREATE TABLE IF NOT EXISTS user_achievements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    achievement_id INTEGER REFERENCES achievements(id),
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, achievement_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_vacancies_company ON vacancies(company_id);
CREATE INDEX IF NOT EXISTS idx_vacancies_status ON vacancies(status);
CREATE INDEX IF NOT EXISTS idx_recommendations_vacancy ON recommendations(vacancy_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_user ON recommendations(recommended_by);
CREATE INDEX IF NOT EXISTS idx_recommendations_status ON recommendations(status);

-- Insert default achievements
INSERT INTO achievements (name, description, icon, requirement_type, requirement_value, xp_reward) VALUES
('Первая рекомендация', 'Отправьте свою первую рекомендацию', 'Star', 'recommendations', 1, 50),
('Меткий глаз', 'Рекомендуйте 3 успешных кандидата', 'Target', 'successful_hires', 3, 200),
('Рекрутер месяца', 'Рекомендуйте 5 успешных кандидатов за месяц', 'Award', 'successful_hires', 5, 500),
('Новичок', 'Достигните уровня 2', 'Zap', 'level', 2, 100),
('Профессионал', 'Достигните уровня 5', 'Crown', 'level', 5, 300),
('Легенда', 'Достигните уровня 10', 'Trophy', 'level', 10, 1000);