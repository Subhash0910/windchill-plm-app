package com.windchill.change.repository;

import com.windchill.change.domain.ChangeNotice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ChangeNoticeRepository extends JpaRepository<ChangeNotice, Long> {
    Optional<ChangeNotice> findByOriginEcrId(Long originEcrId);
}
