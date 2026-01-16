package com.windchill.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = {"com.windchill"})
public class WindchillApplication {

    public static void main(String[] args) {
        SpringApplication.run(WindchillApplication.class, args);
    }
}
