
CREATE TABLE t_p65890965_refstaff_project.employee_chats (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES t_p65890965_refstaff_project.companies(id),
    participant1_id INTEGER NOT NULL REFERENCES t_p65890965_refstaff_project.users(id),
    participant2_id INTEGER NOT NULL REFERENCES t_p65890965_refstaff_project.users(id),
    last_message_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(participant1_id, participant2_id)
);

CREATE TABLE t_p65890965_refstaff_project.employee_messages (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER NOT NULL REFERENCES t_p65890965_refstaff_project.employee_chats(id),
    sender_id INTEGER NOT NULL REFERENCES t_p65890965_refstaff_project.users(id),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_employee_chats_company ON t_p65890965_refstaff_project.employee_chats(company_id);
CREATE INDEX idx_employee_chats_p1 ON t_p65890965_refstaff_project.employee_chats(participant1_id);
CREATE INDEX idx_employee_chats_p2 ON t_p65890965_refstaff_project.employee_chats(participant2_id);
CREATE INDEX idx_employee_messages_chat ON t_p65890965_refstaff_project.employee_messages(chat_id);
CREATE INDEX idx_employee_messages_sender ON t_p65890965_refstaff_project.employee_messages(sender_id);
