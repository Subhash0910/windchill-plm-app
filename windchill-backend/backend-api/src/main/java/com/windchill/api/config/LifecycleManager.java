package com.windchill.api.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.InputStream;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Windchill-style LifecycleManager.
 *
 * On startup:
 * 1. Reads wt.properties for lifecycle template file paths
 * 2. Parses each XML lifecycle template
 * 3. Exposes template-driven lifecycle operations:
 *    - getTemplate(objectType)
 *    - getAvailableTransitions(objectType, currentState)
 *    - getInitialState(objectType)
 *    - getNextState(objectType, currentState, transition)
 *    - isValidTransition(objectType, currentState, transition)
 *
 * Replaces hardcoded lifecycle logic with template-driven behavior,
 * mirroring PTC Windchill's LifeCycleTemplate and LifeCycleManaged.
 */
@Component
public class LifecycleManager {

    private static final Logger log = LoggerFactory.getLogger(LifecycleManager.class);

    private static final String LIFECYCLE_FILES_KEY = "wt.lifecycle.files";

    @Autowired
    private ServiceManager serviceManager;

    @Autowired
    private ResourceLoader resourceLoader;

    /**
     * Keyed by objectType (PART, DOCUMENT, CHANGE_REQUEST).
     */
    private final Map<String, LifecycleTemplate> templates = new ConcurrentHashMap<>();

    @PostConstruct
    public void initialize() {
        log.info("Initializing Windchill LifecycleManager...");
        loadLifecycleFiles();
        log.info("LifecycleManager initialized with {} templates: {}",
                templates.size(), templates.keySet());
    }

    /**
     * Parse lifecycle XML files from wt.lifecycle.files property.
     */
    private void loadLifecycleFiles() {
        String filesProp = serviceManager.getProperty(LIFECYCLE_FILES_KEY);
        if (filesProp == null || filesProp.isBlank()) {
            log.warn("No lifecycle template files configured (wt.lifecycle.files)");
            return;
        }

        String[] filePaths = filesProp.split(",");
        for (String filePath : filePaths) {
            filePath = filePath.trim();
            try {
                Resource resource = resourceLoader.getResource(filePath);
                if (!resource.exists()) {
                    log.warn("Lifecycle template file not found: {}", filePath);
                    continue;
                }
                parseLifecycleFile(resource, filePath);
            } catch (Exception e) {
                log.error("Failed to parse lifecycle file: {}", filePath, e);
            }
        }
    }

    /**
     * Parse a single lifecycle XML file.
     */
    private void parseLifecycleFile(Resource resource, String filePath) throws Exception {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
        DocumentBuilder builder = factory.newDocumentBuilder();

        try (InputStream is = resource.getInputStream()) {
            org.w3c.dom.Document doc = builder.parse(is);
            doc.getDocumentElement().normalize();

            org.w3c.dom.Element root = doc.getDocumentElement();
            String templateName = root.getAttribute("name");
            String objectType = root.getAttribute("objectType");

            if (objectType == null || objectType.isEmpty()) {
                log.warn("Lifecycle template '{}' missing objectType, skipping", templateName);
                return;
            }

            LifecycleTemplate template = new LifecycleTemplate(templateName, objectType);

            // Parse states
            org.w3c.dom.NodeList stateNodes = root.getElementsByTagName("state");
            for (int i = 0; i < stateNodes.getLength(); i++) {
                org.w3c.dom.Element stateElement = (org.w3c.dom.Element) stateNodes.item(i);

                String stateName = stateElement.getAttribute("name");
                String displayName = stateElement.getAttribute("displayName");
                boolean isInitial = "true".equals(stateElement.getAttribute("isInitial"));
                boolean isTerminal = "true".equals(stateElement.getAttribute("isTerminal"));

                LifecycleState state = new LifecycleState(stateName, displayName, isInitial, isTerminal);

                // Parse transitions from this state
                org.w3c.dom.NodeList transitionNodes = stateElement.getElementsByTagName("transition");
                for (int j = 0; j < transitionNodes.getLength(); j++) {
                    org.w3c.dom.Element transElement = (org.w3c.dom.Element) transitionNodes.item(j);

                    String transName = transElement.getAttribute("name");
                    String toState = transElement.getAttribute("to");
                    boolean requiresApproval = "true".equals(transElement.getAttribute("requiresApproval"));
                    String guards = transElement.hasAttribute("guards") ? transElement.getAttribute("guards") : null;
                    boolean createsIteration = "true".equals(transElement.getAttribute("createsIteration"));

                    Transition transition = new Transition(transName, toState, requiresApproval, guards, createsIteration);
                    state.addTransition(transition);
                }

                template.addState(state);
                if (isInitial) {
                    template.setInitialState(stateName);
                }
            }

            templates.put(objectType, template);
            log.info("Loaded lifecycle template: {} (objectType={}, {} states)",
                    templateName, objectType, template.getStates().size());
        }
    }

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Returns the lifecycle template for the given object type.
     */
    public LifecycleTemplate getTemplate(String objectType) {
        return templates.get(objectType);
    }

