package com.server.studio27.config;

import java.util.List;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Izmene šeme baze koje se same primene pri pokretanju servera (lokalno, dev, produkcija).
 * Svaki korak se izvrši samo jednom: upisuje se u tabelu sema_izmene.
 * Novi korak se dodaje NA KRAJ liste, a postojeći se nikad ne menjaju.
 */
@Component
public class SemaBaze implements ApplicationRunner {

    private record Korak(String naziv, List<String> sql) {}

    private static final List<Korak> KORACI = List.of(
        new Korak("2026-10-30-paketi", List.of(
            """
            CREATE TABLE IF NOT EXISTS paket (
                paketId BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                kursId BIGINT NOT NULL,
                naziv VARCHAR(100) NOT NULL,
                cena BIGINT NOT NULL,
                opis TEXT NULL,
                redosled INT NOT NULL DEFAULT 0,
                INDEX idx_paket_kurs (kursId)
            ) DEFAULT CHARSET=utf8mb4
            """,
            "ALTER TABLE platio ADD COLUMN paketId BIGINT NULL",
            "ALTER TABLE pohadja ADD COLUMN paketId BIGINT NULL",
            "ALTER TABLE pending_orders ADD COLUMN paket_ids VARCHAR(255) NULL",
            // paketi kursa "Od nule do profesionalnog rendera" (stavke se upisuju u adminu)
            """
            INSERT INTO paket (kursId, naziv, cena, opis, redosled)
            SELECT k.kursId, p.naziv, p.cena, '', p.redosled
            FROM kurs k
            JOIN (SELECT 'Online' AS naziv, 350 AS cena, 1 AS redosled
                  UNION ALL SELECT 'Online + Review', 420, 2
                  UNION ALL SELECT 'Live mentorship + AI', 800, 3) p
            WHERE k.kursId = 7 AND NOT EXISTS (SELECT 1 FROM paket WHERE kursId = 7)
            """
        )),
        new Korak("2026-10-30-recenzije-instagram", List.of(
            "ALTER TABLE recenzija ADD COLUMN instagram VARCHAR(100) NULL",
            "ALTER TABLE recenzija ADD COLUMN ime VARCHAR(100) NULL"
        )),
        new Korak("2026-10-30-recenzije-sa-instagrama", recenzijeSaInstagrama()),
        new Korak("2026-10-31-paketi-detalji", List.of(
            "ALTER TABLE paket ADD COLUMN podnaslov VARCHAR(150) NULL",
            "ALTER TABLE paket ADD COLUMN uvod VARCHAR(255) NULL",
            "ALTER TABLE paket ADD COLUMN istaknuto VARCHAR(150) NULL",
            "ALTER TABLE paket ADD COLUMN dugme VARCHAR(40) NULL",
            // tekstovi paketa kursa 7 sa skice klijentkinje (**tekst** = podebljano); menjaju se u adminu
            detaljiPaketa("Online", "Od nule do Level Up-a", "Uči samostalno, svojim tempom.", "Neograničen pristup", null,
                "Sve video lekcije\n**Modelovanje od nule + Level Up**\nPraktične vežbe i projektni fajlovi\n"
                + "Biblioteka materijala i gotovih scena\nProjekat i sertifikat\n**Podrška u grupnom chatu**"),
            detaljiPaketa("Online + Review", "Od nule do Level Up-a + analiza rada", "Uči samostalno uz stručno usmeravanje.", "Neograničen pristup", null,
                "Sve video lekcije\n**Modelovanje od nule + Level Up**\nPraktične vežbe i projektni fajlovi\n"
                + "Biblioteka materijala i gotovih scena\nProjekat i sertifikat\n**Podrška u grupnom chatu**\n"
                + "**Jedna grupna sesija uživo (do 5 polaznika)**\nAnaliza tvojih rendera i 3D scene uz konkretna poboljšanja"),
            detaljiPaketa("Live mentorship + AI", "Od nule do Level Up-a + AI alati", "Uči direktno uz predavača, korak po korak.", "Snimci sa časova koji vam ostaju", "Prijavi se",
                "Mesec i po dana organizovane nastave uživo\n**Individualno ili u malim grupama od 2**\nModelovanje od nule + Level Up\n"
                + "**AI alati za vizualizaciju i animaciju**\nBiblioteka materijala i gotovih scena\nRad na konkretnom projektu\n"
                + "Renderi spremni za portfolio\nKontinuirano mentorstvo\n**Snimci održanih časova i sertifikat**")
        ))
    );

