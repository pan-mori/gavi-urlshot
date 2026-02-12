# GAVI URL Shortener

URL shortener pro statické QR kódy na tištěných materiálech. Umožňuje změnit cílovou URL bez nutnosti předělávat tištěné QR kódy.

## Features

- ✅ Krátké URL s custom kódy (např. `example.com/abc`)
- ✅ Změna cílové URL bez změny QR kódu
- ✅ Tracking prokliků s detailními statistikami
- ✅ Admin panel pro správu mappingů
- ✅ SQLite pro vývoj, Postgres pro produkci
- ✅ Jednoduchý deployment na Vercel

## Rychlý start

### 1. Instalace

```bash
npm install
```

### 2. Lokální vývoj

```bash
npm run dev
```

Server poběží na `http://localhost:3000`

- Admin panel: http://localhost:3000/admin
- Test redirect: http://localhost:3000/{short_code}

### 3. Vytvoření prvního mappingu

1. Otevři admin panel
2. Vyplň formulář:
   - **Krátký kód**: např. `abc`
   - **Cílová URL**: např. `https://youtube.com/watch?v=dQw4w9WgXcQ`
   - **Popis**: volitelný
3. Klikni "Vytvořit"
4. Otestuj: navštiv `http://localhost:3000/abc`

## Deployment na Vercel

### Krok 1: Připrav GitHub repo

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo>
git push -u origin main
```

### Krok 2: Import do Vercel

1. Jdi na [vercel.com](https://vercel.com)
2. Klikni "Add New Project"
3. Import z GitHub
4. Vyber tento repozitář

### Krok 3: Přidej Vercel Postgres

1. V projektu na Vercel jdi do "Storage"
2. Klikni "Create Database"
3. Vyber "Postgres"
4. Po vytvoření databáze se automaticky nastaví `POSTGRES_URL`

### Krok 4: Deploy

Vercel automaticky deployuje při každém push na main branch.

## Databázové schema

```sql
CREATE TABLE urls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  short_code TEXT UNIQUE NOT NULL,
  target_url TEXT NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE clicks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url_id INTEGER NOT NULL,
  clicked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  user_agent TEXT,
  referrer TEXT,
  FOREIGN KEY (url_id) REFERENCES urls(id) ON DELETE CASCADE
);
```

## API Endpoints

### Redirect
- `GET /:shortCode` - Redirect na cílovou URL + log click

### Admin API
- `GET /api/urls` - Seznam všech mappingů
- `POST /api/urls` - Vytvoř nový mapping
- `PUT /api/urls/:id` - Uprav mapping
- `DELETE /api/urls/:id` - Smaž mapping
- `GET /api/urls/:id/stats` - Statistiky prokliků

## Validace

### Short code
- 3-20 znaků
- Pouze `a-z`, `A-Z`, `0-9`, `_`, `-`
- Musí být unikátní

### Target URL
- Musí začínat `http://` nebo `https://`

## Struktura projektu

```
gavi_url/
├── package.json
├── vercel.json
├── db/
│   ├── init.sql               # SQL schema
│   └── database.sqlite        # SQLite DB (development)
├── src/
│   ├── index.js               # Express server
│   ├── db.js                  # Database abstrakce
│   └── routes/
│       ├── redirect.js        # Redirect handler
│       ├── admin.js           # Admin panel
│       └── api.js             # REST API
└── public/
    └── admin/
        ├── index.html         # Admin UI
        ├── style.css          # Styling
        └── app.js             # Frontend logic
```

## Příklad použití

1. Vytvoř QR kód odkazující na `yourdomain.com/promo2024`
2. V admin panelu vytvoř mapping:
   - Short code: `promo2024`
   - Target URL: `https://youtube.com/watch?v=originalvideo`
3. Vytiskni QR kód na letáky
4. Když se video změní, stačí v admin panelu změnit Target URL na nové video
5. QR kód stále funguje, přesměruje na novou URL

## Bezpečnost

- Validace všech vstupů
- Prepared statements (SQL injection protection)
- Rate limiting na Vercel úrovni

## Technologie

- **Backend**: Node.js + Express
- **Database**: SQLite (dev) / Vercel Postgres (prod)
- **Frontend**: Vanilla HTML/CSS/JS
- **Deployment**: Vercel Serverless

## License

MIT
