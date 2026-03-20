# 🎯 STUDIO27 - Uputstvo za Konfiguraciju API URL-a i Portova

## 📋 Sadržaj
1. [Pregled Arhitekture](#pregled-arhitekture)
2. [Korak po Korak Uputstvo](#korak-po-korak-uputstvo)
3. [Promjena API URL-a](#promjena-api-url-a)
4. [Promjena Portova](#promjena-portova)
5. [Testiranje](#testiranje)

---

## 🏗️ Pregled Arhitekture

### Frontend Aplikacije (Astro + React)
```
├── admin/          → Port 4000 (Admin Panel)
├── client/         → Port 3000 (Public Website)
└── webapp/         → Port 5000 (Student Dashboard)
```

### Backend (Java Spring Boot)
```
└── server/         → Port 8080 (API Server)
```

### Baza Podataka
```
└── MySQL/MariaDB   → Default: localhost:3306
```

---

## 🔧 KORAK PO KORAK UPUTSTVO

### KORAK 1: Environment Fajlovi Setup

#### Za Development (LOCAL):

**1.1 Root `.env.local` fajl** (već napravljen)
```bash
PUBLIC_API_URL=http://localhost:8080
VITE_API_URL=http://localhost:8080
```

**1.2 Kreiraj `.env.local` u svakoj Astro aplikaciji:**

**admin/.env.local**
```bash
PUBLIC_API_URL=http://localhost:8080
```

**client/.env.local**
```bash
PUBLIC_API_URL=http://localhost:8080
```

**webapp/.env.local**
```bash
PUBLIC_API_URL=http://localhost:8080
```

#### Za Production:

**1.3 Kreiraj `.env.production` fajlove sa tvojim domain-om:**

**admin/.env.production**
```bash
PUBLIC_API_URL=https://api.tvoj-domen.rs
```

**client/.env.production**
```bash
PUBLIC_API_URL=https://api.tvoj-domen.rs
```

**webapp/.env.production**
```bash
PUBLIC_API_URL=https://api.tvoj-domen.rs
```

---

## 🌐 Promjena API URL-a

### PROBLEM: Hardkodirani URL-i

Trenutno, API URL `http://api.studio27.rs` je hardkodiran na više mjesta:

**Fajlovi koji trebaju izmjenu:**
```
webapp/src/layouts/Layout.astro
webapp/src/pages/*.astro
webapp/src/react components/*.jsx
client/src/components/*.astro
admin/src/pages/*.astro
```

### RJEŠENJE: Koristi Environment Varijable

#### Za Astro Fajlove (.astro):

**PRIJE (Hardkodirano):**
```astro
const response = await fetch("http://api.studio27.rs/api/students", {
  headers: { Authorization: `Bearer ${token}` }
});
```

**NAKON (Sa ENV):**
```astro
---
const API_URL = import.meta.env.PUBLIC_API_URL || "http://localhost:8080";
const response = await fetch(`${API_URL}/api/students`, {
  headers: { Authorization: `Bearer ${token}` }
});
---
```

#### Za React Komponente (.tsx/.jsx):

**PRIJE:**
```jsx
const response = await fetch("http://api.studio27.rs/api/pohadjam-kurs?userId=" + userId)
```

**NAKON:**
```jsx
const API_URL = import.meta.env.PUBLIC_API_URL || "http://localhost:8080";
const response = await fetch(`${API_URL}/api/pohadjam-kurs?userId=${userId}`)
```

#### Za Astro Config:

**astro.config.mjs** (za sve tri aplikacije):
```javascript
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [react()],
  vite: {
    define: {
      'import.meta.env.PUBLIC_API_URL': JSON.stringify(
        process.env.PUBLIC_API_URL || 'http://localhost:8080'
      )
    }
  }
});
```

---

## 🔌 Promjena Portova

### Za Frontend Aplikacije:

**package.json - Dev Scriptovi:**

**admin/package.json:**
```json
{
  "scripts": {
    "dev": "astro dev --port 4000"  // Promijeni 4000 sa drugim portom
  }
}
```

**client/package.json:**
```json
{
  "scripts": {
    "dev": "astro dev --port 3000"  // Promijeni 3000 sa drugim portom
  }
}
```

**webapp/package.json:**
```json
{
  "scripts": {
    "dev": "astro dev --port 5000"  // Promijeni 5000 sa drugim portom
  }
}
```

### Za Backend (Java Spring Boot):

**server/src/main/resources/application.properties:**
```properties
server.port=8080  # Promijeni sa drugim portom
```

**ILI za development specifično:**

**server/src/main/resources/application-local.properties:**
```properties
server.port=8080  # Zamijeni sa željenim portom
```

Zatim pokreni sa:
```bash
mvn spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=local"
```

**ILI koristi environment varijablu:**
```bash
export SERVER_PORT=8080
mvn spring-boot:run -Dspring-boot.run.arguments="--server.port=${SERVER_PORT}"
```

---

## 🚀 Startovanje Aplikacija

### 1️⃣ Pokreni Backend (Java):
```bash
cd server
mvn clean install
mvn spring-boot:run
# Pristupa: http://localhost:8080
```

### 2️⃣ Pokreni Frontend Aplikacije (Astro):

**Terminal 1 - Admin Panel:**
```bash
cd admin
npm install
npm run dev
# Pristupa: http://localhost:4000
```

**Terminal 2 - Client Website:**
```bash
cd client
npm install
npm run dev
# Pristupa: http://localhost:3000
```

**Terminal 3 - Webapp:**
```bash
cd webapp
npm install
npm run dev
# Pristupa: http://localhost:5000
```

---

## ✅ Testiranje

### Provjeri konekciju sa backend-om:

```bash
# Windows PowerShell
$apiUrl = "http://localhost:8080/api/kursevi"
Invoke-WebRequest -Uri $apiUrl

# Unix/Linux/Mac
curl http://localhost:8080/api/kursevi
```

### Otidi u browser i provjeri:
- Admin: `http://localhost:4000` → Trebalo bi da se učita bez greške
- Client: `http://localhost:3000` → Trebalo bi da se učita bez greške
- Webapp: `http://localhost:5000` → Trebalo bi da se učita bez greške

---

## 🌍 DEPLOYMENT (Na Servers)

### Development Server:
```
Frontend:  http://dev.tvoj-domen.rs
API:       http://api-dev.tvoj-domen.rs:8080
```

### Production Server:
```
Frontend:  https://tvoj-domen.rs
API:       https://api.tvoj-domen.rs
```

**Koristi `.env.production` fajlove za production build:**

```bash
cd admin
npm run build  # Koristi .env.production
```

---

## 📝 Sažetak Promjena

| Fajl | Stara Vrijednost | Nova Vrijednost | Primjena |
|------|------------------|-----------------|----------|
| `.env.local` | - | `PUBLIC_API_URL=http://localhost:8080` | Environment varijable |
| `application.properties` | `server.port=8080` | `server.port=TVOJ_PORT` | Backend port |
| `package.json` | `--port 4000` | `--port TVOJ_PORT` | Frontend port |
| `*.astro` | `http://api.studio27.rs` | `${import.meta.env.PUBLIC_API_URL}` | API URL |
| `*.jsx/tsx` | `http://api.studio27.rs` | `import.meta.env.PUBLIC_API_URL` | API URL React |

---

## 🆘 Česti Problemi

### Problem 1: "Cannot GET /api/students"
**Uzrok:** API URL nije ispravan  
**Rješenje:** Provjeri da su `PUBLIC_API_URL` i backend URL isti

### Problem 2: Port je već u upotrebi
```bash
# Windows - Nađi što koristi port
netstat -ano | findstr :8080
taskkill /PID TASK_ID /F

# Unix/Linux
lsof -i :8080
kill -9 PID
```

### Problem 3: CORS Error
**Uzrok:** Backend nije dozvolio zahtjeve sa frontend adrese  
**Rješenje:** Konfiguruj CORS u spring boot aplikaciji

---

✅ **Sada možeš lako promijeniti URL i portove preko `.env` fajlova!**
