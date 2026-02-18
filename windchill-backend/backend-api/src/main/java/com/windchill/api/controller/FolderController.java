package com.windchill.api.controller;

import com.windchill.common.constants.APIConstants;
import com.windchill.common.dto.ApiResponse;
import com.windchill.domain.entity.Folder;
import com.windchill.service.plm.IFolderService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/plm/contexts/{contextId}/folders")
@RequiredArgsConstructor
@Slf4j
public class FolderController {

    private final IFolderService folderService;

    @PostMapping
    public ResponseEntity<ApiResponse<?>> create(
            @PathVariable Long contextId,
            @RequestBody CreateFolderRequest req
    ) {
        Folder created = folderService.createFolder(contextId, req.getParentId(), req.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.builder().success(true).message(APIConstants.CREATED).data(created).build());
    }

    @GetMapping
    public ResponseEntity<ApiResponse<?>> list(@PathVariable Long contextId) {
        List<Folder> folders = folderService.listFolders(contextId);
        return ResponseEntity.ok(ApiResponse.builder().success(true).message(APIConstants.SUCCESS).data(folders).build());
    }

    @DeleteMapping("/{folderId}")
    public ResponseEntity<ApiResponse<?>> delete(
            @PathVariable Long contextId,
            @PathVariable Long folderId
    ) {
        folderService.deleteFolder(contextId, folderId);
        return ResponseEntity.ok(ApiResponse.builder().success(true).message("Folder deleted successfully").data(null).build());
    }

    @Data
    public static class CreateFolderRequest {
        private Long parentId;
        private String name;
    }
}
