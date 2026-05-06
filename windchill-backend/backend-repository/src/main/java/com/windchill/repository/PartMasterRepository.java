package com.windchill.repository;

import com.windchill.domain.entity.PartMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface PartMasterRepository extends JpaRepository<PartMaster, Long> {
    Optional<PartMaster> findByPartNumber(String partNumber);
    boolean existsByPartNumber(String partNumber);
}
