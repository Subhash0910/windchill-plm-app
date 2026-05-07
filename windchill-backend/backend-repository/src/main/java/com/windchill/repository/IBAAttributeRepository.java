package com.windchill.repository;

import com.windchill.domain.entity.IBAAttribute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IBAAttributeRepository extends JpaRepository<IBAAttribute, Long> {
    List<IBAAttribute> findByPartIdAndIsDeletedFalseOrderByAttributeNameAsc(Long partId);
    boolean existsByPartIdAndAttributeNameAndIsDeletedFalse(Long partId, String attributeName);
}
