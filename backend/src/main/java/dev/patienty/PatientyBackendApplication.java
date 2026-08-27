package dev.patienty;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class PatientyBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(PatientyBackendApplication.class, args);
	}

}
