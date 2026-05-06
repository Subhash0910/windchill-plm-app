package com.windchill.repository;

import com.windchill.domain.entity.ManufacturerPart;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ManufacturerPartRepository extends JpaRepository<ManufacturerPart, Long> {

    List<ManufacturerPart> findByPartIdAndIsDeletedFalseOrderByManufacturerNameAsc(Long partId);

    List<ManufacturerPart> findByManufacturerNameContainingIgnoreCaseAndIsDeletedFalse(String manufacturerName);

    Optional<ManufacturerPart> findByPartIdAndManufacturerNameAndManufacturerPartNumberAndIsDeletedFalse(
            Long partId, String manufacturerName, String manufacturerPartNumber);
}
