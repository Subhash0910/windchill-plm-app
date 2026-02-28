package com.windchill.change.impact.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "impact_route_decisions")
public class ImpactRouteDecision {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "report_id", nullable = false)
    private Long reportId;

    @Column(name = "ecr_id", nullable = false)
    private Long ecrId;

    @Column(name = "risk_level", nullable = false, length = 20)
    private String riskLevel;

    @Column(name = "requested_reviewers_csv", columnDefinition = "text")
    private String requestedReviewersCsv;

    @Column(name = "added_reviewers_csv", columnDefinition = "text")
    private String addedReviewersCsv;

    @Column(name = "applied_rules_json", columnDefinition = "text")
    private String appliedRulesJson;

    @Column(name = "explanation", columnDefinition = "text")
    private String explanation;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public Long getId() {
        return id;
    }

    public Long getReportId() {
        return reportId;
    }

    public void setReportId(Long reportId) {
        this.reportId = reportId;
    }

    public Long getEcrId() {
        return ecrId;
    }

    public void setEcrId(Long ecrId) {
        this.ecrId = ecrId;
    }

    public String getRiskLevel() {
        return riskLevel;
    }

    public void setRiskLevel(String riskLevel) {
        this.riskLevel = riskLevel;
    }

    public String getRequestedReviewersCsv() {
        return requestedReviewersCsv;
    }

    public void setRequestedReviewersCsv(String requestedReviewersCsv) {
        this.requestedReviewersCsv = requestedReviewersCsv;
    }

    public String getAddedReviewersCsv() {
        return addedReviewersCsv;
    }

    public void setAddedReviewersCsv(String addedReviewersCsv) {
        this.addedReviewersCsv = addedReviewersCsv;
    }

    public String getAppliedRulesJson() {
        return appliedRulesJson;
    }

    public void setAppliedRulesJson(String appliedRulesJson) {
        this.appliedRulesJson = appliedRulesJson;
    }

    public String getExplanation() {
        return explanation;
    }

    public void setExplanation(String explanation) {
        this.explanation = explanation;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