    // Popunjava paket kursa 7 samo ako stavke još nisu unete u adminu
    private static String detaljiPaketa(String naziv, String podnaslov, String uvod, String istaknuto, String dugme, String opis) {
        return "UPDATE paket SET podnaslov = " + sql(podnaslov) + ", uvod = " + sql(uvod) + ", istaknuto = " + sql(istaknuto)
             + ", dugme = " + sql(dugme) + ", opis = " + sql(opis)
             + " WHERE kursId = 7 AND naziv = " + sql(naziv) + " AND (opis IS NULL OR opis = '')";
    }

    private static String sql(String tekst) {
        return tekst == null ? "NULL" : "'" + tekst.replace("'", "''") + "'";
    }

    // Utisci polaznika sa Instagrama (snimci poruka koje je poslala klijentkinja)
    private static List<String> recenzijeSaInstagrama() {
        String[] render = {
            "Zdravo, samo sam želeo da se javim i podelim utiske posle mesec dana... Pohađao sam par kurseva ranije i mogu ti reći da nijedan nije bio ovako sadržajan i dobro osmišljen kao tvoj. Vidi se da je uloženo dosta truda i uspela si da mi objasniš i najsloženije koncepte na jednostavan način i da odgovoriš na sva moja pitanja – hvala na strpljenju. Naučio sam više nego što sam očekivao, hvala puno još jednom!",
            "Ćao, evo i ja da podelim utiske. Prezadovoljna sam kursom, način na koji si mi objasnila i kako si nesebično sve podelila je fantastičan. Prvenstveno sam oduševljena jer nisam očekivala da ću posle kursa odmah imati ovakve rendere, a pre toga nikada nisam ni otvorila Max. Hvala ti još jednom na svemu!",
            "Zdravo, imam stvarno potrebu da ostavim svoju recenziju za kurs. Definitivno vredi svaki uloženi dinar, zapravo dobila sam i više nego što sam očekivala! Mislim da si odlična u prenošenju znanja i stvarno ti hvala na svemu što nesebično deliš u okviru kursa. Imaš moje preporuke od sveg srca!! Hvala do neba na trudu i posvećenosti!!",
            "Samo da ti se javim za utiske sa kursa i pre svega da se zahvalim za ovako odlično iskustvo. Stvarno se vidi sav uložen trud, od detaljno osmišljenih časova pa sve do materijala koje dobijamo. Mnogo mi je značilo što si uvek dostupna za sva pitanja pored časova. Nisam mogla ni da zamislim da će mi rezultati biti ovakvi pri završetku. Rado bih svima preporučila ovaj kurs i nadam se da ćemo još nekada raditi zajedno.",
            "Htela bih pre svega da ti kažem hvala ti za sve. Konačno sam imala predavača i kurs koji je vredeo svaki dinar. Hvala ti na tvom strpljenju koje si imala tokom rada sa mnom i tvojoj predanosti da preneseš tako opširno i detaljno svoje znanje. Zahvaljujući tebi sam napredovala neverovatno i svakome bih te preporučila!",
        };
        String[] enterijer = {
            "Evo i ja da podelim svoje utiske nakon kursa dizajna enterijera, ja sam stvarno prezadovoljna, vidi se da ozbiljno pristupate samoj materiji, naučila sam mnogo, posebno bih pohvalila Mariju kao izvrsnog predavača, i svaka čast na posvećenosti edukacijama. Sve u svemu, jako su mi pozitivni utisci i jedva čekam dalje da se razvijam i bavim ovim poslom!",
            "Ćao, ja moram da podelim koliko sam zadovoljna kursom enterijera!!! Kao i što smo pričale, ja sam završila arhitekturu ali mi je ovaj kurs toliko pomogao, u smislu caka, rada u CAD-u i prezentacije da sam sada mnogo samostalnija i sigurnija u svoj rad i veštinu! Puno pohvala za Mariju, koja je vrlo posvećena i strpljiva, i jako lepo objašnjava!",
            "Moji utisci sa kursa su stvarno predivni! Jako lepo iskustvo, naučila sam mnogo i jedva čekam da se bavim dizajnom enterijera. Iskreno sam mislila da je lakše, ali naravno ništa što ne može da se savlada. Hvala Mariji još jednom na strpljenju!",
            "Zdravo, evo i ja da napišem recenziju za kurs enterijera. Najviše mi se dopalo što je sve praktično i jasno objašnjeno, od samog početka projekta do finalne prezentacije. Naučila sam kako da bolje organizujem proces rada, napravim kvalitetniji enterijer i sigurnije predstavim svoju ideju. Predavanja su konkretna, a sve što se radi može odmah da se primeni u praksi. Definitivno bih preporučila kurs svima koji žele da unaprede svoje znanje i ozbiljnije se bave dizajnom enterijera.",
            "Samo da javim da sam dosta naučila na kursu dizajna enterijera, što se može i videti po mom završnom radu! Prvenstveno mi je bilo jako zabavno, i drago mi je da sam upisala kurs baš kod vas!",
        };
        List<String> sql = new java.util.ArrayList<>();
        for (String r : render) sql.add(unosRecenzije(7, r));
        for (String r : enterijer) sql.add(unosRecenzije(6, r));
        return sql;
    }

