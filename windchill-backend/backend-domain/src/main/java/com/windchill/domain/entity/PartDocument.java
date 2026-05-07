package com.windchill.domain.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * Join table entity for the Part ↔ WTDocument relationship.
 * Declaring this as a JPA entity ensures Hibernate DDL creates
 * the part_documents table in H2 demo mode (Flyway is disabled).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
    name = "part_documents",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_partdoc",
        columnNames = {"part_id", "document_id"}
    ),
    indexes = {
        @Index(name = "idx_partdoc_part", columnList = "part_id"),
        @Index(name = "idx_partdoc_doc",  columnList = "document_id")
    }
)
public class PartDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "part_id", nullable = false)
    private Long partId;

    @Column(name = "document_id", nullable = false)
    private Long documentId;

    public PartDocument(Long partId, Long documentId) {
        this.partId = partId;
        this.documentId = documentId;
    }
}
