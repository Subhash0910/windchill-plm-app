package com.windchill.api.controller;

import com.windchill.api.dto.ContextMemberCreateRequest;
import com.windchill.api.dto.ContextMemberRoleUpdateRequest;
import com.windchill.common.constants.APIConstants;
import com.windchill.common.dto.ApiResponse;
import com.windchill.common.dto.ContextMemberView;
import com.windchill.domain.entity.PlmContext;
import com.windchill.service.plm.IPlmContextService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/plm/contexts")
@RequiredArgsConstructor
@Slf4j
public class PlmContextController {

    private final IPlmContextService contextService;

    @PostMapping
    public ResponseEntity<ApiResponse<?>> create(@RequestBody PlmContext context) {
        PlmContext created = contextService.createContext(context);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.builder().success(true).message(APIConstants.CREATED).data(created).build());
    }

    @GetMapping
    public ResponseEntity<ApiResponse<?>> list() {
        List<PlmContext> contexts = contextService.listContexts();
        return ResponseEntity.ok(ApiResponse.builder().success(true).message(APIConstants.SUCCESS).data(contexts).build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> get(@PathVariable Long id) {
        PlmContext ctx = contextService.getContext(id);
        return ResponseEntity.ok(ApiResponse.builder().success(true).message(APIConstants.SUCCESS).data(ctx).build());
    }

    // ----------------------
    // Context Team / Members
    // ----------------------

    @GetMapping("/{id}/members")
    public ResponseEntity<ApiResponse<?>> listMembers(@PathVariable Long id) {
        List<ContextMemberView> members = contextService.listMembers(id);
        return ResponseEntity.ok(ApiResponse.builder().success(true).message(APIConstants.SUCCESS).data(members).build());
    }

    @PostMapping("/{id}/members")
    public ResponseEntity<ApiResponse<?>> addMember(@PathVariable Long id, @Valid @RequestBody ContextMemberCreateRequest req) {
        ContextMemberView member = contextService.addMember(id, req.getUser(), req.getRole());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.builder().success(true).message(APIConstants.CREATED).data(member).build());
    }

    @PatchMapping("/{id}/members/{userId}")
    public ResponseEntity<ApiResponse<?>> updateMemberRole(
            @PathVariable Long id,
            @PathVariable Long userId,
            @Valid @RequestBody ContextMemberRoleUpdateRequest req) {
        ContextMemberView updated = contextService.updateMemberRole(id, userId, req.getRole());
        return ResponseEntity.ok(ApiResponse.builder().success(true).message(APIConstants.UPDATED).data(updated).build());
    }

    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<ApiResponse<?>> removeMember(@PathVariable Long id, @PathVariable Long userId) {
        contextService.removeMember(id, userId);
        return ResponseEntity.ok(ApiResponse.builder().success(true).message(APIConstants.DELETED).data(true).build());
    }
}
