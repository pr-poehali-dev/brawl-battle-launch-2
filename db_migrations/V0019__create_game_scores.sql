CREATE TABLE t_p65890965_refstaff_project.game_scores (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES t_p65890965_refstaff_project.users(id),
  game VARCHAR(50) NOT NULL,
  score INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT game_scores_user_game_unique UNIQUE(user_id, game)
);