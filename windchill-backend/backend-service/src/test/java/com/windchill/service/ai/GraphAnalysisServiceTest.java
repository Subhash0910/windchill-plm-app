package com.windchill.service.ai;

import com.windchill.common.enums.LifecycleStateEnum;
import com.windchill.common.exception.ResourceNotFoundException;
import com.windchill.domain.entity.BomLine;
import com.windchill.domain.entity.Part;
import com.windchill.repository.BomLineRepository;
import com.windchill.repository.PartRepository;
import com.windchill.service.ai.dto.GraphImpactResult;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GraphAnalysisServiceTest {

    @Mock PartRepository    partRepository;
    @Mock BomLineRepository bomLineRepository;
    @InjectMocks GraphAnalysisService service;

    // ─── analyzePartChange ───────────────────────────────────────────────────

    @Nested @DisplayName("analyzePartChange()")
    class AnalyzePartChange {

        @Test @DisplayName("throws ResourceNotFoundException when part does not exist")
        void partNotFound() {
            when(partRepository.findById(99L)).thenReturn(Optional.empty());
            assertThatThrownBy(() -> service.analyzePartChange(99L, "MODIFY"))
                .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test @DisplayName("leaf part has zero affected parts and zero depth")
        void leafPart() {
            when(partRepository.findById(1L)).thenReturn(Optional.of(part(1L, "P-001", LifecycleStateEnum.INWORK)));
            when(bomLineRepository.findDistinctParentPartIdsByChildPartId(1L)).thenReturn(List.of());
            when(partRepository.findAllById(Set.of())).thenReturn(List.of());

            GraphImpactResult result = service.analyzePartChange(1L, "MODIFY");

            assertThat(result.getTotalAffectedCount()).isZero();
            assertThat(result.getReleasedAffectedCount()).isZero();
            assertThat(result.getBomDepth()).isZero();
        }

        @Test @DisplayName("single parent counted as 1 affected at depth 1")
        void singleParent() {
            Part child  = part(1L, "P-001", LifecycleStateEnum.INWORK);
            Part parent = part(2L, "P-002", LifecycleStateEnum.INWORK);

            when(partRepository.findById(1L)).thenReturn(Optional.of(child));
            when(bomLineRepository.findDistinctParentPartIdsByChildPartId(1L)).thenReturn(List.of(2L));
            when(bomLineRepository.findDistinctParentPartIdsByChildPartId(2L)).thenReturn(List.of());
            when(partRepository.findAllById(anySet())).thenReturn(List.of(parent));

            GraphImpactResult result = service.analyzePartChange(1L, "MODIFY");

            assertThat(result.getTotalAffectedCount()).isEqualTo(1);
            assertThat(result.getBomDepth()).isEqualTo(1);
        }

        @Test @DisplayName("two levels: grandparent counted, depth = 2")
        void twoLevels() {
            Part child  = part(1L, "P-001", LifecycleStateEnum.INWORK);
            Part parent = part(2L, "P-002", LifecycleStateEnum.INWORK);
            Part grand  = part(3L, "P-003", LifecycleStateEnum.INWORK);

            when(partRepository.findById(1L)).thenReturn(Optional.of(child));
            when(bomLineRepository.findDistinctParentPartIdsByChildPartId(1L)).thenReturn(List.of(2L));
            when(bomLineRepository.findDistinctParentPartIdsByChildPartId(2L)).thenReturn(List.of(3L));
            when(bomLineRepository.findDistinctParentPartIdsByChildPartId(3L)).thenReturn(List.of());
            when(partRepository.findAllById(anySet())).thenReturn(List.of(parent, grand));

            GraphImpactResult result = service.analyzePartChange(1L, "MODIFY");

            assertThat(result.getTotalAffectedCount()).isEqualTo(2);
            assertThat(result.getBomDepth()).isEqualTo(2);
        }

        @Test @DisplayName("diamond BOM: shared parent counted exactly once")
        void diamondBom() {
            // child → parentA, child → parentB, parentA → top, parentB → top
            Part child   = part(1L, "P-001", LifecycleStateEnum.INWORK);
            Part parentA = part(2L, "P-002", LifecycleStateEnum.INWORK);
            Part parentB = part(3L, "P-003", LifecycleStateEnum.INWORK);
            Part top     = part(4L, "P-004", LifecycleStateEnum.INWORK);

            when(partRepository.findById(1L)).thenReturn(Optional.of(child));
            when(bomLineRepository.findDistinctParentPartIdsByChildPartId(1L)).thenReturn(List.of(2L, 3L));
            when(bomLineRepository.findDistinctParentPartIdsByChildPartId(2L)).thenReturn(List.of(4L));
            when(bomLineRepository.findDistinctParentPartIdsByChildPartId(3L)).thenReturn(List.of(4L));
            when(bomLineRepository.findDistinctParentPartIdsByChildPartId(4L)).thenReturn(List.of());
            when(partRepository.findAllById(anySet())).thenReturn(List.of(parentA, parentB, top));

            GraphImpactResult result = service.analyzePartChange(1L, "MODIFY");

            assertThat(result.getTotalAffectedCount()).isEqualTo(3);
        }

        @Test @DisplayName("counts released parents in releasedAffectedCount")
        void releasedParentCounted() {
            Part child  = part(1L, "P-001", LifecycleStateEnum.INWORK);
            Part parent = part(2L, "P-002", LifecycleStateEnum.RELEASED);

            when(partRepository.findById(1L)).thenReturn(Optional.of(child));
            when(bomLineRepository.findDistinctParentPartIdsByChildPartId(1L)).thenReturn(List.of(2L));
            when(bomLineRepository.findDistinctParentPartIdsByChildPartId(2L)).thenReturn(List.of());
            when(partRepository.findAllById(anySet())).thenReturn(List.of(parent));

            GraphImpactResult result = service.analyzePartChange(1L, "MODIFY");

            assertThat(result.getReleasedAffectedCount()).isEqualTo(1);
        }

        @Test @DisplayName("reports currentLifecycleState from the target part")
        void currentLifecycleState() {
            when(partRepository.findById(1L)).thenReturn(
                Optional.of(part(1L, "P-001", LifecycleStateEnum.RELEASED)));
            when(bomLineRepository.findDistinctParentPartIdsByChildPartId(1L)).thenReturn(List.of());
            when(partRepository.findAllById(anySet())).thenReturn(List.of());

            GraphImpactResult result = service.analyzePartChange(1L, "MODIFY");

            assertThat(result.getCurrentLifecycleState()).isEqualTo("RELEASED");
        }

        @Test @DisplayName("marks hasComplexStructure when > 10 affected or depth > 5")
        void complexStructureFlag() {
            Part child = part(1L, "P-001", LifecycleStateEnum.INWORK);
            // Set up 11 parents (IDs 2–12) to trigger the flag
            List<Long> parentIds = List.of(2L, 3L, 4L, 5L, 6L, 7L, 8L, 9L, 10L, 11L, 12L);
            List<Part> parents = parentIds.stream()
                .map(id -> part(id, "P-" + id, LifecycleStateEnum.INWORK)).toList();

            when(partRepository.findById(1L)).thenReturn(Optional.of(child));
            when(bomLineRepository.findDistinctParentPartIdsByChildPartId(1L)).thenReturn(parentIds);
            parentIds.forEach(id ->
                when(bomLineRepository.findDistinctParentPartIdsByChildPartId(id)).thenReturn(List.of()));
            when(partRepository.findAllById(anySet())).thenReturn(parents);

            GraphImpactResult result = service.analyzePartChange(1L, "MODIFY");

            assertThat(result.isHasComplexStructure()).isTrue();
        }
    }

    // ─── explodeBOM ──────────────────────────────────────────────────────────

    @Nested @DisplayName("explodeBOM()")
    class ExplodeBom {

        @Test @DisplayName("returns empty set when no children exist")
        void noChildren() {
            when(bomLineRepository.findByParentPartIdAndIsDeletedFalseOrderBySortOrderAscIdAsc(1L))
                .thenReturn(List.of());

            Set<Long> children = service.explodeBOM(1L, 5);

            assertThat(children).isEmpty();
        }

        @Test @DisplayName("returns direct children at depth 1")
        void directChildren() {
            when(bomLineRepository.findByParentPartIdAndIsDeletedFalseOrderBySortOrderAscIdAsc(1L))
                .thenReturn(List.of(bomLine(1L, 2L), bomLine(1L, 3L)));
            when(bomLineRepository.findByParentPartIdAndIsDeletedFalseOrderBySortOrderAscIdAsc(2L))
                .thenReturn(List.of());
            when(bomLineRepository.findByParentPartIdAndIsDeletedFalseOrderBySortOrderAscIdAsc(3L))
                .thenReturn(List.of());

            Set<Long> children = service.explodeBOM(1L, 5);

            assertThat(children).containsExactlyInAnyOrder(2L, 3L);
        }

        @Test @DisplayName("respects maxDepth — does not recurse past it")
        void respectsMaxDepth() {
            when(bomLineRepository.findByParentPartIdAndIsDeletedFalseOrderBySortOrderAscIdAsc(1L))
                .thenReturn(List.of(bomLine(1L, 2L)));

            // maxDepth=1 means we collect children of root but don't go deeper
            Set<Long> children = service.explodeBOM(1L, 1);

            assertThat(children).containsOnly(2L);
            verify(bomLineRepository, never())
                .findByParentPartIdAndIsDeletedFalseOrderBySortOrderAscIdAsc(2L);
        }
    }

    // ─── helpers ─────────────────────────────────────────────────────────────

    private static Part part(Long id, String partNumber, LifecycleStateEnum state) {
        Part p = new Part();
        p.setId(id);
        p.setPartNumber(partNumber);
        p.setName("Part " + partNumber);
        p.setLifecycleState(state);
        p.setRevision("A");
        p.setIteration(1);
        return p;
    }

    private static BomLine bomLine(Long parentId, Long childId) {
        BomLine line = new BomLine();
        line.setParentPartId(parentId);
        line.setChildPartId(childId);
        return line;
    }
}
