package com.windchill.service.project;

import com.windchill.domain.entity.Project;
import com.windchill.common.enums.StatusEnum;

import java.util.List;

public interface IProjectService {
    Project createProject(Project project);
    
    Project getProjectById(Long id);
    
    Project getProjectByCode(String projectCode);
    
    List<Project> getAllProjects();
    
    List<Project> getProjectsByManager(Long managerId);
    
    List<Project> getProjectsByStatus(StatusEnum status);
    
    List<Project> searchProjects(String keyword);
    
    Project updateProject(Long id, Project projectDetails);
    
    void deleteProject(Long id);
    
    Project updateProjectStatus(Long id, StatusEnum status);
    
    Project updateProjectProgress(Long id, Integer progressPercentage);
}
