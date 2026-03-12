-- Создание таблицы для хранения сообщений с формы обратной связи
CREATE TABLE IF NOT EXISTS t_p65890965_refstaff_project.contact_messages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    replied_at TIMESTAMP NULL
);

-- Индекс для быстрого поиска непрочитанных сообщений
CREATE INDEX IF NOT EXISTS idx_contact_messages_is_read ON t_p65890965_refstaff_project.contact_messages(is_read);

-- Индекс для сортировки по дате
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON t_p65890965_refstaff_project.contact_messages(created_at DESC);

COMMENT ON TABLE t_p65890965_refstaff_project.contact_messages IS 'Сообщения с формы обратной связи сайта';
COMMENT ON COLUMN t_p65890965_refstaff_project.contact_messages.name IS 'Имя отправителя';
COMMENT ON COLUMN t_p65890965_refstaff_project.contact_messages.email IS 'Email отправителя для связи';
COMMENT ON COLUMN t_p65890965_refstaff_project.contact_messages.message IS 'Текст сообщения';
COMMENT ON COLUMN t_p65890965_refstaff_project.contact_messages.is_read IS 'Флаг прочитанного сообщения';
COMMENT ON COLUMN t_p65890965_refstaff_project.contact_messages.replied_at IS 'Дата ответа на сообщение';
