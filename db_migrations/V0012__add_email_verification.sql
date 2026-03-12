-- Создание таблицы для токенов подтверждения email
CREATE TABLE IF NOT EXISTS t_p65890965_refstaff_project.email_verification_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES t_p65890965_refstaff_project.users(id)
);

CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON t_p65890965_refstaff_project.email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON t_p65890965_refstaff_project.email_verification_tokens(user_id);

-- Добавление поля email_verified в таблицу users
ALTER TABLE t_p65890965_refstaff_project.users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

COMMENT ON TABLE t_p65890965_refstaff_project.email_verification_tokens IS 'Токены для подтверждения email адресов при регистрации';
COMMENT ON COLUMN t_p65890965_refstaff_project.email_verification_tokens.token IS 'Уникальный токен для подтверждения (32 символа hex)';
COMMENT ON COLUMN t_p65890965_refstaff_project.email_verification_tokens.expires_at IS 'Время истечения токена (обычно 24 часа)';
COMMENT ON COLUMN t_p65890965_refstaff_project.email_verification_tokens.verified_at IS 'Время подтверждения email (NULL если не подтверждён)';
