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
    public ResponseEntity<ApiResponse<Project>> createProject(@RequestBody Project project) {
        log.info("Creating new project: {}", project.getProjectCode());
        Project createdProject = projectService.createProject(project);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(APIConstants.CREATED, createdProject, true));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Project>> getProjectById(@PathVariable Long id) {
        log.info("Fetching project by id: {}", id);
        Project project = projectService.getProjectById(id);
        return ResponseEntity.ok(new ApiResponse<>(APIConstants.SUCCESS, project, true));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Project>>> getAllProjects() {
        log.info("Fetching all projects");
        List<Project> projects = projectService.getAllProjects();
        return ResponseEntity.ok(new ApiResponse<>(APIConstants.SUCCESS, projects, true));
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<ApiResponse<Project>> getProjectByCode(@PathVariable String code) {
        log.info("Fetching project by code: {}", code);
        Project project = projectService.getProjectByCode(code);
        return ResponseEntity.ok(new ApiResponse<>(APIConstants.SUCCESS, project, true));
    }

    @GetMapping("/manager/{managerId}")
    public ResponseEntity<ApiResponse<List<Project>>> getProjectsByManager(@PathVariable Long managerId) {
        log.info("Fetching projects for manager: {}", managerId);
        List<Project> projects = projectService.getProjectsByManager(managerId);
        return ResponseEntity.ok(new ApiResponse<>(APIConstants.SUCCESS, projects, true));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<Project>>> searchProjects(@RequestParam String keyword) {
        log.info("Searching projects with keyword: {}", keyword);
        List<Project> projects = projectService.searchProjects(keyword);
        return ResponseEntity.ok(new ApiResponse<>(APIConstants.SUCCESS, projects, true));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Project>> updateProject(@PathVariable Long id, @RequestBody Project projectDetails) {
        log.info("Updating project: {}", id);
        Project updatedProject = projectService.updateProject(id, projectDetails);
        return ResponseEntity.ok(new ApiResponse<>(APIConstants.UPDATED, updatedProject, true));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Project>> updateProjectStatus(@PathVariable Long id, @RequestParam StatusEnum status) {
        log.info("Updating project status: {} to {}", id, status);
        Project updatedProject = projectService.updateProjectStatus(id, status);
        return ResponseEntity.ok(new ApiResponse<>(APIConstants.UPDATED, updatedProject, true));
    }

    @PutMapping("/{id}/progress")
    public ResponseEntity<ApiResponse<Project>> updateProjectProgress(@PathVariable Long id, @RequestParam Integer progress) {
        log.info("Updating project progress: {} to {}%", id, progress);
        Project updatedProject = projectService.updateProjectProgress(id, progress);
        return ResponseEntity.ok(new ApiResponse<>(APIConstants.UPDATED, updatedProject, true));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProject(@PathVariable Long id) {
        log.info("Deleting project: {}", id);
        projectService.deleteProject(id);
        return ResponseEntity.ok(new ApiResponse<>(APIConstants.DELETED, null, true));
    }
}
