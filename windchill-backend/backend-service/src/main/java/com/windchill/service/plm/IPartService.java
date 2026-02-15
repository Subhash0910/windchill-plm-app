package com.windchill.service.plm;

import com.windchill.common.enums.LifecycleStateEnum;
import com.windchill.domain.entity.Part;

import java.util.List;

public interface IPartService {
    Part createPart(Part part);
    Part getPart(Long id);
    List<Part> listParts(Long contextId);
    Part updatePart(Long id, Part details);
    Part promote(Long id, LifecycleStateEnum target);
    Part revise(Long id);

    List<Part> whereUsed(Long partId);
}
