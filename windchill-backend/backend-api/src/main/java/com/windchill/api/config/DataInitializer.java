package com.windchill.api.config;

/**
 * DataInitializer removed.
 *
 * Demo data is now seeded via Flyway migration:
 *   V105__seed_demo_data.sql
 *
 * Flyway runs each migration exactly once and tracks it in
 * flyway_schema_history, which is far more reliable than a
 * CommandLineRunner that checks user count.
 */
public class DataInitializer {
    // intentionally empty — kept as placeholder to avoid breaking any
    // existing @Autowired references (there are none).
}
