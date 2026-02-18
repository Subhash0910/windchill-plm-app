package com.windchill.api.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

/**
 * Configuration for AI Impact Engine components.
 * Provides beans for ML service communication and AI feature management.
 */
@Configuration
@Slf4j
public class AIConfig {

    /**
     * RestTemplate bean for calling ML microservice.
     * Configured with timeouts to prevent hanging requests.
     */
    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        log.info("Initializing RestTemplate for ML service communication");
        
        return builder
            .setConnectTimeout(Duration.ofSeconds(5))
            .setReadTimeout(Duration.ofSeconds(10))
            .build();
    }
}
