package com.windchill.api.config;

import com.windchill.common.enums.ContextTypeEnum;
import com.windchill.common.enums.RoleEnum;
import com.windchill.domain.entity.PlmContext;
import com.windchill.domain.entity.User;
import com.windchill.repository.PlmContextRepository;
import com.windchill.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Dev/Docker initializer to guarantee documented default credentials work.
 *
 * Why: the Flyway seed user may not match the documented password in all environments.
 * This initializer makes startup idempotent and fixes the admin password if needed.
 */
@Slf4j
@Configuration
@Profile({"docker", "dev", "demo"})
@RequiredArgsConstructor
public class DevAdminInitializer {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final PlmContextRepository plmContextRepository;

    @Bean
    public ApplicationRunner ensureDefaultAdmin() {
        return args -> {
            seedAdmin();
            seedDefaultContext();
        };
    }

    private void seedAdmin() {
        final String username = "admin";
        final String email = "admin@windchill.local";
        final String rawPassword = "admin123";

        User admin = userRepository.findActiveUserByUsername(username).orElse(null);

        if (admin == null) {
            if (!userRepository.existsByUsername(username)) {
                admin = new User();
                admin.setUsername(username);
                admin.setEmail(email);
                admin.setFirstName("Admin");
                admin.setLastName("User");
                admin.setRole(RoleEnum.ADMIN);
                admin.setIsActive(true);
                admin.setIsEmailVerified(true);
                admin.setDepartment("IT");
                admin.setIsDeleted(false);
                admin.setPasswordHash(passwordEncoder.encode(rawPassword));
                userRepository.save(admin);
                log.info("Default admin user created (username={})", username);
            }
            return;
        }

        boolean changed = false;

        if (admin.getPasswordHash() == null || !passwordEncoder.matches(rawPassword, admin.getPasswordHash())) {
            admin.setPasswordHash(passwordEncoder.encode(rawPassword));
            changed = true;
        }
        if (admin.getEmail() == null) { admin.setEmail(email); changed = true; }
        if (admin.getRole() == null || admin.getRole() != RoleEnum.ADMIN) { admin.setRole(RoleEnum.ADMIN); changed = true; }
        if (admin.getIsActive() == null || !admin.getIsActive()) { admin.setIsActive(true); changed = true; }
        if (admin.getIsEmailVerified() == null || !admin.getIsEmailVerified()) { admin.setIsEmailVerified(true); changed = true; }

        if (changed) {
            userRepository.save(admin);
            log.info("Default admin user updated (username={})", username);
        }
    }

    private void seedDefaultContext() {
        if (plmContextRepository.count() == 0) {
            PlmContext ctx = new PlmContext();
            ctx.setCode("DEFAULT");
            ctx.setName("Default Product Context");
            ctx.setContextType(ContextTypeEnum.PRODUCT);
            ctx.setDescription("Default context seeded for demo deployment");
            ctx.setIsActive(true);
            plmContextRepository.save(ctx);
            log.info("Default PLM context seeded");
        }
    }
}
