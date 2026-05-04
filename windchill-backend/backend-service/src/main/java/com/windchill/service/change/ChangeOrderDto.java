package com.windchill.service.change;

import com.windchill.domain.entity.ChangeOrder;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @Builder
public class ChangeOrderDto {
    private Long id;
    private String ecoNumber;
    private String title;
    private String description;
    private String state;
    private String priority;
    private Long contextId;
    private Long ecrId;
    private String assignedTo;
    private LocalDate dueDate;
    private Double aiRiskScore;
    private Double aiConfidence;
    private Double aiCostEstimate;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ChangeOrderDto from(ChangeOrder e) {
        return ChangeOrderDto.builder()
            .id(e.getId())
            .ecoNumber(e.getEcoNumber())
            .title(e.getTitle())
            .description(e.getDescription())
            .state(e.getState().name())
            .priority(e.getPriority().name())
            .contextId(e.getContextId())
            .ecrId(e.getEcrId())
            .assignedTo(e.getAssignedTo())
            .dueDate(e.getDueDate())
            .aiRiskScore(e.getAiRiskScore())
            .aiConfidence(e.getAiConfidence())
            .aiCostEstimate(e.getAiCostEstimate())
            .createdBy(e.getCreatedBy())
            .createdAt(e.getCreatedAt())
            .updatedAt(e.getUpdatedAt())
            .build();
    }
}
