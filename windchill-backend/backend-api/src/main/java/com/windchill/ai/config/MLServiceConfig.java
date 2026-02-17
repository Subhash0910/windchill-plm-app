package com.windchill.ai.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;
import org.springframework.boot.web.client.RestTemplateBuilder;
import java.time.Duration;

/**
 * Configuration for ML Service integration.
 * Sets up RestTemplate for communication with Python ML service.
 */
@Configuration
public class MLServiceConfig {

    @Value("${ml.service.url:http://ml-service:5000}")
    private String mlServiceUrl;

    @Value("${ml.service.timeout:5000}")
    private long mlServiceTimeout;

    @Bean(name = "mlServiceRestTemplate")
    public RestTemplate mlServiceRestTemplate(RestTemplateBuilder builder) {
        return builder
                .rootUri(mlServiceUrl)
                .setConnectTimeout(Duration.ofMillis(mlServiceTimeout))
                .setReadTimeout(Duration.ofMillis(mlServiceTimeout))
                .build();
    }

    public String getMlServiceUrl() {
        return mlServiceUrl;
    }
}