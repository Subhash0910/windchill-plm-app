package com.windchill.api.config;

import com.windchill.domain.entity.NumberingScheme;
import com.windchill.domain.entity.Preference;
import com.windchill.repository.NumberingSchemeRepository;
import com.windchill.repository.PreferenceRepository;
import com.windchill.repository.ObjectTemplateRepository;
import com.windchill.domain.entity.ObjectTemplate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class StartupDataSeeder implements CommandLineRunner {

    private final PreferenceRepository preferenceRepository;
    private final NumberingSchemeRepository numberingSchemeRepository;
    private final ObjectTemplateRepository templateRepository;

    @Override
    public void run(String... args) {
        seedPreferences();
        seedNumberingSchemes();
        seedObjectTemplates();
    }

    private void seedPreferences() {
        if (preferenceRepository.count() > 0) {
            log.info("Preferences already seeded ({} existing), skipping.", preferenceRepository.count());
            return;
        }

        log.info("Seeding default system preferences...");
        preferenceRepository.save(pref("PART_DEFAULT_UNIT", "EA", "STRING", "PART", "SYSTEM", null,
                "Default Part Unit", "Default unit of measure for new parts"));
        preferenceRepository.save(pref("PART_AUTO_REVISION", "true", "BOOLEAN", "PART", "SYSTEM", null,
                "Auto Revision", "Automatically suggest next revision on revise"));
        preferenceRepository.save(pref("ECR_AUTO_SUBMIT", "false", "BOOLEAN", "CHANGE", "SYSTEM", null,
                "Auto Submit ECR", "Automatically submit ECR on creation"));
        preferenceRepository.save(pref("NOTIFICATION_ENABLED", "true", "BOOLEAN", "NOTIFICATION", "SYSTEM", null,
                "Notifications Enabled", "Enable in-app notifications"));
        preferenceRepository.save(pref("UI_THEME", "light", "STRING", "UI", "SYSTEM", null,
                "UI Theme", "Default UI theme (light/dark)"));
        preferenceRepository.save(pref("UI_PAGE_SIZE", "20", "INTEGER", "UI", "SYSTEM", null,
                "Page Size", "Default number of items per page in lists"));
        preferenceRepository.save(pref("SESSION_TIMEOUT", "30", "INTEGER", "SYSTEM", "SYSTEM", null,
                "Session Timeout (min)", "Session timeout in minutes"));
        preferenceRepository.save(pref("FILE_MAX_SIZE", "100MB", "STRING", "DOCUMENT", "SYSTEM", null,
                "Max File Upload Size", "Maximum file upload size"));
        log.info("Seeded {} default system preferences.", 8);
    }

    private void seedNumberingSchemes() {
        if (numberingSchemeRepository.count() > 0) {
            log.info("Numbering schemes already seeded ({} existing), skipping.", numberingSchemeRepository.count());
            return;
        }

        log.info("Seeding default numbering schemes...");
        numberingSchemeRepository.save(ns("Default PART", "PART", "PART-", "", 1, 4));
        numberingSchemeRepository.save(ns("Default DOCUMENT", "DOCUMENT", "DOC-", "", 1, 4));
        numberingSchemeRepository.save(ns("Default ECR", "ECR", "ECR-", "", 1, 4));
        numberingSchemeRepository.save(ns("Default ECO", "ECO", "ECO-", "", 1, 4));
        numberingSchemeRepository.save(ns("Default ECN", "ECN", "ECN-", "", 1, 4));
        numberingSchemeRepository.save(ns("Default CHANGE_TASK", "CHANGE_TASK", "CT-", "", 1, 4));
        log.info("Seeded {} default numbering schemes.", 6);
    }

    private void seedObjectTemplates() {
        if (templateRepository.count() > 0) {
            log.info("Object templates already seeded ({} existing), skipping.", templateRepository.count());
            return;
        }

        log.info("Seeding default object templates...");
        templateRepository.save(tmpl("Standard Mechanical Part", "PART",
                "Standard mechanical part with inch/pound defaults",
                "{\"partType\":\"STANDARD\",\"defaultUnit\":\"EA\",\"lifecycleState\":\"INWORK\"}",
                true, "MECHANICAL", "gear"));
        templateRepository.save(tmpl("Electrical Component", "PART",
                "Electrical component with metric defaults",
                "{\"partType\":\"ELECTRICAL\",\"defaultUnit\":\"EA\",\"lifecycleState\":\"INWORK\"}",
                true, "ELECTRICAL", "bolt"));
        templateRepository.save(tmpl("Specification Document", "DOCUMENT",
                "Standard specification document template",
                "{\"docType\":\"SPEC\",\"lifecycleState\":\"INWORK\"}",
                true, null, "file-text"));
        templateRepository.save(tmpl("Engineering Change Request", "ECR",
                "Standard ECR with normal priority",
                "{\"priority\":\"NORMAL\",\"status\":\"DRAFT\"}",
                true, null, "clipboard"));
        log.info("Seeded {} default object templates.", 4);
    }

    // ── Helper factories ───────────────────────────────────────────────────────

    private static Preference pref(String key, String value, String type, String category,
                                   String scope, Long scopeId, String displayName, String description) {
        Preference p = new Preference();
        p.setPrefKey(key);
        p.setPrefValue(value);
        p.setPrefType(type);
        p.setCategory(category);
        p.setScope(scope);
        p.setScopeId(scopeId);
        p.setDisplayName(displayName);
        p.setDescription(description);
        return p;
    }

    private static NumberingScheme ns(String name, String targetType, String prefix,
                                      String suffix, int seqStart, int minDigits) {
        NumberingScheme ns = new NumberingScheme();
        ns.setSchemeName(name);
        ns.setTargetType(targetType);
        ns.setPrefix(prefix);
        ns.setSuffix(suffix);
        ns.setSequenceStart(seqStart);
        ns.setSequenceCurrent(seqStart);
        ns.setMinDigits(minDigits);
        ns.setIsDefault(true);
        return ns;
    }

    private static ObjectTemplate tmpl(String name, String targetType, String desc,
                                        String data, boolean isPublic, String category, String icon) {
        ObjectTemplate t = new ObjectTemplate();
        t.setTemplateName(name);
        t.setTargetType(targetType);
        t.setDescription(desc);
        t.setTemplateData(data);
        t.setIsPublic(isPublic);
        t.setCategory(category);
        t.setIconName(icon);
        return t;
    }
}
