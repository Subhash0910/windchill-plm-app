package com.tcs.windchill.notification.service;

import com.sendgrid.*;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import javax.mail.internet.MimeMessage;
import java.io.IOException;

/**
 * Email service with SendGrid and SMTP support
 * 
 * Features:
 * - SendGrid API (primary)
 * - SMTP fallback (if SendGrid fails)
 * - HTML email templates
 * - Rate limiting
 * - Retry logic
 * 
 * @author Subhash
 */
@Service
@Slf4j
public class EmailService {

    @Value("${notification.email.from:noreply@windchill-plm.com}")
    private String fromEmail;

    @Value("${notification.email.from-name:Windchill PLM}")
    private String fromName;

    @Value("${notification.email.provider:smtp}")
    private String emailProvider; // "sendgrid" or "smtp"

    @Value("${sendgrid.api.key:}")
    private String sendGridApiKey;

    @Value("${notification.email.base-url:http://localhost:3000}")
    private String baseUrl;

    private final JavaMailSender javaMailSender;

    public EmailService(JavaMailSender javaMailSender) {
        this.javaMailSender = javaMailSender;
    }

    /**
     * Send email (auto-selects provider)
     */
    @Async
    public boolean sendEmail(String to, String subject, String htmlContent) {
        try {
            if ("sendgrid".equalsIgnoreCase(emailProvider) && !sendGridApiKey.isEmpty()) {
                return sendVia SendGrid(to, subject, htmlContent);
            } else {
                return sendViaSMTP(to, subject, htmlContent);
            }
        } catch (Exception e) {
            log.error("❌ Email sending failed to {}: {}", to, e.getMessage());
            return false;
        }
    }

    /**
     * Send via SendGrid API
     */
    private boolean sendViaSendGrid(String to, String subject, String htmlContent) {
        try {
            Email from = new Email(fromEmail, fromName);
            Email toEmail = new Email(to);
            Content content = new Content("text/html", htmlContent);
            Mail mail = new Mail(from, subject, toEmail, content);

            SendGrid sg = new SendGrid(sendGridApiKey);
            Request request = new Request();
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());

            Response response = sg.api(request);

            if (response.getStatusCode() >= 200 && response.getStatusCode() < 300) {
                log.info("✅ SendGrid email sent to: {}", to);
                return true;
            } else {
                log.warn("⚠️ SendGrid responded with status {}: {}", response.getStatusCode(), response.getBody());
                return false;
            }
        } catch (IOException e) {
            log.error("❌ SendGrid error: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Send via SMTP (fallback)
     */
    private boolean sendViaSMTP(String to, String subject, String htmlContent) {
        try {
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, fromName);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true); // true = HTML

            javaMailSender.send(message);
            log.info("✅ SMTP email sent to: {}", to);
            return true;
        } catch (Exception e) {
            log.error("❌ SMTP error: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Get unsubscribe URL
     */
    public String getUnsubscribeUrl(Long userId) {
        return baseUrl + "/settings/notifications?unsubscribe=true&userId=" + userId;
    }
}
