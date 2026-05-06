package com.windchill.domain.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(
        name = "part_classifications",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uq_pc_part_node_attr",
                        columnNames = {"part_id", "node_id", "attr_name"}
                )
        }
)
public class PartClassification extends BaseEntity {

    @Column(name = "part_id", nullable = false)
    private Long partId;

    @Column(name = "node_id", nullable = false)
    private Long nodeId;

    @Column(name = "attr_name", nullable = false, length = 255)
    private String attrName;

    @Column(name = "attr_value", columnDefinition = "TEXT")
    private String attrValue;
}
