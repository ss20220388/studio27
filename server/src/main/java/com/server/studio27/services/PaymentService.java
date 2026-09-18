// === Dodati u PaymentService.java ===
//
// Ako PaymentService već nema JdbcTemplate injektovan, dodaj:
//
//     @Autowired
//     private JdbcTemplate jdbcTemplate;
//
// (isti pattern kao u SendMail.java)

public record BuyerInfo(String email, String ime, String prezime) {}

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
