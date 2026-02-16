package com.windchill.change.api.dto;

import com.windchill.change.domain.ChangeNotice;
import com.windchill.change.domain.ChangeRequest;
import com.windchill.change.domain.ChangeTask;

import java.util.List;

public class ChangeRequestDetailsResponse {

    private ChangeRequest ecr;
    private List<ChangeTask> tasks;
    private ChangeNotice ecn;

    public ChangeRequestDetailsResponse() {
    }

    public ChangeRequestDetailsResponse(ChangeRequest ecr, List<ChangeTask> tasks, ChangeNotice ecn) {
        this.ecr = ecr;
        this.tasks = tasks;
        this.ecn = ecn;
    }

    public ChangeRequest getEcr() {
        return ecr;
    }

    public void setEcr(ChangeRequest ecr) {
        this.ecr = ecr;
    }

    public List<ChangeTask> getTasks() {
        return tasks;
    }

    public void setTasks(List<ChangeTask> tasks) {
        this.tasks = tasks;
    }

    public ChangeNotice getEcn() {
        return ecn;
    }

    public void setEcn(ChangeNotice ecn) {
        this.ecn = ecn;
    }
}
