package com.windchill.api.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.core.io.support.ResourcePatternUtils;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.InputStream;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Windchill-style ServiceManager.
 *
 * On startup:
 * 1. Loads wt.properties
 * 2. Parses XML service registration files listed in wt.services.files
 * 3. Builds an in-memory registry mapping service-name to its interface + implementation
 *
 * Provides {@code getService(String name)} for programmatic service lookup,
 * mirroring PTC Windchill's WTServiceManager.
 */
@Component
public class ServiceManager {

    private static final Logger log = LoggerFactory.getLogger(ServiceManager.class);

    private static final String WT_PROPERTIES = "classpath:wt.properties";
    private static final String SERVICES_FILES_KEY = "wt.services.files";

    @Autowired
    private ApplicationContext applicationContext;

    @Autowired
    private ResourceLoader resourceLoader;

    private final Map<String, ServiceDefinition> registry = new ConcurrentHashMap<>();
    private Properties wtProperties;

    @PostConstruct
    public void initialize() {
        log.info("Initializing Windchill ServiceManager...");
        loadWtProperties();
        loadServiceFiles();
        log.info("ServiceManager initialized with {} registered services", registry.size());
    }

    /**
     * Load wt.properties from classpath.
     */
    private void loadWtProperties() {
        wtProperties = new Properties();
        try {
            Resource resource = resourceLoader.getResource(WT_PROPERTIES);
            if (resource.exists()) {
                try (InputStream is = resource.getInputStream()) {
                    wtProperties.load(is);
                }
                log.info("Loaded wt.properties: {} keys", wtProperties.size());
            } else {
                log.warn("wt.properties not found at {}, using defaults", WT_PROPERTIES);
                setDefaults();
            }
        } catch (Exception e) {
            log.error("Failed to load wt.properties", e);
            setDefaults();
        }
    }

    private void setDefaults() {
        wtProperties.setProperty(SERVICES_FILES_KEY,
                "classpath:services/partServices.xml," +
                "classpath:services/changeServices.xml," +
                "classpath:services/docServices.xml");
    }

    /**
     * Parse each XML service registration file and populate the registry.
     */
    private void loadServiceFiles() {
        String filesProp = wtProperties.getProperty(SERVICES_FILES_KEY);
        if (filesProp == null || filesProp.isBlank()) {
            log.warn("No service files configured (wt.services.files)");
            return;
        }

        String[] filePaths = filesProp.split(",");
        for (String filePath : filePaths) {
            filePath = filePath.trim();
            try {
                Resource resource = resourceLoader.getResource(filePath);
                if (!resource.exists()) {
                    log.warn("Service file not found: {}", filePath);
                    continue;
                }
                parseServiceFile(resource, filePath);
            } catch (Exception e) {
                log.error("Failed to parse service file: {}", filePath, e);
            }
        }
    }

    /**
     * Parse a single service XML file and register its services.
     */
    private void parseServiceFile(Resource resource, String filePath) throws Exception {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
        DocumentBuilder builder = factory.newDocumentBuilder();

        try (InputStream is = resource.getInputStream()) {
            org.w3c.dom.Document doc = builder.parse(is);
            doc.getDocumentElement().normalize();

            org.w3c.dom.NodeList serviceNodes = doc.getElementsByTagName("service");
            for (int i = 0; i < serviceNodes.getLength(); i++) {
                org.w3c.dom.Element svcElement = (org.w3c.dom.Element) serviceNodes.item(i);

                String name = svcElement.getAttribute("name");
                String intf = svcElement.hasAttribute("interface") ? svcElement.getAttribute("interface") : null;
                String impl = svcElement.getAttribute("impl");
                boolean singleton = "true".equals(svcElement.getAttribute("singleton"));

                if (name == null || name.isEmpty() || impl == null || impl.isEmpty()) {
                    log.warn("Skipping incomplete service definition in {}: name={}, impl={}", filePath, name, impl);
                    continue;
                }

                ServiceDefinition def = new ServiceDefinition(name, intf, impl, singleton);
                registry.put(name, def);
                log.debug("Registered service: {} -> {} (interface: {}, singleton: {})",
                        name, impl, intf, singleton);
            }
        }
        log.info("Parsed service file {}: {} services registered", filePath, serviceNodesCount(resource));
    }

    private int serviceNodesCount(Resource resource) {
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            DocumentBuilder builder = factory.newDocumentBuilder();
            try (InputStream is = resource.getInputStream()) {
                org.w3c.dom.Document doc = builder.parse(is);
                return doc.getElementsByTagName("service").getLength();
            }
        } catch (Exception e) {
            return 0;
        }
    }

    /**
     * Look up a service by its registered name.
     *
     * @param name service name as defined in XML (e.g., "PartService")
     * @return the Spring bean for that implementation class, or null if not found
     */
    public Object getService(String name) {
        ServiceDefinition def = registry.get(name);
        if (def == null) {
            log.warn("Service not found: {}", name);
            return null;
        }

        try {
            Class<?> implClass = Class.forName(def.impl());
            return applicationContext.getBean(implClass);
        } catch (ClassNotFoundException e) {
            log.error("Implementation class not found for service '{}': {}", name, def.impl());
            return null;
        } catch (Exception e) {
            log.error("Failed to resolve Spring bean for service '{}': {}", name, e.getMessage());
            return null;
        }
    }

    /**
     * Returns a read-only view of the service registry.
     */
    public Map<String, ServiceDefinition> getRegistry() {
        return Collections.unmodifiableMap(registry);
    }

    /**
     * Returns the wt.properties with all resolved configuration.
     */
    public Properties getWtProperties() {
        return wtProperties;
    }

    /**
     * Returns a property value from wt.properties.
     */
    public String getProperty(String key) {
        return wtProperties != null ? wtProperties.getProperty(key) : null;
    }

    /**
     * Internal service definition record.
     */
    public record ServiceDefinition(String name, String interfaceClass, String impl, boolean singleton) {}
}
