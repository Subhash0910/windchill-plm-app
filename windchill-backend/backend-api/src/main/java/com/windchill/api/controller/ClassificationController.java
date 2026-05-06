package com.windchill.api.controller;

import com.windchill.common.constants.APIConstants;
import com.windchill.common.dto.ApiResponse;
import com.windchill.common.exceptions.BusinessException;
import com.windchill.common.exceptions.ResourceNotFoundException;
import com.windchill.domain.entity.ClassificationAttribute;
import com.windchill.domain.entity.ClassificationNode;
import com.windchill.domain.entity.PartClassification;
import com.windchill.repository.ClassificationAttributeRepository;
import com.windchill.repository.ClassificationNodeRepository;
import com.windchill.repository.PartClassificationRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/plm/classifications")
@RequiredArgsConstructor
@Transactional
public class ClassificationController {

    private final ClassificationNodeRepository nodeRepository;
    private final ClassificationAttributeRepository attributeRepository;
    private final PartClassificationRepository partClassificationRepository;

    // ─── GET /tree ─────────────────────────────────────────────────────────────

    @GetMapping("/tree")
    public ResponseEntity<ApiResponse<?>> tree() {
        List<ClassificationNode> roots = nodeRepository
                .findByParentIdAndIsDeletedFalseOrderBySortOrderAscNameAsc(null);
        List<TreeNode> tree = roots.stream()
                .map(this::toTreeNode)
                .collect(Collectors.toList());
        return ok(tree);
    }

    // ─── GET /{nodeId}/attributes ──────────────────────────────────────────────

    @GetMapping("/{nodeId}/attributes")
    public ResponseEntity<ApiResponse<?>> attributes(@PathVariable Long nodeId) {
        nodeRepository.findById(nodeId)
                .orElseThrow(() -> new ResourceNotFoundException("ClassificationNode not found: " + nodeId));
        List<ClassificationAttribute> attrs = attributeRepository
                .findByNodeIdAndIsDeletedFalseOrderBySortOrderAsc(nodeId);
        return ok(attrs);
    }

    // ─── GET /{nodeId}/children ────────────────────────────────────────────────

    @GetMapping("/{nodeId}/children")
    public ResponseEntity<ApiResponse<?>> children(@PathVariable Long nodeId) {
        nodeRepository.findById(nodeId)
                .orElseThrow(() -> new ResourceNotFoundException("ClassificationNode not found: " + nodeId));
        List<ClassificationNode> children = nodeRepository
                .findByParentIdAndIsDeletedFalseOrderBySortOrderAscNameAsc(nodeId);
        return ok(children);
    }

    // ─── POST / ────────────────────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<ApiResponse<?>> createNode(@RequestBody ClassificationNode node) {
        if (node.getName() == null || node.getName().isBlank()) {
            throw new BusinessException("Classification node name is required");
        }
        if (node.getNodeType() == null) {
            node.setNodeType("FOLDER");
        }

        // Build path from parent
        if (node.getParentId() != null) {
            ClassificationNode parent = nodeRepository.findById(node.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent node not found: " + node.getParentId()));
            node.setPath(parent.getPath() + "/" + node.getName());
        } else {
            node.setPath("/" + node.getName());
        }

        ClassificationNode saved = nodeRepository.save(node);
        return ok(saved, APIConstants.CREATED);
    }

    // ─── POST /{nodeId}/attributes ─────────────────────────────────────────────

    @PostMapping("/{nodeId}/attributes")
    public ResponseEntity<ApiResponse<?>> addAttribute(@PathVariable Long nodeId,
                                                        @RequestBody ClassificationAttribute attr) {
        nodeRepository.findById(nodeId)
                .orElseThrow(() -> new ResourceNotFoundException("ClassificationNode not found: " + nodeId));
        attr.setNodeId(nodeId);
        if (attr.getAttrType() == null) {
            attr.setAttrType("STRING");
        }
        if (attr.getRequired() == null) {
            attr.setRequired(false);
        }
        ClassificationAttribute saved = attributeRepository.save(attr);
        return ok(saved, APIConstants.CREATED);
    }

    // ─── POST /assign ──────────────────────────────────────────────────────────

