package com.windchill.api.change;

import java.util.List;

public interface ChangeOrderService {
    ChangeOrderDto create(ChangeOrderCreateRequest req, String currentUser);
    ChangeOrderDto getById(Long id);
    List<ChangeOrderDto> listByContext(Long contextId);
    List<ChangeOrderDto> listByEcr(Long ecrId);
    ChangeOrderDto promote(Long id, String targetState, String currentUser);
    ChangeOrderDto linkAiResult(Long id, Double riskScore, Double confidence, Double costEstimate);
    void delete(Long id, String currentUser);
}
