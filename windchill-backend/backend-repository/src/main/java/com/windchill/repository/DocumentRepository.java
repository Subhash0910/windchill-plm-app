package com.windchill.repository;

import com.windchill.common.enums.StatusEnum;
import com.windchill.domain.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {
    Optional<Document> findByDocumentNumber(String documentNumber);

    List<Document> findByProjectIdAndIsDeletedFalse(Long projectId);

    List<Document> findByStatusAndIsDeletedFalse(StatusEnum status);

    @Query("SELECT d FROM Document d WHERE d.isDeleted = false ORDER BY d.createdAt DESC")
    List<Document> findAllActive();

    @Query("SELECT d FROM Document d WHERE d.title LIKE %:title% AND d.isDeleted = false")
    List<Document> findByTitleContaining(@Param("title") String title);
}
