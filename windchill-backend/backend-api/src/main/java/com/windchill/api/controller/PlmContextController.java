package com.windchill.api.controller;

import com.windchill.common.constants.APIConstants;
import com.windchill.common.dto.ApiResponse;
import com.windchill.domain.entity.PlmContext;
import com.windchill.service.plm.IPlmContextService;
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
}
