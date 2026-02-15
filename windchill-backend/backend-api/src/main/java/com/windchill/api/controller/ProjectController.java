package com.windchill.api.controller;

import com.windchill.common.constants.APIConstants;
import com.windchill.common.dto.ApiResponse;
import com.windchill.common.enums.StatusEnum;
import com.windchill.domain.entity.Project;
import com.windchill.service.project.IProjectService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(APIConstants.API_PROJECTS)
@RequiredArgsConstructor
@Slf4j
public class ProjectController {
    private final IProjectService projectService;

    @PostMapping
    public ResponseEntity<ApiResponse<?>> createProject(@RequestBody Project project) {
        log.info("Creating new project: {}", project.getProjectCode());
        Project createdProject = projectService.createProject(project);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.builder()
                        .success(true)
                        .message(APIConstants.CREATED)
                        .data(createdProject)
                        .build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> getProjectById(@PathVariable Long id) {
        log.info("Fetching project by id: {}", id);
        Project project = projectService.getProjectById(id);
        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message(APIConstants.SUCCESS)
                .data(project)
                .build());
    }

    @GetMapping
    public ResponseEntity<ApiResponse<?>> getAllProjects() {
        log.info("Fetching all projects");
        List<Project> projects = projectService.getAllProjects();
        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message(APIConstants.SUCCESS)
                .data(projects)
                .build());
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<ApiResponse<?>> getProjectByCode(@PathVariable String code) {
        log.info("Fetching project by code: {}", code);
        Project project = projectService.getProjectByCode(code);
        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message(APIConstants.SUCCESS)
                .data(project)
                .build());
    }

    @GetMapping("/manager/{managerId}")
    public ResponseEntity<ApiResponse<?>> getProjectsByManager(@PathVariable Long managerId) {
        log.info("Fetching projects for manager: {}", managerId);
        List<Project> projects = projectService.getProjectsByManager(managerId);
        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message(APIConstants.SUCCESS)
                .data(projects)
                .build());
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<?>> searchProjects(@RequestParam String keyword) {
        log.info("Searching projects with keyword: {}", keyword);
        List<Project> projects = projectService.searchProjects(keyword);
        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message(APIConstants.SUCCESS)
                .data(projects)
                .build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> updateProject(@PathVariable Long id, @RequestBody Project projectDetails) {
        log.info("Updating project: {}", id);
        Project updatedProject = projectService.updateProject(id, projectDetails);
        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message(APIConstants.UPDATED)
                .data(updatedProject)
                .build());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<?>> updateProjectStatus(@PathVariable Long id, @RequestParam StatusEnum status) {
        log.info("Updating project status: {} to {}", id, status);
        Project updatedProject = projectService.updateProjectStatus(id, status);
        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message(APIConstants.UPDATED)
                .data(updatedProject)
                .build());
    }

    @PutMapping("/{id}/progress")
    public ResponseEntity<ApiResponse<?>> updateProjectProgress(@PathVariable Long id, @RequestParam Integer progress) {
        log.info("Updating project progress: {} to {}%", id, progress);
        Project updatedProject = projectService.updateProjectProgress(id, progress);
        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message(APIConstants.UPDATED)
                .data(updatedProject)
                .build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> deleteProject(@PathVariable Long id) {
        log.info("Deleting project: {}", id);
        projectService.deleteProject(id);
        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message(APIConstants.DELETED)
                .data(null)
                .build());
    }
}
