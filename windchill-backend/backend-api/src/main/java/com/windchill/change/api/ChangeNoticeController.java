package com.windchill.change.api;

import com.windchill.change.domain.ChangeNotice;
import com.windchill.change.repository.ChangeNoticeRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@RestController
@RequestMapping("/api/changes/ecn")
public class ChangeNoticeController {

    private final ChangeNoticeRepository changeNoticeRepository;

    public ChangeNoticeController(ChangeNoticeRepository changeNoticeRepository) {
        this.changeNoticeRepository = changeNoticeRepository;
    }

    @GetMapping("/{id}")
    public ChangeNotice get(@PathVariable("id") Long id) {
        return changeNoticeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "ECN not found"));
    }

    @GetMapping
    public ChangeNotice getByOriginEcr(@RequestParam("originEcrId") Long originEcrId) {
        return changeNoticeRepository.findByOriginEcrId(originEcrId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "ECN not found for origin ECR"));
    }
}
