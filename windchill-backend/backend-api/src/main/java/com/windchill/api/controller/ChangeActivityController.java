package com.windchill.api.controller;

import com.windchill.common.dto.ApiResponse;
import com.windchill.common.exception.ResourceNotFoundException;
import com.windchill.domain.entity.ChangeActivity;
import com.windchill.repository.ChangeActivityRepository;
import com.windchill.repository.UserRepository;
import com.windchill.service.INotificationService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/plm/changes/eco/{ecoId}/activities")
@RequiredArgsConstructor
public class ChangeActivityController {

    private final ChangeActivityRepository repo;
    private final UserRepository userRepo;
    private final INotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<ChangeActivity>> list(@PathVariable Long ecoId) {
        return ResponseEntity.ok(repo.findByEcoIdOrderByCreatedAtAsc(ecoId));
    }

    @PostMapping
    public ResponseEntity<ChangeActivity> create(
            @PathVariable Long ecoId,
            @Valid @RequestBody CreateRequest req,
            @AuthenticationPrincipal UserDetails principal) {
        ChangeActivity a = new ChangeActivity();
        a.setEcoId(ecoId);
        a.setTitle(req.getTitle());
        a.setDescription(req.getDescription());
        a.setAssignee(req.getAssignee());
        a.setDueDate(req.getDueDate());
        a.setCreatedBy(principal.getUsername());
        ChangeActivity saved = repo.save(a);

        // Notify assignee (skip self-assign)
        if (saved.getAssignee() != null && !saved.getAssignee().equals(principal.getUsername())) {
            try {
                userRepo.findByUsername(saved.getAssignee()).ifPresent(u ->
                    notificationService.create(u.getId(),
                        "Task assigned: " + saved.getTitle(),
                        "You have a new task on ECO #" + ecoId
                            + (saved.getDueDate() != null ? " · due " + saved.getDueDate() : ""),
                        "TASK_ASSIGNED", "CHANGE_ACTIVITY", saved.getId(), saved.getTitle())
                );
            } catch (Exception ignored) { }
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ChangeActivity> updateStatus(
            @PathVariable Long ecoId,
            @PathVariable Long id,
            @RequestParam String status,
            @AuthenticationPrincipal UserDetails principal) {
        ChangeActivity a = repo.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Activity not found"));
        a.setStatus(status.toUpperCase());
        if ("DONE".equals(a.getStatus())) {
            a.setCompletedAt(LocalDateTime.now());
            a.setCompletedBy(principal.getUsername());
        }
        return ResponseEntity.ok(repo.save(a));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long ecoId, @PathVariable Long id) {
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @Data
    static class CreateRequest {
        @NotBlank @Size(max = 255)
        private String title;
        @Size(max = 2000)
        private String description;
        private String assignee;
        private LocalDate dueDate;
    }
}