    /**
     * Returns all registered lifecycle templates.
     */
    public Map<String, LifecycleTemplate> getTemplates() {
        return Collections.unmodifiableMap(templates);
    }

    /**
     * Returns the initial state name for the given object type.
     */
    public String getInitialState(String objectType) {
        LifecycleTemplate template = templates.get(objectType);
        return template != null ? template.getInitialState() : null;
    }

    /**
     * Returns available transition names from the given state.
     */
    public Set<String> getAvailableTransitions(String objectType, String currentState) {
        LifecycleTemplate template = templates.get(objectType);
        if (template == null) {
            log.warn("No lifecycle template for objectType: {}", objectType);
            return Collections.emptySet();
        }

        LifecycleState state = template.getStates().get(currentState);
        if (state == null) {
            log.warn("Unknown state '{}' for objectType: {}", currentState, objectType);
            return Collections.emptySet();
        }

        return state.getTransitions().keySet();
    }

    /**
     * Returns the target state name for a given transition, or null if invalid.
     */
    public String getNextState(String objectType, String currentState, String transitionName) {
        LifecycleTemplate template = templates.get(objectType);
        if (template == null) {
            return null;
        }

        LifecycleState state = template.getStates().get(currentState);
        if (state == null) {
            return null;
        }

        Transition transition = state.getTransitions().get(transitionName);
        return transition != null ? transition.toState() : null;
    }

    /**
     * Checks whether a transition is valid for the given object type and state.
     */
    public boolean isValidTransition(String objectType, String currentState, String transitionName) {
        LifecycleTemplate template = templates.get(objectType);
        if (template == null) {
            return false;
        }

        LifecycleState state = template.getStates().get(currentState);
        return state != null && state.getTransitions().containsKey(transitionName);
    }

    /**
     * Returns whether a transition requires approval.
     */
    public boolean requiresApproval(String objectType, String currentState, String transitionName) {
        LifecycleTemplate template = templates.get(objectType);
        if (template == null) return false;

        LifecycleState state = template.getStates().get(currentState);
        if (state == null) return false;

        Transition transition = state.getTransitions().get(transitionName);
        return transition != null && transition.requiresApproval();
    }

    /**
     * Returns whether a transition creates a new iteration.
     */
    public boolean createsIteration(String objectType, String currentState, String transitionName) {
        LifecycleTemplate template = templates.get(objectType);
        if (template == null) return false;

        LifecycleState state = template.getStates().get(currentState);
        if (state == null) return false;

        Transition transition = state.getTransitions().get(transitionName);
        return transition != null && transition.createsIteration();
    }

    /**
     * Returns whether a state is terminal (no further transitions expected).
     */
    public boolean isTerminalState(String objectType, String stateName) {
        LifecycleTemplate template = templates.get(objectType);
        if (template == null) return false;

        LifecycleState state = template.getStates().get(stateName);
        return state != null && state.isTerminal();
    }

    // ── Inner records ─────────────────────────────────────────────────────────

    public static class LifecycleTemplate {
        private final String name;
        private final String objectType;
        private String initialState;
        private final Map<String, LifecycleState> states = new LinkedHashMap<>();

        public LifecycleTemplate(String name, String objectType) {
            this.name = name;
            this.objectType = objectType;
        }

        public void addState(LifecycleState state) { states.put(state.name(), state); }
        public void setInitialState(String stateName) { this.initialState = stateName; }

        public String getName() { return name; }
        public String getObjectType() { return objectType; }
        public String getInitialState() { return initialState; }
        public Map<String, LifecycleState> getStates() { return states; }

        @Override
        public String toString() {
            return "LifecycleTemplate{name='" + name + "', objectType=" + objectType
                    + ", initialState=" + initialState + ", states=" + states.size() + "}";
        }
    }

    public static class LifecycleState {
        private final String name;
        private final String displayName;
        private final boolean initial;
        private final boolean terminal;
        private final Map<String, Transition> transitions = new LinkedHashMap<>();

        public LifecycleState(String name, String displayName, boolean initial, boolean terminal) {
            this.name = name;
            this.displayName = displayName;
            this.initial = initial;
            this.terminal = terminal;
        }

        public void addTransition(Transition t) { transitions.put(t.name(), t); }

        public String name() { return name; }
        public String displayName() { return displayName; }
        public boolean isInitial() { return initial; }
        public boolean isTerminal() { return terminal; }
        public Map<String, Transition> getTransitions() { return transitions; }
    }

    public record Transition(String name, String toState, boolean requiresApproval,
                             String guards, boolean createsIteration) {}
}
