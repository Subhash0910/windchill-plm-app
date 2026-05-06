package com.windchill.api.config;

import com.windchill.api.config.listeners.EventListener;
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
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Windchill-style EventManager.
 *
 * On startup:
 * 1. Reads wt.properties for listener registration file paths
 * 2. Parses each XML listener file to discover registered listeners
 * 3. Instantiates and wires listeners (constructor injection via Spring context)
 *
 * Runtime:
 * - {@code fireEvent(EventContext)} dispatches events to all listeners
 *   registered for the matching event name
 * - Async listeners run on a dedicated thread pool
 * - Sync listeners run inline (blocking)
 *
 * Mirrors PTC Windchill's EventManager / ListenerManager pattern.
 */
@Component
public class EventManager {

    private static final Logger log = LoggerFactory.getLogger(EventManager.class);

    private static final String LISTENERS_FILES_KEY = "wt.listeners.files";

    @Autowired
    private ServiceManager serviceManager;

    @Autowired
    private ResourceLoader resourceLoader;

    @Autowired(required = false)
    private List<EventListener> registeredListeners = new ArrayList<>();

    /**
     * Event name -> list of (listener, async flag) pairs.
     */
    private final Map<String, List<ListenerBinding>> listenerBindings = new ConcurrentHashMap<>();

    private final ExecutorService asyncExecutor = Executors.newCachedThreadPool(r -> {
        Thread t = new Thread(r, "windchill-listener-async");
        t.setDaemon(true);
        return t;
    });

    private final AtomicLong eventsDispatched = new AtomicLong(0);
    private final AtomicLong eventsFailed = new AtomicLong(0);

    @PostConstruct
    public void initialize() {
        log.info("Initializing Windchill EventManager...");
        loadListenerFiles();
        log.info("EventManager initialized: {} event bindings, {} listener instances",
                listenerBindings.size(), countUniqueListeners());
    }

    /**
     * Parse listener XML files and build the binding map.
     */
    private void loadListenerFiles() {
        String filesProp = serviceManager.getProperty(LISTENERS_FILES_KEY);
        if (filesProp == null || filesProp.isBlank()) {
            log.warn("No listener files configured (wt.listeners.files)");
            return;
        }

        String[] filePaths = filesProp.split(",");
        for (String filePath : filePaths) {
            filePath = filePath.trim();
            try {
                Resource resource = resourceLoader.getResource(filePath);
                if (!resource.exists()) {
                    log.warn("Listener file not found: {}", filePath);
                    continue;
                }
                parseListenerFile(resource, filePath);
            } catch (Exception e) {
                log.error("Failed to parse listener file: {}", filePath, e);
            }
        }
    }

    /**
     * Parse a single listener XML file and register bindings.
     */
    private void parseListenerFile(Resource resource, String filePath) throws Exception {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
        DocumentBuilder builder = factory.newDocumentBuilder();

        try (InputStream is = resource.getInputStream()) {
            org.w3c.dom.Document doc = builder.parse(is);
            doc.getDocumentElement().normalize();

            org.w3c.dom.NodeList listenerNodes = doc.getElementsByTagName("listener");
            for (int i = 0; i < listenerNodes.getLength(); i++) {
                org.w3c.dom.Element el = (org.w3c.dom.Element) listenerNodes.item(i);

                String name = el.getAttribute("name");
                String className = el.getAttribute("class");
                String eventsAttr = el.getAttribute("events");
                boolean async = "true".equals(el.getAttribute("async"));

                if (className == null || className.isEmpty()) {
                    log.warn("Listener '{}' has no class attribute, skipping", name);
                    continue;
                }

                if (eventsAttr == null || eventsAttr.isEmpty()) {
                    log.warn("Listener '{}' has no events attribute, skipping", name);
                    continue;
                }

                // Find the matching EventListener bean in the Spring context
                EventListener listenerInstance = findListenerInstance(className);
                if (listenerInstance == null) {
                    log.warn("Listener class {} not found in Spring context for '{}', skipping",
                            className, name);
                    continue;
                }

                // Bind to each event
                String[] eventNames = eventsAttr.split(",");
                for (String eventName : eventNames) {
                    eventName = eventName.trim();
                    listenerBindings
                            .computeIfAbsent(eventName, k -> new CopyOnWriteArrayList<>())
                            .add(new ListenerBinding(name, listenerInstance, async));
                    log.debug("Bound listener '{}' ({}) to event '{}' (async={})",
                            name, className, eventName, async);
                }
            }
        }
        log.info("Parsed listener file: {}", filePath);
    }

