package com.windchill.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@ComponentScan(basePackages = {"com.windchill"})
@EntityScan(basePackages = {"com.windchill.domain.entity"})
@EnableJpaRepositories(basePackages = {"com.windchill.repository"})
public class WindchillApplication {

    public static void main(String[] args) {
        SpringApplication.run(WindchillApplication.class, args);
    }
}
