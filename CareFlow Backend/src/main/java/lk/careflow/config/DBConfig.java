package lk.careflow.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;

@Configuration
public class DBConfig {

    private static final Logger logger = LoggerFactory.getLogger(DBConfig.class);

    @Bean
    public CommandLineRunner databaseConnectionCheck(DataSource dataSource) {
        return args -> {
            try (Connection connection = dataSource.getConnection()) {
                DatabaseMetaData metaData = connection.getMetaData();
                String databaseName = metaData.getDatabaseProductName();
                String databaseVersion = metaData.getDatabaseProductVersion();

                String banner = """
                        
                        ==================================================================
                         PostgreSQL (Supabase) Database Connected Successfully!
                         Database: %s
                         Version : %s
                        ==================================================================
                        """.formatted(databaseName, databaseVersion);

                logger.info(banner);
            } catch (Exception e) {
                logger.error("Failed to connect to PostgreSQL (Supabase) Database: {}", e.getMessage(), e);
            }
        };
    }
}
