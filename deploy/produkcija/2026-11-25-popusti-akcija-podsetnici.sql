-- Izmene baze za objavu "popusti kurseva, akcija na početnoj, podsetnici, Black Friday" (25.11.2026.)
--
-- Isto ovo server radi sam pri pokretanju (config/SemaBaze.java). Skripta služi da se baza pripremi
-- PRE puštanja nove verzije. Na kraju upisuje korake u sema_izmene, pa ih server posle neće ponavljati.
-- Stara verzija servera radi normalno i sa ovim izmenama: dodaju se samo nove kolone i tabele.
--
-- Pokretanje (prvo backup!):
--   mysql -u <korisnik> -p studio27baza < 2026-11-25-popusti-akcija-podsetnici.sql
-- Skripta sme da se pokrene i više puta: kolone se dodaju samo ako ne postoje, a podaci samo ako još nisu upisani.

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS s27_dodaj_kolonu;
DELIMITER $$
CREATE PROCEDURE s27_dodaj_kolonu(IN tabela VARCHAR(64), IN kolona VARCHAR(64), IN definicija VARCHAR(255))
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = tabela AND COLUMN_NAME = kolona) THEN
    SET @s27_sql = CONCAT('ALTER TABLE `', tabela, '` ADD COLUMN `', kolona, '` ', definicija);
    PREPARE naredba FROM @s27_sql;
    EXECUTE naredba;
    DEALLOCATE PREPARE naredba;
  END IF;
END$$
DELIMITER ;

-- ---------------------------------------------------------------------------
-- 2026-11-24-popust-kursa: popust kursa (procenat, nova cena, rok, izgled)
-- ---------------------------------------------------------------------------
CALL s27_dodaj_kolonu('kurs', 'popustUkljucen', 'TINYINT(1) NOT NULL DEFAULT 0');
CALL s27_dodaj_kolonu('kurs', 'popustProcenat', 'DECIMAL(5,2) NULL');
CALL s27_dodaj_kolonu('kurs', 'popustCena', 'INT NULL');
CALL s27_dodaj_kolonu('kurs', 'popustDo', 'DATETIME NULL');
CALL s27_dodaj_kolonu('kurs', 'popustOznaka', 'VARCHAR(60) NULL');
CALL s27_dodaj_kolonu('kurs', 'popustNaslov', 'VARCHAR(200) NULL');
CALL s27_dodaj_kolonu('kurs', 'popustTekst', 'VARCHAR(600) NULL');
CALL s27_dodaj_kolonu('kurs', 'popustBoja', 'VARCHAR(20) NULL');
CALL s27_dodaj_kolonu('kurs', 'popustSlika', 'VARCHAR(255) NULL');

-- ---------------------------------------------------------------------------
-- 2026-11-24-popust-paketa-i-akcija: cena paketa na popustu, akcija na početnoj
-- ---------------------------------------------------------------------------
CALL s27_dodaj_kolonu('paket', 'cenaPopust', 'INT NULL');

CREATE TABLE IF NOT EXISTS akcija (
    id INT NOT NULL PRIMARY KEY,
    ukljucen TINYINT(1) NOT NULL DEFAULT 0,
    oznaka VARCHAR(60) NULL,
    naslov VARCHAR(200) NULL,
    tekst VARCHAR(600) NULL,
    boja VARCHAR(20) NULL,
    slika VARCHAR(255) NULL,
    doKada DATETIME NULL,
    dugme VARCHAR(60) NULL,
    link VARCHAR(255) NULL
) DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO akcija (id) VALUES (1);

