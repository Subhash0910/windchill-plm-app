package com.windchill.service.plm;

import com.windchill.domain.entity.PlmContext;

import java.util.List;

public interface IPlmContextService {
    PlmContext createContext(PlmContext context);
    PlmContext getContext(Long id);
    List<PlmContext> listContexts();
}
