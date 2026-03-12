-- Создание таблицы для токенов восстановления пароля
CREATE TABLE IF NOT EXISTS t_p65890965_refstaff_project.password_reset_tokens (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индекс для быстрого поиска по токену
CREATE INDEX idx_password_reset_token ON t_p65890965_refstaff_project.password_reset_tokens(token);

-- Индекс для поиска по email
CREATE INDEX idx_password_reset_email ON t_p65890965_refstaff_project.password_reset_tokens(email);