-- ---------------------------------------------------------------------------
-- 2026-11-24-napustena-kupovina: podsetnik mejlom i odjava
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS napustena_kupovina (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    studentId BIGINT NOT NULL,
    email VARCHAR(255) NOT NULL,
    ime VARCHAR(100) NULL,
    kursIds VARCHAR(255) NOT NULL,
    paketIds VARCHAR(255) NULL,
    kreirano DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    azurirano DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    podsetnik1 DATETIME NULL,
    podsetnik2 DATETIME NULL,
    zavrseno DATETIME NULL,
    pokusaja INT NOT NULL DEFAULT 0,
    token VARCHAR(64) NOT NULL,
    UNIQUE KEY uk_napustena_token (token),
    INDEX idx_napustena_student (studentId)
) DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS podsetnik_odjava (
    email VARCHAR(255) NOT NULL PRIMARY KEY,
    datum DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- 2026-11-25-black-friday: datum početka, cene 27.11. 00:00 – 30.11. 23:59, tekstovi paketa
-- ---------------------------------------------------------------------------
CALL s27_dodaj_kolonu('kurs', 'popustOd', 'DATETIME NULL');
CALL s27_dodaj_kolonu('akcija', 'odKada', 'DATETIME NULL');

UPDATE paket SET opis = REPLACE(opis, 'Podrška u grupnom chatu', 'Podrška u privatnom chatu') WHERE kursId = 7;
UPDATE paket SET opis = REPLACE(opis, '\nRad na konkretnom projektu\n', '\n!!Rad na konkretnom projektu!!\n')
WHERE kursId = 7 AND naziv = 'Live mentorship + AI';

UPDATE kurs SET popustUkljucen = 1, popustProcenat = 14.57, popustCena = 299,
    popustOd = '2026-11-27 00:00:00', popustDo = '2026-11-30 23:59:00', popustOznaka = 'Black Friday',
    popustNaslov = 'Black Friday akcija', popustTekst = 'Najniža cena ove godine – važi do ponedeljka 30. novembra u ponoć.',
    popustBoja = '#c49a5a'
WHERE kursId = 7 AND popustUkljucen = 0;

UPDATE kurs SET popustUkljucen = 1, popustProcenat = 12.99, popustCena = 335,
    popustOd = '2026-11-27 00:00:00', popustDo = '2026-11-30 23:59:00', popustOznaka = 'Black Friday',
    popustNaslov = 'Black Friday akcija', popustTekst = 'Najniža cena ove godine – važi do ponedeljka 30. novembra u ponoć.',
    popustBoja = '#c49a5a'
WHERE kursId = 3 AND popustUkljucen = 0;

UPDATE kurs SET popustUkljucen = 1, popustProcenat = 14.62, popustCena = 111,
    popustOd = '2026-11-27 00:00:00', popustDo = '2026-11-30 23:59:00', popustOznaka = 'Black Friday',
    popustNaslov = 'Black Friday akcija', popustTekst = 'Najniža cena ove godine – važi do ponedeljka 30. novembra u ponoć.',
    popustBoja = '#c49a5a'
WHERE kursId = 5 AND popustUkljucen = 0;

-- paketi kursa 7: Online 299, Online + Review 369, Live mentorship bez popusta (redovna cena)
UPDATE paket SET cenaPopust = CASE naziv WHEN 'Online' THEN 299 WHEN 'Online + Review' THEN 369 ELSE cena END
WHERE kursId = 7 AND cenaPopust IS NULL;

UPDATE akcija SET ukljucen = 1, oznaka = 'Akcija', naslov = 'Black Friday',
    tekst = 'Najniže cene ove godine na kurseve 3D vizualizacije – samo od 27. do 30. novembra.',
    boja = '#e11d2a', odKada = '2026-11-27 00:00:00', doKada = '2026-11-30 23:59:00',
    dugme = 'Pogledaj kurseve', link = '/#edukacije'
WHERE id = 1 AND ukljucen = 0;

-- ---------------------------------------------------------------------------
-- 2026-11-25-akcija-slika: rad Mine Jeremić (zelena sofa) kao fotografija akcije
-- ---------------------------------------------------------------------------
UPDATE akcija SET slika = '/uploads/MinaJeremic03.webp' WHERE id = 1 AND (slika IS NULL OR slika = '');

-- ---------------------------------------------------------------------------
-- Koraci su urađeni: server ih pri pokretanju preskače
-- ---------------------------------------------------------------------------
INSERT IGNORE INTO sema_izmene (naziv) VALUES
    ('2026-11-24-popust-kursa'),
    ('2026-11-24-popust-paketa-i-akcija'),
    ('2026-11-24-napustena-kupovina'),
    ('2026-11-25-black-friday'),
    ('2026-11-25-akcija-slika');

DROP PROCEDURE IF EXISTS s27_dodaj_kolonu;

-- Provera
SELECT kursId, cena, popustUkljucen, popustCena, popustOd, popustDo FROM kurs;
SELECT naziv, cena, cenaPopust FROM paket WHERE kursId = 7;
SELECT ukljucen, naslov, oznaka, odKada, doKada, slika FROM akcija;
SELECT naziv FROM sema_izmene ORDER BY naziv;
