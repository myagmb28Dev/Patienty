package dev.patienty.config;

import com.zaxxer.hikari.HikariDataSource;
import java.net.URI;
import javax.sql.DataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.util.StringUtils;

@Configuration
@Profile("prod")
public class DatabaseConfig {

    @Bean
    @Primary
    public DataSource dataSource(
            @Value("${spring.datasource.url}") String rawUrl,
            @Value("${spring.datasource.username:}") String rawUsername,
            @Value("${spring.datasource.password:}") String rawPassword) {

        String url = rawUrl;
        String username = rawUsername;
        String password = rawPassword;

        // Render나 Heroku의 postgres:// 또는 postgresql:// 표준 URI 포맷을 JDBC URL 포맷으로 자동 변환
        if (StringUtils.hasText(url) && (url.startsWith("postgres://") || url.startsWith("postgresql://"))) {
            try {
                URI uri = new URI(url);
                String userInfo = uri.getUserInfo();
                if (userInfo != null) {
                    String[] userParts = userInfo.split(":");
                    if (userParts.length >= 1 && !StringUtils.hasText(username)) {
                        username = userParts[0];
                    }
                    if (userParts.length >= 2 && !StringUtils.hasText(password)) {
                        password = userParts[1];
                    }
                }
                int port = uri.getPort() != -1 ? uri.getPort() : 5432;
                String path = uri.getPath();
                if (path != null && path.startsWith("/")) {
                    path = path.substring(1);
                }
                url = "jdbc:postgresql://" + uri.getHost() + ":" + port + "/" + path;
                if (uri.getQuery() != null) {
                    url += "?" + uri.getQuery();
                }
            } catch (Exception ignored) {
            }
        }

        HikariDataSource dataSource = new HikariDataSource();
        dataSource.setJdbcUrl(url);
        if (StringUtils.hasText(username)) dataSource.setUsername(username);
        if (StringUtils.hasText(password)) dataSource.setPassword(password);

        return dataSource;
    }
}
