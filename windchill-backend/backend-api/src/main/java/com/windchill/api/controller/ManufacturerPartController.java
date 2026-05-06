package com.windchill.api.controller;

import com.windchill.common.response.ApiResponse;
import com.windchill.domain.entity.ManufacturerPart;
import com.windchill.repository.ManufacturerPartRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * ManufacturerPartController — REST API for managing manufacturer parts (AML).
 *
 * Base path: /api/v1/plm/manufacturers
 */
@RestController
@RequestMapping("/api/v1/plm/manufacturers")
@RequiredArgsConstructor
public class ManufacturerPartController {

    private final ManufacturerPartRepository manufacturerPartRepository;

    /** GET /api/v1/plm/manufacturers/{partId} — list manufacturer parts for a given part */
    @GetMapping("/{partId}")
    public ResponseEntity<ApiResponse<List<ManufacturerPart>>> listByPart(@PathVariable Long partId) {
        List<ManufacturerPart> mfgs = manufacturerPartRepository
                .findByPartIdAndIsDeletedFalseOrderByManufacturerNameAsc(partId);
        return ResponseEntity.ok(ApiResponse.success(mfgs));
    }

    /** POST /api/v1/plm/manufacturers — add a manufacturer part */
    @PostMapping
    public ResponseEntity<ApiResponse<ManufacturerPart>> create(@RequestBody ManufacturerPart manufacturerPart) {
        ManufacturerPart saved = manufacturerPartRepository.save(manufacturerPart);
        return ResponseEntity.ok(ApiResponse.success(saved));
    }

    /** DELETE /api/v1/plm/manufacturers/{id} — remove a manufacturer part */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        manufacturerPartRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    /** PUT /api/v1/plm/manufacturers/{id}/preferred — toggle preferred status */
    @PutMapping("/{id}/preferred")
    public ResponseEntity<ApiResponse<ManufacturerPart>> togglePreferred(@PathVariable Long id) {
        ManufacturerPart mp = manufacturerPartRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("ManufacturerPart not found: " + id));
        mp.setIsPreferred(!mp.getIsPreferred());
        ManufacturerPart saved = manufacturerPartRepository.save(mp);
        return ResponseEntity.ok(ApiResponse.success(saved));
    }
}
