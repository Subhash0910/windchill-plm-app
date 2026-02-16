package com.windchill.change.api;

import com.windchill.change.api.dto.DecideTaskRequest;
import com.windchill.change.domain.ChangeTask;
import com.windchill.change.service.ChangeTaskService;
import com.windchill.change.service.CurrentUserProvider;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;

@RestController
@RequestMapping("/api/changes/tasks")
public class ChangeTaskController {

    private final ChangeTaskService changeTaskService;
    private final CurrentUserProvider currentUserProvider;

    public ChangeTaskController(ChangeTaskService changeTaskService, CurrentUserProvider currentUserProvider) {
        this.changeTaskService = changeTaskService;
        this.currentUserProvider = currentUserProvider;
    }

    @GetMapping("/my")
    public List<ChangeTask> myTasks(@RequestParam(value = "pendingOnly", defaultValue = "true") boolean pendingOnly) {
        String user = currentUserProvider.getCurrentUsername();
        return changeTaskService.getMyTasks(user, pendingOnly);
    }

    @PostMapping("/{id}/approve")
    public ChangeTask approve(@PathVariable("id") Long id, @RequestBody DecideTaskRequest req) {
        String user = currentUserProvider.getCurrentUsername();
        return changeTaskService.approve(id, req.getComment(), user);
    }

    @PostMapping("/{id}/reject")
    public ChangeTask reject(@PathVariable("id") Long id, @RequestBody DecideTaskRequest req) {
        String user = currentUserProvider.getCurrentUsername();
        return changeTaskService.reject(id, req.getComment(), user);
    }
}
