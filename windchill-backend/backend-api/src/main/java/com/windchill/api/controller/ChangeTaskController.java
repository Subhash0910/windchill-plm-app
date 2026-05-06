package com.windchill.api.controller;

import com.windchill.common.dto.ApiResponse;
import com.windchill.domain.entity.ChangeTask;
import com.windchill.repository.ChangeTaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/plm/change-tasks")
@RequiredArgsConstructor
public class ChangeTaskController {

    private final ChangeTaskRepository repo;

    @GetMapping("/by-order/{changeOrderId}")
    public ResponseEntity<ApiResponse> getByOrder(@PathVariable Long changeOrderId) {
        List<ChangeTask> tasks = repo.findByChangeOrderIdAndIsDeletedFalseOrderByCreatedAtAsc(changeOrderId);
        long total = repo.countByChangeOrderIdAndIsDeletedFalse(changeOrderId);
        long completed = repo.countByChangeOrderIdAndStatusAndIsDeletedFalse(changeOrderId, ChangeTask.TaskStatus.COMPLETED);
        return ResponseEntity.ok(ApiResponse.success(Map.of("tasks", tasks, "total", total, "completed", completed)));
    }

    @GetMapping("/my-tasks")
    public ResponseEntity<ApiResponse> getMyTasks(@RequestParam Long assigneeUserId) {
        return ResponseEntity.ok(ApiResponse.success(repo.findByAssigneeUserIdAndIsDeletedFalseOrderByDueDateAsc(assigneeUserId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse> create(@RequestBody ChangeTask task) {
        task.setTaskNumber("CT-" + String.format("%04d", repo.count() + 1));
        task.setStatus(ChangeTask.TaskStatus.PENDING);
        return ResponseEntity.ok(ApiResponse.success(repo.save(task)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse> update(@PathVariable Long id, @RequestBody Map<String, Object> updates) {
        ChangeTask t = repo.findById(id).orElseThrow();
        if (updates.containsKey("title")) t.setTitle((String) updates.get("title"));
        if (updates.containsKey("description")) t.setDescription((String) updates.get("description"));
        if (updates.containsKey("assigneeUserId")) t.setAssigneeUserId(((Number) updates.get("assigneeUserId")).longValue());
        if (updates.containsKey("dueDate")) t.setDueDate(java.time.LocalDate.parse((String) updates.get("dueDate")));
        if (updates.containsKey("priority")) t.setPriority(ChangeTask.TaskPriority.valueOf((String) updates.get("priority")));
        if (updates.containsKey("estimatedHours")) t.setEstimatedHours(((Number) updates.get("estimatedHours")).doubleValue());
        if (updates.containsKey("affectedPartId")) t.setAffectedPartId(((Number) updates.get("affectedPartId")).longValue());
        return ResponseEntity.ok(ApiResponse.success(repo.save(t)));
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<ApiResponse> start(@PathVariable Long id) {
        ChangeTask t = repo.findById(id).orElseThrow();
        t.setStatus(ChangeTask.TaskStatus.IN_PROGRESS);
        return ResponseEntity.ok(ApiResponse.success(repo.save(t)));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<ApiResponse> complete(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        ChangeTask t = repo.findById(id).orElseThrow();
        t.setStatus(ChangeTask.TaskStatus.COMPLETED);
        t.setCompletedAt(LocalDateTime.now());
        if (body.containsKey("comment")) t.setComment((String) body.get("comment"));
        if (body.containsKey("actualHours")) t.setActualHours(((Number) body.get("actualHours")).doubleValue());
        if (body.containsKey("completedBy")) t.setCompletedBy((String) body.get("completedBy"));
        return ResponseEntity.ok(ApiResponse.success(repo.save(t)));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse> cancel(@PathVariable Long id) {
        ChangeTask t = repo.findById(id).orElseThrow();
        t.setStatus(ChangeTask.TaskStatus.CANCELLED);
        return ResponseEntity.ok(ApiResponse.success(repo.save(t)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> delete(@PathVariable Long id) {
        ChangeTask t = repo.findById(id).orElseThrow();
        t.setIsDeleted(true);
        return ResponseEntity.ok(ApiResponse.success(repo.save(t)));
    }
}
