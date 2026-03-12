-- Таблица для запросов на выплаты от сотрудников
CREATE TABLE IF NOT EXISTS t_p65890965_refstaff_project.payout_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES t_p65890965_refstaff_project.users(id),
  amount NUMERIC(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
  payment_method VARCHAR(100),
  payment_details TEXT,
  admin_comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewed_by INTEGER REFERENCES t_p65890965_refstaff_project.users(id)
);

-- Индекс для быстрого поиска запросов пользователя
CREATE INDEX idx_payout_requests_user_id ON t_p65890965_refstaff_project.payout_requests(user_id);

-- Индекс для фильтрации по статусу
CREATE INDEX idx_payout_requests_status ON t_p65890965_refstaff_project.payout_requests(status);