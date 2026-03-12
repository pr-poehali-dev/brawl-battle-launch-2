CREATE TABLE IF NOT EXISTS "t_p69906210_brawl_battle_launch_".users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  crystals INTEGER DEFAULT 0,
  coins INTEGER DEFAULT 100,
  beauty_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  xp_max INTEGER DEFAULT 100,
  vip_style BOOLEAN DEFAULT FALSE,
  profile_icon VARCHAR(10) DEFAULT '🎮',
  active_title VARCHAR(100) DEFAULT '',
  heart_collected BOOLEAN DEFAULT FALSE,
  letter_collected BOOLEAN DEFAULT FALSE,
  daily_gift_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "t_p69906210_brawl_battle_launch_".purchases (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES "t_p69906210_brawl_battle_launch_".users(id),
  item_id INTEGER NOT NULL,
  item_name VARCHAR(100) NOT NULL,
  price INTEGER NOT NULL,
  result VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "t_p69906210_brawl_battle_launch_".user_titles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES "t_p69906210_brawl_battle_launch_".users(id),
  title VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
