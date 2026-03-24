package com.windchill.service.plm;

import com.windchill.common.enums.LifecycleStateEnum;
import com.windchill.domain.entity.Part;

import java.util.List;

public interface IPartService {
    Part createPart(Part part);
    Part getPart(Long id);
    List<Part> listParts(Long contextId);
    Part updatePart(Long id, Part details);
    Part promote(Long id, LifecycleStateEnum target);
    Part revise(Long id);

    List<Part> whereUsed(Long partId);

    void deletePart(Long id);

    List<Part> searchPartsByNumber(String query);

    /**
     * Check Out a part to the calling user.
     * Creates a new iteration (working copy), locks the part to the user,
     * and marks the previous iteration as not-latest.
     * Throws BusinessException if already checked out by someone else.
     */
    Part checkOut(Long partId);

    /**
     * Check In a previously checked-out part.
     * Commits the working copy as the new latest iteration,
     * clears the checkedOutBy lock, and increments the iteration number.
     * Throws BusinessException if part is not checked out by the calling user.
     */
    Part checkIn(Long partId, String name, String description);

    /**
     * Undo Check Out — discards the working copy iteration and restores the
     * previous latest iteration. Only the owner or an ADMIN/MANAGER can undo.
     */
    Part undoCheckOut(Long partId);
}
