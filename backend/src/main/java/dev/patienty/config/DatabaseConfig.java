package dev.patienty.config;

import com.zaxxer.hikari.HikariDataSource;
import java.net.URI;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
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

    private static final Pattern USER_INFO_PATTERN = Pattern.compile("^(?:jdbc:)?postgres(?:ql)?://([^@]+)@(.+)$");

    @Bean
    @Primary
    public DataSource dataSource(
            @Value("${spring.datasource.url}") String rawUrl,
            @Value("${spring.datasource.username:}") String rawUsername,
            @Value("${spring.datasource.password:}") String rawPassword) {

        String url = rawUrl;
        String username = rawUsername;
        String password = rawPassword;

        if (StringUtils.hasText(url)) {
            String cleanUriString = url.startsWith("jdbc:") ? url.substring(5) : url;
            Matcher matcher = USER_INFO_PATTERN.matcher(url);

            if (matcher.matches()) {
                String userInfo = matcher.group(1);
                String rest = matcher.group(2);
                String[] userParts = userInfo.split(":", 2);
                if (userParts.length >= 1 && StringUtils.hasText(userParts[0])) {
                    username = userParts[0];
                }
                if (userParts.length >= 2 && StringUtils.hasText(userParts[1])) {
                    password = userParts[1];
                }
                url = "jdbc:postgresql://" + rest;
            } else if (cleanUriString.startsWith("postgres://") || cleanUriString.startsWith("postgresql://")) {
                try {
                    URI uri = new URI(cleanUriString);
                    String userInfo = uri.getUserInfo();
                    if (userInfo != null) {
                        String[] userParts = userInfo.split(":", 2);
                        if (userParts.length >= 1 && StringUtils.hasText(userParts[0])) {
                            username = userParts[0];
                        }
                        if (userParts.length >= 2 && StringUtils.hasText(userParts[1])) {
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
        }

        HikariDataSource dataSource = new HikariDataSource();
        dataSource.setJdbcUrl(url);
        if (StringUtils.hasText(username)) dataSource.setUsername(username);
        if (StringUtils.hasText(password)) dataSource.setPassword(password);

        return dataSource;
    }
}
