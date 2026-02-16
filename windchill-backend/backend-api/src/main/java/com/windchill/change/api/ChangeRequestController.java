package com.windchill.change.api;

import com.windchill.change.api.dto.ChangeRequestDetailsResponse;
import com.windchill.change.api.dto.CreateEcrRequest;
import com.windchill.change.api.dto.SubmitEcrRequest;
import com.windchill.change.domain.ChangeRequest;
import com.windchill.change.domain.ChangeRequestStatus;
import com.windchill.change.service.ChangeRequestService;
import com.windchill.change.service.CurrentUserProvider;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/changes/ecr")
public class ChangeRequestController {

    private final ChangeRequestService changeRequestService;
    private final CurrentUserProvider currentUserProvider;

    public ChangeRequestController(ChangeRequestService changeRequestService, CurrentUserProvider currentUserProvider) {
        this.changeRequestService = changeRequestService;
        this.currentUserProvider = currentUserProvider;
    }

    @PostMapping
    public ChangeRequest createDraft(@RequestBody CreateEcrRequest req) {
        String user = currentUserProvider.getCurrentUsername();
        return changeRequestService.createDraft(req.getTitle(), req.getDescription(), req.getContextType(), req.getContextId(), user);
    }

    @PostMapping("/{id}/submit")
    public ChangeRequest submit(@PathVariable("id") Long id, @RequestBody SubmitEcrRequest req) {
        String user = currentUserProvider.getCurrentUsername();
        return changeRequestService.submit(id, req.getReviewers(), user);
    }

    @GetMapping("/{id}")
    public ChangeRequest get(@PathVariable("id") Long id) {
        return changeRequestService.getById(id);
    }

    @GetMapping("/{id}/details")
    public ChangeRequestDetailsResponse details(@PathVariable("id") Long id) {
        ChangeRequestService.ChangeRequestDetails d = changeRequestService.getDetails(id);
        return new ChangeRequestDetailsResponse(d.getEcr(), d.getTasks(), d.getEcn());
    }

    @GetMapping
    public List<ChangeRequest> list(@RequestParam(value = "status", required = false) ChangeRequestStatus status) {
        return changeRequestService.list(status);
    }
}