    @PostMapping("/assign")
    public ResponseEntity<ApiResponse<?>> assign(@RequestBody AssignRequest req) {
        if (req.getPartId() == null || req.getNodeId() == null) {
            throw new BusinessException("partId and nodeId are required");
        }
        // Verify node exists
        nodeRepository.findById(req.getNodeId())
                .orElseThrow(() -> new ResourceNotFoundException("ClassificationNode not found: " + req.getNodeId()));

        // Remove existing classifications for this part+node
        List<PartClassification> existing = partClassificationRepository
                .findByPartIdAndNodeIdAndIsDeletedFalse(req.getPartId(), req.getNodeId());
        for (PartClassification pc : existing) {
            pc.setIsDeleted(true);
        }
        partClassificationRepository.saveAll(existing);

        // Save new values
        List<PartClassification> saved = new ArrayList<>();
        if (req.getValues() != null) {
            for (AssignRequest.AttrValue av : req.getValues()) {
                PartClassification pc = new PartClassification();
                pc.setPartId(req.getPartId());
                pc.setNodeId(req.getNodeId());
                pc.setAttrName(av.getAttrName());
                pc.setAttrValue(av.getAttrValue());
                saved.add(partClassificationRepository.save(pc));
            }
        }
        return ok(saved, APIConstants.CREATED);
    }

    // ─── GET /parts/{partId} ───────────────────────────────────────────────────

    @GetMapping("/parts/{partId}")
    public ResponseEntity<ApiResponse<?>> partClassifications(@PathVariable Long partId) {
        List<PartClassification> classifications = partClassificationRepository
                .findByPartIdAndIsDeletedFalse(partId);

        // Group by nodeId for structured output
        Map<Long, List<PartClassification>> byNode = classifications.stream()
                .collect(Collectors.groupingBy(PartClassification::getNodeId));

        List<PartClassView> views = byNode.entrySet().stream().map(entry -> {
            ClassificationNode node = nodeRepository.findById(entry.getKey()).orElse(null);
            List<PartClassView.AttrEntry> attrs = entry.getValue().stream()
                    .map(pc -> new PartClassView.AttrEntry(pc.getAttrName(), pc.getAttrValue()))
                    .collect(Collectors.toList());
            return new PartClassView(
                    node != null ? node.getId() : entry.getKey(),
                    node != null ? node.getName() : null,
                    node != null ? node.getPath() : null,
                    attrs
            );
        }).collect(Collectors.toList());

        return ok(views);
    }

    // ─── Helper DTOs ───────────────────────────────────────────────────────────

    @Data
    public static class TreeNode {
        private Long id;
        private String name;
        private String description;
        private String path;
        private String nodeType;
        private Integer sortOrder;
        private String icon;
        private List<TreeNode> children;

        public TreeNode(ClassificationNode node) {
            this.id = node.getId();
            this.name = node.getName();
            this.description = node.getDescription();
            this.path = node.getPath();
            this.nodeType = node.getNodeType();
            this.sortOrder = node.getSortOrder();
            this.icon = node.getIcon();
            this.children = new ArrayList<>();
        }
    }

    @Data
    public static class AssignRequest {
        private Long partId;
        private Long nodeId;
        private List<AttrValue> values;

        @Data
        public static class AttrValue {
            private String attrName;
            private String attrValue;
        }
    }

    @Data
    public static class PartClassView {
        private Long nodeId;
        private String nodeName;
        private String nodePath;
        private List<AttrEntry> attributes;

        public PartClassView(Long nodeId, String nodeName, String nodePath, List<AttrEntry> attributes) {
            this.nodeId = nodeId;
            this.nodeName = nodeName;
            this.nodePath = nodePath;
            this.attributes = attributes;
        }

        @Data
        public static class AttrEntry {
            private String attrName;
            private String attrValue;

            public AttrEntry(String attrName, String attrValue) {
                this.attrName = attrName;
                this.attrValue = attrValue;
            }
        }
    }

    // ─── Tree builder ──────────────────────────────────────────────────────────

    private TreeNode toTreeNode(ClassificationNode node) {
        TreeNode tn = new TreeNode(node);
        List<ClassificationNode> children = nodeRepository
                .findByParentIdAndIsDeletedFalseOrderBySortOrderAscNameAsc(node.getId());
        for (ClassificationNode child : children) {
            tn.getChildren().add(toTreeNode(child));
        }
        return tn;
    }

    // ─── Helpers ───────────────────────────────────────────────────────────────

    private ResponseEntity<ApiResponse<?>> ok(Object data) {
        return ok(data, APIConstants.SUCCESS);
    }

    private ResponseEntity<ApiResponse<?>> ok(Object data, String message) {
        return ResponseEntity.ok(ApiResponse.builder().success(true).message(message).data(data).build());
    }
}
