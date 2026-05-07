package com.windchill.domain.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@Entity
@Table(name = "part_substitutes",
    indexes = {
        @Index(name = "idx_sub_part", columnList = "part_id"),
        @Index(name = "idx_sub_substitute", columnList = "substitute_part_id")
    })
public class PartSubstitute extends BaseEntity {

    @Column(name = "part_id", nullable = false)
    private Long partId;

    @Column(name = "substitute_part_id", nullable = false)
    private Long substitutePartId;

    // SUBSTITUTE | ALTERNATE
    @Column(name = "substitute_type", nullable = false, length = 20)
    private String substituteType = "SUBSTITUTE";

    @Column(name = "rank")
    private Integer rank = 1;

    @Column(name = "note", length = 500)
    private String note;
}
