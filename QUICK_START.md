# 🚀 STUDIO27 - BRZI SETUP GUIDE

## ⚡ INSTANT SETUP (Samo kopirati i pokrenuti!)

### 1️⃣ Kreiraj `.env` fajlove sa desnom vrijednostima:

**ROOT .env.local:**
```bash
PUBLIC_API_URL=http://localhost:8080
```

### 2️⃣ Pokreni sve aplikacije:

**Terminal 1 - Backend (Java):**
```bash
cd server
mvn spring-boot:run
# http://localhost:8080
```

**Terminal 2 - Admin Panel:**
```bash
cd admin
npm install
npm run dev
# http://localhost:4000
```

**Terminal 3 - Client Website:**
```bash
cd client
npm install
npm run dev
# http://localhost:3000
```

**Terminal 4 - Webapp (Student Dashboard):**
```bash
cd webapp
npm install
npm run dev
# http://localhost:5000
```

---

## 🔄 PROMJENA PORTOVA

### Za Frontend:
Uredi `package.json` u svakoj aplikaciji:
```json
// admin/package.json
"scripts": { "dev": "astro dev --port NOVI_PORT" }
```

### Za Backend:
Promijeni u `.env.local`:
```
SERVER_PORT=9090
```

---

## 🌐 PROMJENA API URL-a

### Development (Local):
**admin/.env.local, client/.env.local, webapp/.env.local:**
```
PUBLIC_API_URL=http://localhost:8080
```

### Production:
**admin/.env.production, client/.env.production, webapp/.env.production:**
```
PUBLIC_API_URL=https://api.studio27.rs
```

Ili sa drugom domenom:
```
PUBLIC_API_URL=https://tvoj-api.domen.rs
```

---

## 📦 BUILD I DEPLOY

### Build Frontend za Production:
```bash
cd admin && npm run build
cd client && npm run build
cd webapp && npm run build
```

### Build Backend za Production:
```bash
cd server
mvn clean package -Dspring.profiles.active=prod
```

---

## ✅ Testiranje Konekcije

```bash
# Provjeri je li backend dostupan
curl http://localhost:8080/api/kursevi

# Ili u PowerShell
Invoke-WebRequest -Uri http://localhost:8080/api/kursevi
```

---

## 🆘 Česti Problemi

| Problem | Rješenje |
|---------|----------|
| `EADDRINUSE: address already in use :8080` | Port je zauzet. Promijeni port u `.env` ili ubij proces na portu |
| `Cannot GET /api/students` | `PUBLIC_API_URL` nije postavljen ispravan. Provjeri `.env` fajl |
| `CORS error` | Backend odbija zahtjeve. Trebam CORS konfiguraciju |
| `Cannot find module` | Pokreni `npm install` u direktoriju aplikacije |

---

## 📝 Gdje se nalaze ključne datoteke?

| Što trebam | Gdje se nalazi |
|-----------|----------------|
| Frontend env URL | `admin/client/webapp/.env.local` |
| Backend port | `server/.env.local` ili `application.properties` |
| API pozivi | `src/pages/*.astro` / `src/react components/*.jsx` |
| Backend config | `server/src/main/resources/application.properties` |

---

## 🎯 Sažetak Promjena

✅ **Završeno:**
- [x] Kreirani `.env` fajlovi za svaku aplikaciju
- [x] Zamijenjeni hardkodirani URL-i sa `import.meta.env.PUBLIC_API_URL`
- [x] Backend Spring Boot konfiguriran sa environment varijablama
- [x] Portovi su konfigurisani i lako se mogu promijeniti
- [x] `.gitignore` sprečava slučajno commitovanje `.env` fajlova

**SADA MOŽEŠ:**
1. Lako promijeniti API URL samo edit .env fajla
2. Koristiti različite URL-e za dev/prod bez menjanja koda
3. Lako promijeniti portove
4. Deploy u bilo gdje sa bilo kojim konfiguracijama

---

Detaljan SETUP_INSTRUKCIJE.md već postoji za dublje razumevanje! 📚
