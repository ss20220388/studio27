# 🔐 Environment Configuration Setup

## Overview
Ovaj projekat koristi environment fajlove za konfiguraciju. **Environment fajlovi se NIKADA ne pushuju na git** jer sadrže osetljive podatke (lozinke, tajne ključeve, itd).

## Setup Instrukcije

### 1. Kloniranje Repozitorijuma
```bash
git clone https://github.com/your-repo/studio27.git
cd studio27
```

### 2. Kreiranje `.env` Fajlova na Lokalnoj Mašini

Svaki `.env.example` fajl je template. Trebate da kreirate `.env.local` ili `.env.production` fajlove u svakoj direktorijumi:

#### **Backend (`server/`)**
```bash
cd server
cp .env.example .env.local
# Uredite .env.local sa vašim stvarnim vrednostima:
# - DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD (MySQL kredencijali)
# - SERVER_PORT (obično 8080 za local, promeniti ako trebate)
# - JWT_SECRET (tajni kljuc za JWT tokene)
```

#### **Admin Panel (`admin/`)**
```bash
cd admin
cp .env.example .env.local
# Uredite .env.local:
# - PUBLIC_API_URL=http://localhost:8080 (za local development)
# - PUBLIC_API_URL=http://api.studio27.rs (za production)
```

#### **Client Website (`client/`)**
```bash
cd client
cp .env.example .env.local
# Uredite .env.local sa adresom API servera
```

#### **Student Webapp (`webapp/`)**
```bash
cd webapp
cp .env.example .env.local
# Uredite .env.local sa adresom API servera
```

### 3. Automatski Setup (opciono)
Ako trebate brzi setup, kopirajte sve `.env.example` fajlove odjednom:

```bash
# Iz root direktorijuma
cp .env.example .env.local
cp admin/.env.example admin/.env.local
cp client/.env.example client/.env.local
cp webapp/.env.example webapp/.env.local
cp server/.env.example server/.env.local
```

Zatim uredite svaki `.env.local` sa stvarnim vrednostima.

## 🔒 Bezbednost

### ✅ DO (Uradi)
- ✅ Čuva `.env.local` lokalno na svojoj mašini
- ✅ Koristi `.env.example` kao template
- ✅ Koristi `.gitignore` da spreči pushovanje `.env` fajlova
- ✅ Deli `.env.example` (bez osetljivih podataka) sa timom preko git-a

### ❌ DONT (Nemoj)
- ❌ Nikada ne commit-uj `.env.local` ili `.env.production`
- ❌ Nikada ne deli lozinke ili tajne ključeve preko email-a
- ❌ Nikada ne unos-o hardkod osetljive podatke u `.js` ili `.java` fajlove

## .env.local vs .env.production

### Local Development (`.env.local`)
```
PUBLIC_API_URL=http://localhost:8080
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=local_password
```

### Production (`.env.production`)
```
PUBLIC_API_URL=http://api.studio27.rs
DB_HOST=prod.database.server.com
DB_USER=prod_user
DB_PASSWORD=production_password_secret
```

## Kako Aplikacija Čita Environment Varijable?

### Frontend (Astro/React)
```javascript
// U .astro komponentama ili React komponentama:
const apiUrl = import.meta.env.PUBLIC_API_URL;
// Koristi: http://localhost:8080 ili http://api.studio27.rs
```

### Backend (Spring Boot)
```properties
# U application.properties se koriste varijable:
server.port=${SERVER_PORT:8080}
spring.datasource.url=jdbc:mysql://${DB_HOST}:${DB_PORT}/${DB_NAME}
spring.datasource.username=${DB_USER}
spring.datasource.password=${DB_PASSWORD}
```

## Troubleshooting

**Problem: "502 Bad Gateway"**
- Proverite da je backend pokrenut: `cd server && ./mvnw.cmd spring-boot:run`
- Proverite da je `PUBLIC_API_URL` pogrešne vrednosti
- Proverite da nginx preusmeri na `localhost:8080`

**Problem: "Cannot connect to database"**
- Proverite MySQL je pokrenut na `localhost:3306`
- Proverite `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` u `.env.local`

**Problem: "Konfiguracija se ne učitava"**
- Proverite da je `.env.local` u odgovarajućoj direktorijumi (admin/, client/, server/, itd)
- Proverite da nema razlike u nazivu (`.env-local` umesto `.env.local`)

## Dodeljene Direktorijumi za `.env` Fajlove

```
studio27/
├── .env.example                    (template - pusha se na git)
├── .env.local                       (lokalni - NE pusha se)
├── .env.production                 (production - NE pusha se)
│
├── admin/
│   ├── .env.example
│   ├── .env.local
│   └── .env.production
│
├── client/
│   ├── .env.example
│   ├── .env.local
│   └── .env.production
│
├── webapp/
│   ├── .env.example
│   ├── .env.local
│   └── .env.production
│
└── server/
    ├── .env.example
    ├── .env.local
    └── .env.production
```

## Startovanje Aplikacije

```bash
# Terminal 1 - Backend
cd server
.\mvnw.cmd spring-boot:run
# Backend će biti na http://localhost:8080

# Terminal 2 - Admin Panel
cd admin
npm run dev
# Admin će biti na http://localhost:4000

# Terminal 3 - Client Website
cd client
npm run dev
# Client će biti na http://localhost:3000

# Terminal 4 - Student Webapp
cd webapp
npm run dev
# Webapp će biti na http://localhost:5000
```

## Pitanja?

Ako imate pitanja o environment konfiguraciji, proverite `.env.example` fajlove ili kontaktirajte tim.
