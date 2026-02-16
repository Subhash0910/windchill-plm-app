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
@Table(name = "change_tasks")
public class ChangeTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "change_request_id")
    private Long changeRequestId;

    @Column(name = "change_notice_id")
    private Long changeNoticeId;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private ChangeTaskType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "decision", nullable = false)
    private ChangeTaskDecision decision = ChangeTaskDecision.PENDING;

    @Column(name = "assignee", nullable = false)
    private String assignee;

    @Column(name = "comment", columnDefinition = "text")
    private String comment;

    @Column(name = "decided_by")
    private String decidedBy;

    @Column(name = "decided_at")
    private Instant decidedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public Long getId() {
        return id;
    }

    public Long getChangeRequestId() {
        return changeRequestId;
    }

    public void setChangeRequestId(Long changeRequestId) {
        this.changeRequestId = changeRequestId;
    }

    public Long getChangeNoticeId() {
        return changeNoticeId;
    }

    public void setChangeNoticeId(Long changeNoticeId) {
        this.changeNoticeId = changeNoticeId;
    }

    public ChangeTaskType getType() {
        return type;
    }

    public void setType(ChangeTaskType type) {
        this.type = type;
    }

    public ChangeTaskDecision getDecision() {
        return decision;
    }

    public void setDecision(ChangeTaskDecision decision) {
        this.decision = decision;
    }

    public String getAssignee() {
        return assignee;
    }

    public void setAssignee(String assignee) {
        this.assignee = assignee;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public String getDecidedBy() {
        return decidedBy;
    }

    public Instant getDecidedAt() {
        return decidedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void markApproved(String decidedBy, String comment) {
        this.decision = ChangeTaskDecision.APPROVED;
        this.decidedBy = decidedBy;
        this.comment = comment;
        this.decidedAt = Instant.now();
    }

    public void markRejected(String decidedBy, String comment) {
        this.decision = ChangeTaskDecision.REJECTED;
        this.decidedBy = decidedBy;
        this.comment = comment;
        this.decidedAt = Instant.now();
    }
}
