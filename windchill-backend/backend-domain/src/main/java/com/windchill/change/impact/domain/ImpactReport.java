package com.windchill.change.impact.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "impact_reports")
public class ImpactReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ecr_id", nullable = false)
    private Long ecrId;

    @Column(name = "root_object_type", nullable = false, length = 50)
    private String rootObjectType;

    @Column(name = "root_object_id", nullable = false, length = 64)
    private String rootObjectId;

    @Column(name = "score", nullable = false)
    private Integer score;

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level", nullable = false, length = 20)
    private ImpactRiskLevel riskLevel;

    @Column(name = "factors_json", columnDefinition = "text")
    private String factorsJson;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public Long getId() {
        return id;
    }

    public Long getEcrId() {
        return ecrId;
    }

    public void setEcrId(Long ecrId) {
        this.ecrId = ecrId;
    }

    public String getRootObjectType() {
        return rootObjectType;
    }

    public void setRootObjectType(String rootObjectType) {
        this.rootObjectType = rootObjectType;
    }

    public String getRootObjectId() {
        return rootObjectId;
    }

    public void setRootObjectId(String rootObjectId) {
        this.rootObjectId = rootObjectId;
    }

    public Integer getScore() {
        return score;
    }

    public void setScore(Integer score) {
        this.score = score;
    }

    public ImpactRiskLevel getRiskLevel() {
        return riskLevel;
    }

    public void setRiskLevel(ImpactRiskLevel riskLevel) {
        this.riskLevel = riskLevel;
    }

    public String getFactorsJson() {
        return factorsJson;
    }

    public void setFactorsJson(String factorsJson) {
        this.factorsJson = factorsJson;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
