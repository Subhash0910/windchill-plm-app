package com.windchill.repository;

import com.windchill.domain.entity.PartDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface PartDocumentRepository extends JpaRepository<PartDocument, Long> {

    boolean existsByPartIdAndDocumentId(Long partId, Long documentId);

    @Transactional
    void deleteByPartIdAndDocumentId(Long partId, Long documentId);
}
