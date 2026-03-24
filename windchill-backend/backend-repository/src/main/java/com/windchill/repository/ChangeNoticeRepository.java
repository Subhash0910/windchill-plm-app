package com.windchill.repository;

import com.windchill.common.enums.ChangeNoticeStatus;
import com.windchill.domain.entity.ChangeNotice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChangeNoticeRepository extends JpaRepository<ChangeNotice, Long> {

    List<ChangeNotice> findByContextIdOrderByCreatedAtDesc(Long contextId);

    List<ChangeNotice> findByStatusOrderByCreatedAtDesc(ChangeNoticeStatus status);

    Optional<ChangeNotice> findByChangeRequestId(Long changeRequestId);

    Optional<ChangeNotice> findByNoticeNumber(String noticeNumber);

    List<ChangeNotice> findByContextIdAndStatusOrderByCreatedAtDesc(Long contextId, ChangeNoticeStatus status);
}
