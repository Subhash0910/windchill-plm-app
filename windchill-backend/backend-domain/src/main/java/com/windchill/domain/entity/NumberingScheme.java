package com.windchill.domain.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "numbering_schemes",
        indexes = {
                @Index(name = "idx_ns_target_type", columnList = "target_type"),
                @Index(name = "idx_ns_active", columnList = "is_active")
        })
public class NumberingScheme extends BaseEntity {

    @Column(name = "scheme_name", nullable = false, length = 100)
    private String schemeName;

    @Column(name = "target_type", nullable = false, length = 50)
    private String targetType;

    @Column(name = "prefix", length = 50)
    private String prefix;

    @Column(name = "suffix", length = 50)
    private String suffix;

    @Column(name = "include_year", nullable = false)
    private Boolean includeYear = false;

    @Column(name = "include_context", nullable = false)
    private Boolean includeContext = false;

    @Column(name = "sequence_start", nullable = false)
    private Integer sequenceStart = 1;

    @Column(name = "sequence_increment", nullable = false)
    private Integer sequenceIncrement = 1;

    @Column(name = "sequence_current", nullable = false)
    private Integer sequenceCurrent = 1;

    @Column(name = "min_digits", nullable = false)
    private Integer minDigits = 4;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "is_default", nullable = false)
    private Boolean isDefault = false;
}
