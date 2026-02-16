package com.windchill.change.api.dto;

import java.util.List;

public class SubmitEcrRequest {
    private List<String> reviewers;

    public List<String> getReviewers() {
        return reviewers;
    }

    public void setReviewers(List<String> reviewers) {
        this.reviewers = reviewers;
    }
}
