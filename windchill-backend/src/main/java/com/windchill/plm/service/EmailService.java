package com.windchill.plm.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import jakarta.mail.internet.MimeMessage;
import java.util.Map;

/**
 * Email service for sending notifications.
 * Supports HTML templates and SMTP configuration.
 * 
 * @author Subhash
 * @version 2.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final SpringTemplateEngine templateEngine;

    @Value("${spring.mail.username:noreply@windchill-plm.com}")
    private String fromEmail;

    @Value("${app.email.enabled:true}")
    private boolean emailEnabled;

    @Value("${app.base-url:http://localhost:3000}")
    private String baseUrl;

    /**
     * Send a simple text email
     * 
     * @param to Recipient email
     * @param subject Email subject
     * @param body Email body
     * @return true if sent successfully
     */
    public boolean sendEmail(String to, String subject, String body) {
        return sendEmail(to, subject, body, false);
    }

    /**
     * Send an email (text or HTML)
     * 
     * @param to Recipient email
     * @param subject Email subject
     * @param body Email body
     * @param isHtml Whether body is HTML
     * @return true if sent successfully
     */
    public boolean sendEmail(String to, String subject, String body, boolean isHtml) {
        if (!emailEnabled) {
            log.info("⚠️ Email disabled in configuration, skipping: to={}", to);
            return false;
        }

        try {
            log.info("📧 Sending email: to={}, subject={}", to, subject);
            
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, isHtml);
            
            mailSender.send(message);
            
            log.info("✅ Email sent successfully: to={}", to);
            return true;
            
        } catch (Exception e) {
            log.error("❌ Failed to send email to {}: {}", to, e.getMessage(), e);
            return false;
        }
    }

    /**
     * Send email asynchronously
     */
    @Async
    public void sendEmailAsync(String to, String subject, String body, boolean isHtml) {
        sendEmail(to, subject, body, isHtml);
    }

    /**
     * Build email from Thymeleaf template
     * 
     * @param templateName Template name (without .html)
     * @param variables Template variables
     * @return HTML email body
     */
    public String buildEmailFromTemplate(String templateName, Map<String, Object> variables) {
        try {
            Context context = new Context();
            
            // Add common variables
            context.setVariable("baseUrl", baseUrl);
            context.setVariable("appName", "Windchill PLM");
            
            // Add custom variables
            variables.forEach(context::setVariable);
            
            // Process template
            return templateEngine.process("email/" + templateName, context);
            
        } catch (Exception e) {
            log.error("❌ Error building email template {}: {}", templateName, e.getMessage());
            
            // Fallback to simple text email
            return buildSimpleEmailBody(variables);
        }
    }

    /**
     * Build simple text email (fallback)
     */
    private String buildSimpleEmailBody(Map<String, Object> variables) {
        StringBuilder sb = new StringBuilder();
        sb.append("<html><body>");
        sb.append("<h2>").append(variables.getOrDefault("title", "Notification")).append("</h2>");
        sb.append("<p>").append(variables.getOrDefault("message", "")).append("</p>");
        
        if (variables.containsKey("actionUrl")) {
            sb.append("<p><a href=\"").append(variables.get("actionUrl")).append("\">View Details</a></p>");
        }
        
        sb.append("<hr>");
        sb.append("<p style='color: gray; font-size: 12px;'>Windchill PLM System</p>");
        sb.append("</body></html>");
        
        return sb.toString();
    }

    // ========================================================================
    // PREDEFINED EMAIL TEMPLATES
    // ========================================================================

    /**
     * Send ECN created notification email
     */
    public void sendECNCreatedEmail(String to, String ecnNumber, String creatorName, Long ecnId) {
        String subject = "New ECN Created: " + ecnNumber;
        String body = buildEmailFromTemplate("ecn-created", Map.of(
                "ecnNumber", ecnNumber,
                "creatorName", creatorName,
                "actionUrl", baseUrl + "/ecn/" + ecnId
        ));
        sendEmailAsync(to, subject, body, true);
    }

    /**
     * Send ECN approved notification email
     */
    public void sendECNApprovedEmail(String to, String ecnNumber, String approverName, Long ecnId) {
        String subject = "ECN Approved: " + ecnNumber;
        String body = buildEmailFromTemplate("ecn-approved", Map.of(
                "ecnNumber", ecnNumber,
                "approverName", approverName,
                "actionUrl", baseUrl + "/ecn/" + ecnId
        ));
        sendEmailAsync(to, subject, body, true);
    }

    /**
     * Send approval required email
     */
    public void sendApprovalRequiredEmail(String to, String ecnNumber, String requesterName, Long ecnId) {
        String subject = "Approval Required: " + ecnNumber;
        String body = buildEmailFromTemplate("approval-required", Map.of(
                "ecnNumber", ecnNumber,
                "requesterName", requesterName,
                "actionUrl", baseUrl + "/ecn/" + ecnId
        ));
        sendEmailAsync(to, subject, body, true);
    }

    /**
     * Send part state changed email
     */
    public void sendPartStateChangedEmail(String to, String partNumber, String oldState, String newState, Long partId) {
        String subject = "Part State Changed: " + partNumber;
        String body = buildEmailFromTemplate("part-state-changed", Map.of(
                "partNumber", partNumber,
                "oldState", oldState,
                "newState", newState,
                "actionUrl", baseUrl + "/parts/" + partId
        ));
        sendEmailAsync(to, subject, body, true);
    }

    /**
     * Send welcome email to new user
     */
    public void sendWelcomeEmail(String to, String username) {
        String subject = "Welcome to Windchill PLM";
        String body = buildEmailFromTemplate("welcome", Map.of(
                "username", username,
                "loginUrl", baseUrl + "/login"
        ));
        sendEmailAsync(to, subject, body, true);
    }
}
