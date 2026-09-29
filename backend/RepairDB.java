import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class RepairDB {
    public static void main(String[] args) throws Exception {
        Connection conn = DriverManager.getConnection("jdbc:mysql://localhost:3306/store_price_track", "root", "");
        Statement stmt = conn.createStatement();
        stmt.execute("DROP TABLE IF EXISTS flyway_schema_history");
        System.out.println("Dropped flyway_schema_history successfully!");
    }
}
