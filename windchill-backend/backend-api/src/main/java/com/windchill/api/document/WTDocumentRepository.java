package com.windchill.api.document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WTDocumentRepository extends JpaRepository<WTDocument, Long> {

    // All latest docs in a context
    List<WTDocument> findByContextIdAndIsLatestTrueAndIsDeletedFalse(Long contextId);

    // All latest by context + type
    List<WTDocument> findByContextIdAndDocTypeAndIsLatestTrueAndIsDeletedFalse(Long contextId, String docType);

    // Search by keyword
    @Query("""
        SELECT d FROM WTDocument d
        WHERE d.isDeleted = false AND d.isLatest = true
          AND d.contextId = :ctxId
          AND (LOWER(d.docNumber) LIKE LOWER(CONCAT('%', :kw, '%'))
            OR LOWER(d.name)      LIKE LOWER(CONCAT('%', :kw, '%')))
        """)
    List<WTDocument> search(@Param("ctxId") Long contextId, @Param("kw") String keyword);

    // Docs linked to a specific part — uses native SQL because part_documents is a
    // plain join table, not a JPA-managed entity; JPQL cannot JOIN raw table names.
    @Query(value = """
        SELECT d.* FROM wt_documents d
        JOIN part_documents pd ON pd.document_id = d.id
        WHERE pd.part_id = :partId AND d.is_deleted = false
        """, nativeQuery = true)
    List<WTDocument> findByPartId(@Param("partId") Long partId);

    @Query(value = """
        SELECT pd.part_id FROM part_documents pd
        WHERE pd.document_id = :docId
        """, nativeQuery = true)
    List<Long> findRelatedPartIds(@Param("docId") Long docId);

    Optional<WTDocument> findByIdAndIsDeletedFalse(Long id);

    boolean existsByContextIdAndDocNumberAndRevisionAndIteration(
        Long contextId, String docNumber, String revision, int iteration);
}
