package com.windchill.api.controller;

import com.windchill.common.response.ApiResponse;
import com.windchill.domain.entity.AlternatePart;
import com.windchill.repository.AlternatePartRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * AlternatePartController — REST API for alternate/substitute part management.
 *
 * Base path: /api/v1/plm/alternates
 */
@RestController
@RequestMapping("/api/v1/plm/alternates")
@RequiredArgsConstructor
public class AlternatePartController {

    private final AlternatePartRepository alternatePartRepository;

    /** GET /api/v1/plm/alternates/{partId} — list alternates for a part */
    @GetMapping("/{partId}")
    public ResponseEntity<ApiResponse<List<AlternatePart>>> listByPart(@PathVariable Long partId) {
        List<AlternatePart> alternates = alternatePartRepository
                .findByOriginalPartIdAndIsDeletedFalseOrderByPriorityAsc(partId);
        return ResponseEntity.ok(ApiResponse.success(alternates));
    }

    /** POST /api/v1/plm/alternates — create an alternate part relationship */
    @PostMapping
    public ResponseEntity<ApiResponse<AlternatePart>> create(@RequestBody AlternatePart alternatePart) {
        AlternatePart saved = alternatePartRepository.save(alternatePart);
        return ResponseEntity.ok(ApiResponse.success(saved));
    }

    /** DELETE /api/v1/plm/alternates/{id} — remove an alternate part relationship */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        alternatePartRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
