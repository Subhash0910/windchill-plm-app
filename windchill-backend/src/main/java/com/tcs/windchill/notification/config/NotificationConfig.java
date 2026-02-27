package com.tcs.windchill.notification.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.Properties;
import java.util.concurrent.Executor;

/**
 * Notification system configuration
 * 
 * Configures:
 * - Email service (SendGrid or SMTP)
 * - Async executor for background processing
 * - Scheduled tasks for cleanup
 * 
 * @author Subhash
 */
@Configuration
@EnableAsync
@EnableScheduling
@ConfigurationProperties(prefix = "notification")
@Data
public class NotificationConfig {

    private EmailConfig email = new EmailConfig();

    @Data
    public static class EmailConfig {
        private boolean enabled = true;
        private String provider = "smtp"; // "sendgrid" or "smtp"
        private String from = "noreply@windchill-plm.com";
        private String fromName = "Windchill PLM";
        private String baseUrl = "http://localhost:3000";
        private SmtpConfig smtp = new SmtpConfig();
    }

    @Data
    public static class SmtpConfig {
        private String host = "smtp.gmail.com";
        private int port = 587;
        private String username = "";
        private String password = "";
        private boolean auth = true;
        private boolean starttls = true;
    }

    /**
     * Configure JavaMailSender for SMTP
     */
    @Bean
    public JavaMailSender javaMailSender() {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        
        if (email.isEnabled() && "smtp".equalsIgnoreCase(email.getProvider())) {
            mailSender.setHost(email.getSmtp().getHost());
            mailSender.setPort(email.getSmtp().getPort());
            mailSender.setUsername(email.getSmtp().getUsername());
            mailSender.setPassword(email.getSmtp().getPassword());

            Properties props = mailSender.getJavaMailProperties();
            props.put("mail.transport.protocol", "smtp");
            props.put("mail.smtp.auth", email.getSmtp().isAuth());
            props.put("mail.smtp.starttls.enable", email.getSmtp().isStarttls());
            props.put("mail.debug", "false");
        }

        return mailSender;
    }

    /**
     * Configure async executor for notifications
     */
    @Bean(name = "notificationTaskExecutor")
    public Executor notificationTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);
        executor.setMaxPoolSize(10);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("notification-");
        executor.initialize();
        return executor;
    }
}
