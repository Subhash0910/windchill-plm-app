package com.windchill.domain.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * ChangeOrderItem (ECO line) — one impacted part inside an approved ChangeRequest.
 *
 * Created automatically when a ChangeRequest is APPROVED.
 * Records the original part ID and the new revised part ID produced by revisePart().
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(
    name = "change_order_items",
    indexes = {
        @Index(name = "idx_coi_cr",        columnList = "change_request_id"),
        @Index(name = "idx_coi_orig_part",  columnList = "original_part_id"),
        @Index(name = "idx_coi_new_part",   columnList = "new_part_id")
    }
)
public class ChangeOrderItem extends BaseEntity {

    @Column(name = "change_request_id", nullable = false)
    private Long changeRequestId;

    /** The part that existed before approval */
    @Column(name = "original_part_id", nullable = false)
    private Long originalPartId;

    /** The new revised part created by revisePart() on approval; null until approved */
    @Column(name = "new_part_id")
    private Long newPartId;

    @Column(name = "original_part_number", length = 80)
    private String originalPartNumber;

    @Column(name = "original_revision", length = 10)
    private String originalRevision;

    @Column(name = "new_revision", length = 10)
    private String newRevision;

    @Column(name = "action_note", length = 500)
    private String actionNote;
}
