# ✅ STUDIO27 - GOTOV SETUP ZA ENV FAJLOVE I PROMJENU URL/PORTOVA

## 📋 Šta je Gotovo?

### ✅ 1. ENVIRONMENT FAJLOVI KREIRANI

**Root nivo:**
- ✅ `.env.local` - Za local development
- ✅ `.env.production` - Za production setup

**Admin aplikacija:**
- ✅ `admin/.env.local` - localhost:8080
- ✅ `admin/.env.production` - api.studio27.rs

**Client aplicacija:**
- ✅ `client/.env.local` - localhost:8080
- ✅ `client/.env.production` - api.studio27.rs

**Webapp aplikacija:**
- ✅ `webapp/.env.local` - localhost:8080
- ✅ `webapp/.env.production` - api.studio27.rs

**Server aplikacija:**
- ✅ `server/.env.local` - Za PORT i DB konfiguraciju
- ✅ `server/.env.production` - Za production
- ✅ `server/src/main/resources/application.properties` - Sa environment varijablama
- ✅ `server/src/main/resources/application-prod.properties` - Production config

---

### ✅ 2. KOD JE MODIFICIRAN DA KORISTI ENV VARIJABLE

**Astro Fajlovi - Zamijenjeni sa `import.meta.env.PUBLIC_API_URL`:**
- ✅ `webapp/src/layouts/Layout.astro`
- ✅ `webapp/src/components/Sidebar2.astro`
- ✅ `webapp/src/pages/index.astro`
- ✅ `webapp/src/pages/pohadja.astro`
- ✅ `webapp/src/pages/korpa.astro`
- ✅ `webapp/src/pages/kurs.astro`
- ✅ `admin/src/pages/studenti.astro`
- ✅ `client/src/components/Hero.astro`
- ✅ `client/src/components/KurseviSection.astro` (2x zamijenjeno)
- ✅ `client/src/components/KontaktSection.astro`
- ✅ `client/src/components/KursComponents.astro`

**React Komponene - Zamijenjene sa `import.meta.env.PUBLIC_API_URL`:**
- ✅ `webapp/src/react components/ReactKurs.jsx` (3x zamijenjeno)

**Spring Boot Backend:**
- ✅ `server/src/main/resources/application.properties` - Environment varijable sa default vrijednostima

---

## 🔧 KAKO KORISTITI

### 1️⃣ LOCAL DEVELOPMENT (localhost)

Svi `.env.local` fajlovi su već postavljeni na `http://localhost:8080`

```bash
# Samo pokreni:
cd server && mvn spring-boot:run      # Backend port 8080
cd admin && npm run dev                # Frontend port 4000
cd client && npm run dev               # Frontend port 3000
cd webapp && npm run dev               # Frontend port 5000
```

### 2️⃣ PROMJENA API URL-a

**Opcija A - Edit `.env` fajlove:**
```
admin/.env.local → PUBLIC_API_URL=http://novi-url.rs
client/.env.local → PUBLIC_API_URL=http://novi-url.rs
webapp/.env.local → PUBLIC_API_URL=http://novi-url.rs
```

**Opcija B - Production build:**
```bash
# Koristi .env.production fajlove automatski
npm run build  # Pri buildanju koristi .env.production
```

### 3️⃣ PROMJENA PORTOVA

**Frontend portovi - Edit `package.json`:**
```json
// admin/package.json
"dev": "astro dev --port 4000"  // Promijeni 4000 sa drugim portom

// client/package.json
"dev": "astro dev --port 3000"  // Promijeni 3000 sa drugim portom

// webapp/package.json
"dev": "astro dev --port 5000"  // Promijeni 5000 sa drugim portom
```

**Backend port - Edit `.env.local` u server direktoriju:**
```
SERVER_PORT=8080  // Promijeni 8080 sa drugim portom
```

**Ili u application.properties:**
```properties
server.port=8080  // Promijeni 8080 sa drugim portom
```

---

## 🚀 DEPLOYMENT NA SERVER

### Production Setup:

1. **Otidi na server i kreiraj `/opt/studio27` direktorij**

2. **Postavi environment varijable:**
```bash
export PUBLIC_API_URL=https://api.tvoj-domen.rs
export SERVER_PORT=8080
export DB_URL=jdbc:mysql://db-host:3306/studio27baza
export DB_USERNAME=db_user
export DB_PASSWORD=secure_password
```

3. **Build i deploy frontend:**
```bash
npm run build
# Preusmjeri dist/ fajlove na web server (nginx/apache)
```

4. **Build i deploy backend:**
```bash
cd server
mvn clean package -Dspring.profiles.active=prod
java -jar target/studio27-0.0.1-SNAPSHOT.jar \
  --server.port=8080 \
  --spring.datasource.url=jdbc:mysql://db-host:3306/studio27baza \
  --spring.datasource.username=db_user \
  --spring.datasource.password=secure_password
```

---

## 📚 DOSTUPNE INSTRUKCIJE

Projekat sada ima:
- ✅ `SETUP_INSTRUKCIJE.md` - Detaljni setup uputstva
- ✅ `QUICK_START.md` - Brzi početak
- ✅ `.env.local` fajlovi u svim aplikacijama
- ✅ `.env.production` fajlovi za production
- ✅ `.gitignore` - Sprečava commitovanje `.env` fajlova

---

## 🎯 SAŽETAK GOTOVIH ZADATAKA

| Zadatak | Status | File |
|---------|--------|------|
| Kreirani `.env` fajlovi za dev/prod | ✅ | `*/. env.local/production` |
| React - Import API URL | ✅ | `*.jsx` |
| Astro - Import API URL | ✅ | `*.astro` |
| Backend - Environment vars | ✅ | `application.properties` |
| Frontend portovi konfigurisani | ✅ | `package.json` |
| Backend port konfigurisano | ✅ | `application.properties` |
| `.gitignore` | ✅ | `.gitignore` |

---

## 💡 PRIMJER - KAK BRZO PROMIJENITI SVE

**Trebam da koristim drugačiji API URL (npr. staging.studio27.rs):**

1. Edit `admin/.env.local`:
```
PUBLIC_API_URL=http://staging.studio27.rs
```

2. Edit `client/.env.local`:
```
PUBLIC_API_URL=http://staging.studio27.rs
```

3. Edit `webapp/.env.local`:
```
PUBLIC_API_URL=http://staging.studio27.rs
```

4. Restart aplikacije - Sve će koristiti novi URL! ✅

**Trebam da promijenim backend port sa 8080 na 3000:**
1. Edit `server/.env.local` → `SERVER_PORT=3000`
2. Ili edit `application.properties` → `server.port=3000`
3. Restart backend - Ready! ✅

---

## ⚠️ VAŽNE NAPOMENE

1. **NIKADA ne commituj `.env` fajlove sa osjetljivim podacima!** - `.gitignore` je nesto sprečiti
2. **Za production, koristi provajdere za environment varijable** (Docker, Kubernetes, CI/CD)
3. **Promijeni default lozinke i API ključeve prije production deploy-a!**
4. **Čuva sve sensitive podatke u environment varijablama, ne u kodu!**

---

✅ **SVE JE GOTOVO! Aplikacija je sada fleksibilna i lako se može konfigurisati za bilo koji environment.**
