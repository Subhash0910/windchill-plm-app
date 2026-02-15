package com.windchill.service.plm;

import com.windchill.domain.entity.BomLine;

import java.math.BigDecimal;
import java.util.List;

public interface IBomService {
    BomLine addLine(Long parentPartId, Long childPartId, BigDecimal quantity, String unit, String findNumber, Integer sortOrder, String note);
    List<BomLine> listBom(Long parentPartId);
    void deleteLine(Long bomLineId);
}
