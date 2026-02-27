package com.tcs.windchill.notification.service;

import com.tcs.windchill.notification.model.Notification;
import com.tcs.windchill.notification.model.NotificationType;

/**
 * Email template renderer
 * 
 * Generates HTML emails for different notification types
 * 
 * @author Subhash
 */
public class EmailTemplate {

    private static final String BASE_URL = "http://localhost:3000"; // TODO: Make configurable

    /**
     * Get template for notification type
     */
    public static EmailTemplate forNotificationType(NotificationType type) {
        return new EmailTemplate();
    }

    /**
     * Render email HTML
     */
    public String render(Notification notification) {
        String header = renderHeader();
        String body = renderBody(notification);
        String footer = renderFooter(notification);

        return wrapInLayout(header + body + footer);
    }

    /**
     * HTML email layout
     */
    private String wrapInLayout(String content) {
        return "<!DOCTYPE html>\n" +
            "<html>\n" +
            "<head>\n" +
            "  <meta charset=\"UTF-8\">\n" +
            "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
            "  <style>\n" +
            "    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }\n" +
            "    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }\n" +
            "    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }\n" +
            "    .header h1 { margin: 0; font-size: 24px; }\n" +
            "    .content { padding: 30px; }\n" +
            "    .notification-card { background: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px; }\n" +
            "    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white !important; text-decoration: none; border-radius: 5px; margin: 20px 0; }\n" +
            "    .button:hover { background: #5568d3; }\n" +
            "    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }\n" +
            "    .urgent { border-left-color: #dc3545 !important; }\n" +
            "    .high { border-left-color: #ffc107 !important; }\n" +
            "  </style>\n" +
            "</head>\n" +
            "<body>\n" +
            "  <div class=\"container\">\n" +
            content +
            "  </div>\n" +
            "</body>\n" +
            "</html>";
    }

    /**
     * Render email header
     */
    private String renderHeader() {
        return "    <div class=\"header\">\n" +
            "      <h1>🛠️ Windchill PLM</h1>\n" +
            "      <p style=\"margin: 5px 0 0 0; opacity: 0.9;\">Engineering Change Management System</p>\n" +
            "    </div>\n";
    }

    /**
     * Render notification body
     */
    private String renderBody(Notification notification) {
        String priorityClass = notification.getPriority().name().toLowerCase();
        String icon = getIconForType(notification.getType());

        return "    <div class=\"content\">\n" +
            "      <h2 style=\"color: #333; margin-top: 0;\">" + icon + " " + notification.getTitle() + "</h2>\n" +
            "      <div class=\"notification-card " + priorityClass + "\">\n" +
            "        <p style=\"margin: 0; font-size: 16px;\">" + notification.getMessage() + "</p>\n" +
            "      </div>\n" +
            (notification.getActionUrl() != null ? renderActionButton(notification.getActionUrl()) : "") +
            "      <p style=\"color: #666; font-size: 14px; margin-top: 20px;\">\n" +
            "        <strong>Notification Type:</strong> " + formatNotificationType(notification.getType()) + "<br>\n" +
            "        <strong>Priority:</strong> " + notification.getPriority() + "<br>\n" +
            "        <strong>Time:</strong> " + notification.getCreatedAt() + "\n" +
            "      </p>\n" +
            "    </div>\n";
    }

    /**
     * Render action button
     */
    private String renderActionButton(String actionUrl) {
        String fullUrl = BASE_URL + actionUrl;
        return "      <div style=\"text-align: center;\">\n" +
            "        <a href=\"" + fullUrl + "\" class=\"button\">View Details →</a>\n" +
            "      </div>\n";
    }

    /**
     * Render email footer
     */
    private String renderFooter(Notification notification) {
        String unsubscribeUrl = BASE_URL + "/settings/notifications";
        
        return "    <div class=\"footer\">\n" +
            "      <p>\n" +
            "        This is an automated notification from Windchill PLM.<br>\n" +
            "        <a href=\"" + unsubscribeUrl + "\" style=\"color: #667eea;\">Manage notification preferences</a>\n" +
            "      </p>\n" +
            "      <p style=\"margin-top: 10px; color: #999;\">\n" +
            "        &copy; 2026 Windchill PLM | TCS Innovation Lab\n" +
            "      </p>\n" +
            "    </div>\n";
    }

    /**
     * Get emoji icon for notification type
     */
    private String getIconForType(NotificationType type) {
        switch (type) {
            case ECN_CREATED: return "📄";
            case ECN_APPROVED: return "✅";
            case ECN_REJECTED: return "❌";
            case ECN_SUBMITTED: return "🚀";
            case APPROVAL_REQUIRED: return "⏳";
            case PART_STATE_CHANGED: return "🔧";
            case USER_MENTIONED: return "👤";
            case TASK_ASSIGNED: return "📊";
            case SYSTEM_ALERT: return "⚠️";
            default: return "🔔";
        }
    }

    /**
     * Format notification type for display
     */
    private String formatNotificationType(NotificationType type) {
        return type.name().replace("_", " ").toLowerCase()
            .replaceAll("\\b\\w", m -> m.group().toUpperCase());
    }
}
