package com.windchill.change.domain;

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
@Table(name = "change_notices")
public class ChangeNotice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "number", unique = true)
    private String number;

    @Column(name = "origin_ecr_id", nullable = false, unique = true)
    private Long originEcrId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ChangeNoticeStatus status = ChangeNoticeStatus.DRAFT;

    @Column(name = "created_by", nullable = false)
    private String createdBy;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public Long getId() {
        return id;
    }

    public String getNumber() {
        return number;
    }

    public void setNumber(String number) {
        this.number = number;
    }

    public Long getOriginEcrId() {
        return originEcrId;
    }

    public void setOriginEcrId(Long originEcrId) {
        this.originEcrId = originEcrId;
    }

    public ChangeNoticeStatus getStatus() {
        return status;
    }

    public void setStatus(ChangeNoticeStatus status) {
        this.status = status;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