    /**
     * Find an EventListener bean by its class name.
     * Walks the list of injected EventListener beans to find a match.
     */
    private EventListener findListenerInstance(String className) {
        for (EventListener listener : registeredListeners) {
            if (listener.getClass().getName().equals(className)) {
                return listener;
            }
        }
        log.debug("Listener instance not found for class: {}", className);
        return null;
    }

    // ── Event Dispatch API ────────────────────────────────────────────────────

    /**
     * Fire an event synchronously. Async listeners are submitted to the thread pool;
     * sync listeners are invoked inline in the calling thread.
     *
     * @param context the event context
     */
    public void fireEvent(EventContext context) {
        String eventName = context.getEventName();
        if (eventName == null || eventName.isEmpty()) {
            log.warn("EventContext has no event name, skipping dispatch");
            return;
        }

        List<ListenerBinding> bindings = listenerBindings.get(eventName);
        if (bindings == null || bindings.isEmpty()) {
            log.trace("No listeners registered for event: {}", eventName);
            return;
        }

        eventsDispatched.incrementAndGet();

        for (ListenerBinding binding : bindings) {
            if (binding.async()) {
                asyncExecutor.submit(() -> invokeListener(binding, context));
            } else {
                invokeListener(binding, context);
            }
        }
    }

    /**
     * Fire an event with key parameters (convenience overload).
     */
    public void fireEvent(String eventName, String entityType, Long entityId,
                          String entityNumber, String actor) {
        EventContext context = EventContext.builder()
                .eventName(eventName)
                .entityType(com.windchill.common.enums.PlmEntityTypeEnum.valueOf(
                        entityType.toUpperCase()))
                .entityId(entityId)
                .entityNumber(entityNumber)
                .actor(actor)
                .build();
        fireEvent(context);
    }

    private void invokeListener(ListenerBinding binding, EventContext context) {
        try {
            binding.listener().onEvent(context);
        } catch (Exception e) {
            eventsFailed.incrementAndGet();
            log.error("Listener '{}' threw exception for event '{}': {}",
                    binding.name(), context.getEventName(), e.getMessage(), e);
        }
    }

    /**
     * Register a listener binding at runtime (e.g., from plugins).
     */
    public void registerListener(String eventName, String listenerName,
                                  EventListener listener, boolean async) {
        listenerBindings
                .computeIfAbsent(eventName, k -> new CopyOnWriteArrayList<>())
                .add(new ListenerBinding(listenerName, listener, async));
        log.info("Runtime listener registered: '{}' -> event '{}'", listenerName, eventName);
    }

    /**
     * Remove all bindings for a given event name.
     */
    public void removeBindings(String eventName) {
        listenerBindings.remove(eventName);
    }

    // ── Metrics ───────────────────────────────────────────────────────────────

    public long getEventsDispatched() { return eventsDispatched.get(); }
    public long getEventsFailed() { return eventsFailed.get(); }
    public int getBindingCount() { return listenerBindings.size(); }

    /**
     * Returns a read-only view of all event -> listener bindings.
     */
    public Map<String, List<ListenerBinding>> getListenerBindings() {
        return Collections.unmodifiableMap(listenerBindings);
    }

    private int countUniqueListeners() {
        Set<EventListener> seen = new HashSet<>();
        for (List<ListenerBinding> bindings : listenerBindings.values()) {
            for (ListenerBinding b : bindings) {
                seen.add(b.listener());
            }
        }
        return seen.size();
    }

    // ── Inner types ───────────────────────────────────────────────────────────

    record ListenerBinding(String name, EventListener listener, boolean async) {}
}
