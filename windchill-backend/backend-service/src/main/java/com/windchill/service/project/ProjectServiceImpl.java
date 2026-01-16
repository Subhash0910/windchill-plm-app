package com.windchill.service.project;

import com.windchill.common.exceptions.BusinessException;
import com.windchill.common.exceptions.ResourceNotFoundException;
import com.windchill.common.enums.StatusEnum;
import com.windchill.domain.entity.Project;
import com.windchill.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ProjectServiceImpl implements IProjectService {
    private final ProjectRepository projectRepository;

    @Override
    public Project createProject(Project project) {
        log.info("Creating new project: {}", project.getProjectCode());

        if (project.getProjectCode() == null || project.getProjectCode().isEmpty()) {
            throw new BusinessException("Project code cannot be empty");
        }

        Project existingProject = projectRepository.findByProjectCode(project.getProjectCode()).orElse(null);
        if (existingProject != null && !existingProject.getIsDeleted()) {
            throw new BusinessException("Project code already exists: " + project.getProjectCode());
        }

        project.setIsDeleted(false);
        Project savedProject = projectRepository.save(project);
        log.info("Project created successfully: {}", project.getProjectCode());
        return savedProject;
    }

    @Override
    @Transactional(readOnly = true)
    public Project getProjectById(Long id) {
        log.debug("Fetching project by id: {}", id);
        return projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", id));
    }

    @Override
    @Transactional(readOnly = true)
    public Project getProjectByCode(String projectCode) {
        log.debug("Fetching project by code: {}", projectCode);
        return projectRepository.findByProjectCode(projectCode)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "code", projectCode));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Project> getAllProjects() {
        log.debug("Fetching all projects");
        return projectRepository.findAllActive();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Project> getProjectsByManager(Long managerId) {
        log.debug("Fetching projects for manager: {}", managerId);
        return projectRepository.findByManagerIdAndIsDeletedFalse(managerId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Project> getProjectsByStatus(StatusEnum status) {
        log.debug("Fetching projects by status: {}", status);
        return projectRepository.findByStatusAndIsDeletedFalse(status);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Project> searchProjects(String keyword) {
        log.debug("Searching projects with keyword: {}", keyword);
        return projectRepository.findByProjectNameContaining(keyword);
    }

    @Override
    public Project updateProject(Long id, Project projectDetails) {
        log.info("Updating project: {}", id);
        Project project = getProjectById(id);

        if (projectDetails.getProjectName() != null) {
            project.setProjectName(projectDetails.getProjectName());
        }
        if (projectDetails.getDescription() != null) {
            project.setDescription(projectDetails.getDescription());
        }
        if (projectDetails.getManagerId() != null) {
            project.setManagerId(projectDetails.getManagerId());
        }
        if (projectDetails.getBudget() != null) {
            project.setBudget(projectDetails.getBudget());
        }
        if (projectDetails.getPriority() != null) {
            project.setPriority(projectDetails.getPriority());
        }

        Project updatedProject = projectRepository.save(project);
        log.info("Project updated successfully: {}", id);
        return updatedProject;
    }

    @Override
    public void deleteProject(Long id) {
        log.info("Deleting project: {}", id);
        Project project = getProjectById(id);
        project.setIsDeleted(true);
        projectRepository.save(project);
        log.info("Project deleted successfully: {}", id);
    }

    @Override
    public Project updateProjectStatus(Long id, StatusEnum status) {
        log.info("Updating project status: {} to {}", id, status);
        Project project = getProjectById(id);
        project.setStatus(status);
        return projectRepository.save(project);
    }

    @Override
    public Project updateProjectProgress(Long id, Integer progressPercentage) {
        log.info("Updating project progress: {} to {}%", id, progressPercentage);
        Project project = getProjectById(id);
        if (progressPercentage < 0 || progressPercentage > 100) {
            throw new BusinessException("Progress percentage must be between 0 and 100");
        }
        project.setProgressPercentage(progressPercentage);
        return projectRepository.save(project);
    }
}
