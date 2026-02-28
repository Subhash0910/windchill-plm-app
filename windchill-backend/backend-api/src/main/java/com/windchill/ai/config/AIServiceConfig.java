package com.windchill.ai.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;

import jakarta.annotation.PostConstruct;

/**
 * Configuration for AI Impact Analysis services.
 */
@Slf4j
@Configuration
@ComponentScan(basePackages = {
    "com.windchill.ai.controller",
    "com.windchill.ai.service",
    "com.windchill.ai.dto"
})
public class AIServiceConfig {

    @PostConstruct
    public void init() {
        log.info("✅ AI Impact Analysis Service initialized");
    }
}