package com.windchill.domain.util;

import com.windchill.domain.entity.Part;

/**
 * VersionUtils — central helper for Windchill-style version/iteration display.
 *
 * Windchill notation:
 *   - Revision (letter):  A, B, C … released baselines
 *   - Iteration (number): 1, 2, 3 … working copies within a revision
 *   - Combined label:     A.1, A.2, B.1  (the format users see everywhere)
 *
 * Use this class in ALL places that need to display a version string so that
 * the notation stays consistent across parts, documents, change orders, etc.
 */
public final class VersionUtils {

    private VersionUtils() {}

    /**
     * Returns "A.1" style label from a Part entity.
     * Example: revision="B", iteration=3  →  "B.3"
     */
    public static String label(Part part) {
        if (part == null) return "";
        return label(part.getRevision(), part.getIteration());
    }

    /**
     * Returns "A.1" style label from raw revision + iteration values.
     * Safe to call with nulls — returns "-.0" as a fallback.
     */
    public static String label(String revision, Integer iteration) {
        String rev = (revision != null && !revision.isBlank()) ? revision.toUpperCase() : "-";
        int iter = (iteration != null) ? iteration : 0;
        return rev + "." + iter;
    }

    /**
     * Returns true if the part is currently checked out (locked by a user).
     */
    public static boolean isCheckedOut(Part part) {
        return part != null && part.getCheckedOutBy() != null && !part.getCheckedOutBy().isBlank();
    }

    /**
     * Returns a display-friendly status string for use in table cells and info pages.
     * Examples:  "A.2 (checked out by jsmith)"  or  "B.1"
     */
    public static String labelWithStatus(Part part) {
        if (part == null) return "";
        String base = label(part);
        if (isCheckedOut(part)) {
            return base + " \uD83D\uDD12 (checked out by " + part.getCheckedOutBy() + ")";
        }
        return base;
    }

    /**
     * Computes the next iteration number for a checkout operation.
     * Simply currentIteration + 1.
     */
    public static int nextIteration(Part current) {
        return (current.getIteration() != null ? current.getIteration() : 0) + 1;
    }
}
