package com.studyhub;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import java.io.File;
import java.nio.file.Files;

@SpringBootApplication
public class AiStudyHubApplication {
    public static void main(String[] args) {
        loadEnv();
        SpringApplication.run(AiStudyHubApplication.class, args);
    }

    private static void loadEnv() {
        try {
            File envFile = new File(".env");
            if (!envFile.exists()) {
                envFile = new File("../.env");
            }
            if (envFile.exists()) {
                Files.lines(envFile.toPath())
                        .map(String::trim)
                        .filter(line -> !line.isEmpty() && !line.startsWith("#"))
                        .forEach(line -> {
                            int eqIdx = line.indexOf('=');
                            if (eqIdx > 0) {
                                String key = line.substring(0, eqIdx).trim();
                                String val = line.substring(eqIdx + 1).trim();
                                if (val.startsWith("\"") && val.endsWith("\"")) {
                                    val = val.substring(1, val.length() - 1);
                                } else if (val.startsWith("'") && val.endsWith("'")) {
                                    val = val.substring(1, val.length() - 1);
                                }
                                System.setProperty(key, val);
                            }
                        });
                System.out.println("System: Loaded environment variables from .env file successfully.");
            } else {
                System.out.println("System: No .env file found in root directory.");
            }
        } catch (Exception e) {
            System.err.println("System: Failed to load .env file: " + e.getMessage());
        }
    }
}
