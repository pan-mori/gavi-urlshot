-- Tabulka URL mappingů
CREATE TABLE IF NOT EXISTS urls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  short_code TEXT UNIQUE NOT NULL,      -- např. "abc", "xyz123"
  target_url TEXT NOT NULL,              -- skutečná URL (YouTube/Spotify)
  description TEXT,                      -- poznámka co to je (volitelné)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabulka pro tracking prokliků
CREATE TABLE IF NOT EXISTS clicks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url_id INTEGER NOT NULL,
  clicked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  user_agent TEXT,                       -- pro zajímavost jaké zařízení
  referrer TEXT,                         -- odkud přišel (obvykle null u QR)
  FOREIGN KEY (url_id) REFERENCES urls(id) ON DELETE CASCADE
);

-- Indexy pro rychlé vyhledávání
CREATE INDEX IF NOT EXISTS idx_short_code ON urls(short_code);
CREATE INDEX IF NOT EXISTS idx_url_id ON clicks(url_id);
CREATE INDEX IF NOT EXISTS idx_clicked_at ON clicks(clicked_at);