    private static String unosRecenzije(int kursId, String tekst) {
        String opis = tekst.replace("'", "''");
        return "INSERT INTO recenzija (opis, ocena, datum, kursId) "
             + "SELECT '" + opis + "', 5, CURDATE(), " + kursId + " FROM DUAL "
             + "WHERE EXISTS (SELECT 1 FROM kurs WHERE kursId = " + kursId + ")";
    }

    private final JdbcTemplate jdbc;
    private final TransactionTemplate transakcija;

    public SemaBaze(JdbcTemplate jdbc, TransactionTemplate transakcija) {
        this.jdbc = jdbc;
        this.transakcija = transakcija;
    }

    @Override
    public void run(ApplicationArguments args) {
        jdbc.execute("""
            CREATE TABLE IF NOT EXISTS sema_izmene (
                naziv VARCHAR(100) NOT NULL PRIMARY KEY,
                primenjeno DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """);
        for (Korak korak : KORACI) {
            Integer vec = jdbc.queryForObject("SELECT COUNT(*) FROM sema_izmene WHERE naziv = ?", Integer.class, korak.naziv());
            if (vec != null && vec > 0) continue;
            // ALTER TABLE u MySQL-u sam potvrđuje transakciju, pa su koraci napisani tako
            // da ponovno pokretanje posle greške ne pravi štetu (provera kolona ispod)
            transakcija.executeWithoutResult(s -> {
                for (String sql : korak.sql()) {
                    if (kolonaVecPostoji(sql)) continue;
                    jdbc.execute(sql);
                }
                jdbc.update("INSERT INTO sema_izmene (naziv) VALUES (?)", korak.naziv());
            });
            System.out.println("[SemaBaze] Primenjena izmena: " + korak.naziv());
        }
    }

    // "ALTER TABLE x ADD COLUMN y ..." se preskače ako kolona već postoji
    private boolean kolonaVecPostoji(String sql) {
        var m = java.util.regex.Pattern.compile("^ALTER TABLE (\\w+) ADD COLUMN (\\w+)", java.util.regex.Pattern.CASE_INSENSITIVE).matcher(sql.trim());
        if (!m.find()) return false;
        Integer broj = jdbc.queryForObject(
            "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
            Integer.class, m.group(1), m.group(2));
        return broj != null && broj > 0;
    }
}
