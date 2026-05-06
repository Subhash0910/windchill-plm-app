package com.windchill.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "part_masters", indexes = {
    @Index(name = "idx_pm_number", columnList = "part_number"),
    @Index(name = "idx_pm_type", columnList = "part_type"),
    @Index(name = "idx_pm_container", columnList = "container_type,container_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class PartMaster extends BaseEntity {

    @Column(name = "part_number", nullable = false, unique = true, length = 80)
    private String partNumber;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(name = "part_type", length = 30)
    private String partType = "STANDARD"; // STANDARD, PHANTOM, PURCHASED, TOOL, REFERENCE

    @Column(name = "default_unit", length = 10)
    private String defaultUnit = "EA";

    @Column(length = 100)
    private String source; // MAKE, BUY, TRANSFER

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "container_type", length = 30) // PRODUCT, LIBRARY
    private String containerType;

    @Column(name = "container_id")
    private Long containerId;

    @Column(length = 500)
    private String description;

    // Relationship to latest version
    @Column(name = "latest_version_id")
    private Long latestVersionId;

    // @OneToMany but not needed for FK mapping — managed via Part.repository
    // Parts are linked via part.masterId = this.id
}
