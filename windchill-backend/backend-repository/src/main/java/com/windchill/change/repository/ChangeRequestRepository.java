package com.windchill.change.repository;

import com.windchill.change.domain.ChangeRequest;
import com.windchill.change.domain.ChangeRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChangeRequestRepository extends JpaRepository<ChangeRequest, Long> {
    List<ChangeRequest> findByStatusOrderByIdDesc(ChangeRequestStatus status);
    List<ChangeRequest> findAllByOrderByIdDesc();
    Optional<ChangeRequest> findByNumber(String number);

    List<ChangeRequest> findTop50ByContextTypeIgnoreCaseAndContextIdAndIdNotOrderByIdDesc(String contextType, String contextId, Long id);

    List<ChangeRequest> findTop50ByTitleContainingIgnoreCaseAndIdNotOrderByIdDesc(String title, Long id);
}
