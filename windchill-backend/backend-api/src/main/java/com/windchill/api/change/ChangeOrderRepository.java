package com.windchill.api.change;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChangeOrderRepository extends JpaRepository<ChangeOrder, Long> {

    List<ChangeOrder> findByContextIdAndIsDeletedFalseOrderByCreatedAtDesc(Long contextId);

    List<ChangeOrder> findByContextIdAndStateAndIsDeletedFalse(Long contextId, ChangeOrder.State state);

    List<ChangeOrder> findByEcrIdAndIsDeletedFalse(Long ecrId);

    Optional<ChangeOrder> findByIdAndIsDeletedFalse(Long id);

    boolean existsByContextIdAndEcoNumber(Long contextId, String ecoNumber);

    @Query("""
        SELECT e FROM ChangeOrder e
        WHERE e.isDeleted = false AND e.contextId = :ctxId
          AND (LOWER(e.ecoNumber) LIKE LOWER(CONCAT('%', :kw, '%'))
            OR LOWER(e.title)     LIKE LOWER(CONCAT('%', :kw, '%')))
        ORDER BY e.createdAt DESC
        """)
    List<ChangeOrder> search(@Param("ctxId") Long contextId, @Param("kw") String keyword);
}
