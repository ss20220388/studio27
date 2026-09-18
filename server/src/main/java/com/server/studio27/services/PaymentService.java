// === Dodati u PaymentService.java ===
//
// Ako PaymentService već nema JdbcTemplate injektovan, dodaj:
//
//     @Autowired
//     private JdbcTemplate jdbcTemplate;
//
// (isti pattern kao u SendMail.java)
//
// Potrebni importi (ako već ne postoje u fajlu):
//     import java.util.List;
//     import java.util.Map;
//     import org.springframework.jdbc.core.JdbcTemplate;

public record BuyerInfo(String email, String ime, String prezime) {}

/**
 * Parsira course_ids iz pending_orders (pretpostavka: string tipa "3,7", tj. ID-jevi
 * kurseva odvojeni zarezom — isto ono što je poslato kao courseIds u /payment/create).
 * Ako je kod tebe course_ids sačuvan drugačije (npr. JSON niz "[3,7]"), javi pa menjam ovo.
 */
private List<Long> parseCourseIds(String courseIdsRaw) {
    List<Long> result = new java.util.ArrayList<>();
    if (courseIdsRaw == null || courseIdsRaw.isBlank()) {
        return result;
    }
    for (String part : courseIdsRaw.split(",")) {
        String trimmed = part.trim();
        if (!trimmed.isEmpty()) {
            result.add(Long.parseLong(trimmed));
        }
    }
    return result;
}

/**
 * Nalazi studentId + course_ids u pending_orders za dati orderId, GDE processed = 0
 * (tj. samo ako još nije obrađen — ovo je ono što obezbeđuje idempotentnost: ako banka
 * pošalje /payment/notify više puta za isti orderId, drugi put ovaj SELECT neće naći
 * ništa i metoda će baciti izuzetak, pa PaymentRoute neće poslati mail po drugi put).
 */
private Map<String, Object> findUnprocessedOrder(String orderId) {
    String sql = "SELECT student_id, course_ids FROM pending_orders WHERE order_id = ? AND processed = 0";
    List<Map<String, Object>> results = jdbcTemplate.queryForList(sql, orderId);
    if (results.isEmpty()) {
        return null;
    }
    return results.get(0);
}

private void markOrderProcessed(String orderId) {
    jdbcTemplate.update("UPDATE pending_orders SET processed = 1 WHERE order_id = ?", orderId);
}

/**
 * Poziva se kad banka POTVRDI uplatu. Za svaki kurs iz pending_orders.course_ids
 * update-uje odgovarajući red u platio sa 'C' (čekanje) na 'P' (prihvaćeno).
 *
 * Baca izuzetak ako orderId nije nađen kao neobrađen (nepostojeći orderId ili
 * duplikat notify poziva) — PaymentRoute to hvata i na osnovu toga zna da ne šalje
 * mail po drugi put.
 */
public void recordSuccessfulPayment(String orderId) throws Exception {
    Map<String, Object> order = findUnprocessedOrder(orderId);
    if (order == null) {
        throw new IllegalStateException("Nema neobrađene pending_orders stavke za OrderID=" + orderId);
    }

    Long studentId = ((Number) order.get("student_id")).longValue();
    List<Long> courseIds = parseCourseIds((String) order.get("course_ids"));

    if (courseIds.isEmpty()) {
        throw new IllegalStateException("pending_orders.course_ids je prazan za OrderID=" + orderId);
    }

    for (Long kursId : courseIds) {
        int updated = jdbcTemplate.update(
                "UPDATE platio SET status = 'P' WHERE studentId = ? AND kursId = ? AND status = 'C'",
                studentId, kursId
        );
        if (updated == 0) {
            System.err.println("[PaymentService] UPOZORENJE: nije nađen red u platio (status='C') za studentId="
                    + studentId + ", kursId=" + kursId + ", OrderID=" + orderId + " — proveri da li je već obrađen.");
        }
    }

    markOrderProcessed(orderId);
}

/**
 * Poziva se kad banka ODBIJE uplatu. Za svaki kurs iz pending_orders.course_ids
 * update-uje odgovarajući red u platio sa 'C' na 'O' (odbijeno).
 *
 * Isto kao recordSuccessfulPayment — baca izuzetak ako je orderId već obrađen,
 * radi idempotentnosti (da se mail o neuspehu ne šalje više puta).
 */
public void recordFailedPayment(String orderId) throws Exception {
    Map<String, Object> order = findUnprocessedOrder(orderId);
    if (order == null) {
        throw new IllegalStateException("Nema neobrađene pending_orders stavke za OrderID=" + orderId);
    }

    Long studentId = ((Number) order.get("student_id")).longValue();
    List<Long> courseIds = parseCourseIds((String) order.get("course_ids"));

    for (Long kursId : courseIds) {
        jdbcTemplate.update(
                "UPDATE platio SET status = 'O' WHERE studentId = ? AND kursId = ? AND status = 'C'",
                studentId, kursId
        );
    }

    markOrderProcessed(orderId);
}

/**
 * Nalazi email i ime/prezime kupca za dati orderId, preko:
 * pending_orders.student_id -> student.studentId -> user.userId (email)
 *
 * NAPOMENA: ako se ispostavi da tabela sa korisnicima/emailovima nije "user"
 * nego npr. "users", promeni samo naziv tabele u upitu ispod.
 */
public String getBuyerEmailByOrderId(String orderId) {
    String sql = "SELECT u.email " +
            "FROM pending_orders po " +
            "JOIN student s ON s.studentId = po.student_id " +
            "JOIN user u ON u.userId = s.studentId " +
            "WHERE po.order_id = ?";
    try {
        List<String> results = jdbcTemplate.query(
                sql,
                (rs, rowNum) -> rs.getString("email"),
                orderId
        );
        return results.isEmpty() ? null : results.get(0);
    } catch (Exception e) {
        System.err.println("[PaymentService] Greška pri traženju emaila za OrderID=" + orderId + ": " + e.getMessage());
        e.printStackTrace();
        return null;
    }
}

/**
 * Isto, ali vraća i ime/prezime — koristi se ako želiš personalizovan mail
 * ("Poštovani/a Petar," umesto "Poštovani/a,").
 */
public BuyerInfo getBuyerInfoByOrderId(String orderId) {
    String sql = "SELECT u.email, s.ime, s.prezime " +
            "FROM pending_orders po " +
            "JOIN student s ON s.studentId = po.student_id " +
            "JOIN user u ON u.userId = s.studentId " +
            "WHERE po.order_id = ?";
    try {
        List<BuyerInfo> results = jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new BuyerInfo(
                        rs.getString("email"),
                        rs.getString("ime"),
                        rs.getString("prezime")
                ),
                orderId
        );
        return results.isEmpty() ? null : results.get(0);
    } catch (Exception e) {
        System.err.println("[PaymentService] Greška pri traženju kupca za OrderID=" + orderId + ": " + e.getMessage());
        e.printStackTrace();
        return null;
    }
}
