package com.windchill.api.config;

import com.windchill.domain.entity.AccessControlRule;
import com.windchill.repository.AccessControlRuleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

/**
 * Seeds the access_control_rules table from acl/domainPolicies.xml on first
 * startup when the table is empty.
 *
 * <p>The XML file acts as the canonical source of default ACL policies, much
 * like Windchill's domain policy administration files.</p>
 *
 * <p>To force re-seed: delete all rows from access_control_rules and restart.</p>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AclDataSeeder implements ApplicationRunner {

    private static final String POLICIES_XML = "acl/domainPolicies.xml";

    private final AccessControlRuleRepository aclRepo;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        if (aclRepo.count() > 0) {
            log.info("ACL rules already seeded ({} rules exist). Skipping seed.", aclRepo.count());
            return;
        }

        log.info("No ACL rules found. Seeding defaults from {} ...", POLICIES_XML);

        List<AccessControlRule> rules = parsePoliciesXml();
        if (rules.isEmpty()) {
            log.warn("No <policy> elements found in {}. ACL table will remain empty.", POLICIES_XML);
            return;
        }

        aclRepo.saveAll(rules);
        log.info("Seeded {} default ACL rules from {}.", rules.size(), POLICIES_XML);
    }

    // ── XML parsing ──────────────────────────────────────────────────────────

    private List<AccessControlRule> parsePoliciesXml() throws Exception {
        List<AccessControlRule> rules = new ArrayList<>();

        ClassPathResource resource = new ClassPathResource(POLICIES_XML);
        try (InputStream is = resource.getInputStream()) {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            DocumentBuilder builder = factory.newDocumentBuilder();
            Document doc = builder.parse(is);
            doc.getDocumentElement().normalize();

            NodeList policyNodes = doc.getElementsByTagName("policy");
            for (int i = 0; i < policyNodes.getLength(); i++) {
                Element el = (Element) policyNodes.item(i);
                AccessControlRule rule = new AccessControlRule();

                rule.setPrincipalType(getAttr(el, "principalType", "ALL"));
                rule.setPrincipalName(getAttr(el, "principalName", null));

                String pid = getAttr(el, "principalId", null);
                rule.setPrincipalId(pid != null ? Long.parseLong(pid) : null);

                rule.setTargetType(getAttr(el, "targetType", "GLOBAL"));

                String tid = getAttr(el, "targetId", null);
                rule.setTargetId(tid != null ? Long.parseLong(tid) : null);

                rule.setPermission(getAttr(el, "permission", "READ"));
                rule.setIsAllowed(Boolean.parseBoolean(getAttr(el, "isAllowed", "true")));
                rule.setPriority(Integer.parseInt(getAttr(el, "priority", "0")));
                rule.setScope(getAttr(el, "scope", "OBJECT"));

                rules.add(rule);
            }
        }

        return rules;
    }

    private static String getAttr(Element el, String name, String defaultValue) {
        if (el.hasAttribute(name)) {
            return el.getAttribute(name);
        }
        return defaultValue;
    }
}
