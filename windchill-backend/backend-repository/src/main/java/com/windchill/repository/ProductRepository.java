package com.windchill.repository;

import com.windchill.common.enums.StatusEnum;
import com.windchill.domain.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    Optional<Product> findByProductCode(String productCode);

    List<Product> findByProjectIdAndIsDeletedFalse(Long projectId);

    List<Product> findByStatusAndIsDeletedFalse(StatusEnum status);

    @Query("SELECT p FROM Product p WHERE p.isDeleted = false ORDER BY p.createdAt DESC")
    List<Product> findAllActive();

    @Query("SELECT p FROM Product p WHERE p.productName LIKE %:name% AND p.isDeleted = false")
    List<Product> findByProductNameContaining(@Param("name") String name);
}
