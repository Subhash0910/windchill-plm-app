package com.windchill.service.change;

import com.windchill.common.exception.BusinessException;
import com.windchill.common.exception.ResourceNotFoundException;
import com.windchill.domain.entity.ChangeOrder;
import com.windchill.repository.ChangeOrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChangeOrderServiceImplTest {

    @Mock  ChangeOrderRepository repo;
    @InjectMocks ChangeOrderServiceImpl service;

    private ChangeOrder draftEco;
    private static final String OWNER   = "alice";
    private static final String ASSIGNEE = "bob";
    private static final String STRANGER = "charlie";
    private static final Long   ECO_ID  = 1L;
    private static final Long   CTX_ID  = 10L;

    @BeforeEach
    void setUp() {
        draftEco = ChangeOrder.builder()
            .id(ECO_ID)
            .ecoNumber("ECO-00001")
            .title("Test ECO")
            .description("A test change order")
            .state(ChangeOrder.State.DRAFT)
            .priority(ChangeOrder.Priority.MEDIUM)
            .contextId(CTX_ID)
            .createdBy(OWNER)
            .assignedTo(ASSIGNEE)
            .isDeleted(false)
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();
    }

    // ─── create ──────────────────────────────────────────────────────────────

    @Nested @DisplayName("create()")
    class Create {

        @Test @DisplayName("persists ECO and returns DTO with generated number")
        void happyPath() {
            when(repo.countByContextIdAndIsDeletedFalse(CTX_ID)).thenReturn(0L);
            when(repo.save(any())).thenReturn(draftEco);

            ChangeOrderCreateRequest req = new ChangeOrderCreateRequest();
            req.setContextId(CTX_ID);
            req.setTitle("Test ECO");

            ChangeOrderDto dto = service.create(req, OWNER);

            assertThat(dto.getEcoNumber()).isEqualTo("ECO-00001");
            assertThat(dto.getState()).isEqualTo("DRAFT");
            verify(repo).save(argThat(eco ->
                eco.getCreatedBy().equals(OWNER) &&
                eco.getEcoNumber().equals("ECO-00001") &&
                !eco.getIsDeleted()
            ));
        }

        @Test @DisplayName("ECO number sequence increments from existing count")
        void ecoNumberSequencing() {
            when(repo.countByContextIdAndIsDeletedFalse(CTX_ID)).thenReturn(4L);
            when(repo.save(any())).thenReturn(draftEco);

            ChangeOrderCreateRequest req = new ChangeOrderCreateRequest();
            req.setContextId(CTX_ID);
            req.setTitle("Fifth ECO");

            service.create(req, OWNER);

            verify(repo).save(argThat(eco -> eco.getEcoNumber().equals("ECO-00005")));
        }

        @Test @DisplayName("defaults to MEDIUM priority when none specified")
        void defaultPriority() {
            when(repo.countByContextIdAndIsDeletedFalse(CTX_ID)).thenReturn(0L);
            when(repo.save(any())).thenReturn(draftEco);

            ChangeOrderCreateRequest req = new ChangeOrderCreateRequest();
            req.setContextId(CTX_ID);
            req.setTitle("No priority ECO");

            service.create(req, OWNER);

            verify(repo).save(argThat(eco ->
                eco.getPriority() == ChangeOrder.Priority.MEDIUM));
        }
    }

    // ─── getById ─────────────────────────────────────────────────────────────

    @Nested @DisplayName("getById()")
    class GetById {

        @Test @DisplayName("returns DTO when ECO exists")
        void found() {
            when(repo.findByIdAndIsDeletedFalse(ECO_ID)).thenReturn(Optional.of(draftEco));
            ChangeOrderDto dto = service.getById(ECO_ID);
            assertThat(dto.getId()).isEqualTo(ECO_ID);
            assertThat(dto.getTitle()).isEqualTo("Test ECO");
        }

        @Test @DisplayName("throws ResourceNotFoundException when ECO is missing")
        void notFound() {
            when(repo.findByIdAndIsDeletedFalse(99L)).thenReturn(Optional.empty());
            assertThatThrownBy(() -> service.getById(99L))
                .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    // ─── listByContext ────────────────────────────────────────────────────────

    @Nested @DisplayName("listByContext()")
    class ListByContext {

        @Test @DisplayName("maps all results to DTOs")
        void returnsMappedList() {
            when(repo.findByContextIdAndIsDeletedFalseOrderByCreatedAtDesc(CTX_ID))
                .thenReturn(List.of(draftEco));

            List<ChangeOrderDto> result = service.listByContext(CTX_ID);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getEcoNumber()).isEqualTo("ECO-00001");
        }

        @Test @DisplayName("returns empty list when context has no ECOs")
        void emptyContext() {
            when(repo.findByContextIdAndIsDeletedFalseOrderByCreatedAtDesc(CTX_ID))
                .thenReturn(List.of());

            assertThat(service.listByContext(CTX_ID)).isEmpty();
        }
    }

    // ─── promote ─────────────────────────────────────────────────────────────

    @Nested @DisplayName("promote()")
    class Promote {

        @Test @DisplayName("owner can advance DRAFT → OPEN")
        void ownerCanPromote() {
            when(repo.findByIdAndIsDeletedFalse(ECO_ID)).thenReturn(Optional.of(draftEco));
            when(repo.save(any())).thenAnswer(inv -> inv.getArgument(0));

            ChangeOrderDto dto = service.promote(ECO_ID, "OPEN", OWNER);

            assertThat(dto.getState()).isEqualTo("OPEN");
        }

        @Test @DisplayName("assignee can advance DRAFT → OPEN")
        void assigneeCanPromote() {
            when(repo.findByIdAndIsDeletedFalse(ECO_ID)).thenReturn(Optional.of(draftEco));
            when(repo.save(any())).thenAnswer(inv -> inv.getArgument(0));

            ChangeOrderDto dto = service.promote(ECO_ID, "OPEN", ASSIGNEE);

            assertThat(dto.getState()).isEqualTo("OPEN");
        }

        @Test @DisplayName("stranger cannot promote — throws BusinessException")
        void strangerIsRejected() {
            when(repo.findByIdAndIsDeletedFalse(ECO_ID)).thenReturn(Optional.of(draftEco));

            assertThatThrownBy(() -> service.promote(ECO_ID, "OPEN", STRANGER))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Not authorized");
        }

        @Test @DisplayName("unknown state string throws BusinessException")
        void unknownState() {
            when(repo.findByIdAndIsDeletedFalse(ECO_ID)).thenReturn(Optional.of(draftEco));

            assertThatThrownBy(() -> service.promote(ECO_ID, "FLYING", OWNER))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Unknown state");
        }

        @Test @DisplayName("invalid transition throws BusinessException")
        void invalidTransition() {
            when(repo.findByIdAndIsDeletedFalse(ECO_ID)).thenReturn(Optional.of(draftEco));

            // DRAFT → COMPLETED is not allowed
            assertThatThrownBy(() -> service.promote(ECO_ID, "COMPLETED", OWNER))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Cannot transition");
        }

        @Test @DisplayName("COMPLETED is a terminal state — cannot advance")
        void terminalStateBlocked() {
            ChangeOrder completedEco = ChangeOrder.builder()
                .id(ECO_ID).ecoNumber("ECO-00001").title("Done")
                .state(ChangeOrder.State.COMPLETED).contextId(CTX_ID)
                .createdBy(OWNER).isDeleted(false)
                .createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now())
                .build();
            when(repo.findByIdAndIsDeletedFalse(ECO_ID)).thenReturn(Optional.of(completedEco));

            assertThatThrownBy(() -> service.promote(ECO_ID, "OPEN", OWNER))
                .isInstanceOf(BusinessException.class);
        }

        @Test @DisplayName("promote stamps updatedBy on the saved entity")
        void auditsUpdatedBy() {
            when(repo.findByIdAndIsDeletedFalse(ECO_ID)).thenReturn(Optional.of(draftEco));
            when(repo.save(any())).thenAnswer(inv -> inv.getArgument(0));

            service.promote(ECO_ID, "OPEN", OWNER);

            verify(repo).save(argThat(eco -> OWNER.equals(eco.getUpdatedBy())));
        }
    }

    // ─── linkAiResult ────────────────────────────────────────────────────────

    @Nested @DisplayName("linkAiResult()")
    class LinkAiResult {

        @Test @DisplayName("persists risk score, confidence, and cost estimate")
        void storesAllThreeValues() {
            when(repo.findByIdAndIsDeletedFalse(ECO_ID)).thenReturn(Optional.of(draftEco));
            when(repo.save(any())).thenAnswer(inv -> inv.getArgument(0));

            ChangeOrderDto dto = service.linkAiResult(ECO_ID, 7.5, 0.9, 12000.0, OWNER);

            assertThat(dto.getAiRiskScore()).isEqualTo(7.5);
            assertThat(dto.getAiConfidence()).isEqualTo(0.9);
            assertThat(dto.getAiCostEstimate()).isEqualTo(12000.0);
        }

        @Test @DisplayName("accepts null values (AI service may not produce all fields)")
        void nullValuesAccepted() {
            when(repo.findByIdAndIsDeletedFalse(ECO_ID)).thenReturn(Optional.of(draftEco));
            when(repo.save(any())).thenAnswer(inv -> inv.getArgument(0));

            assertThatCode(() -> service.linkAiResult(ECO_ID, null, null, null, OWNER))
                .doesNotThrowAnyException();
        }
    }

    // ─── delete ──────────────────────────────────────────────────────────────

    @Nested @DisplayName("delete()")
    class Delete {

        @Test @DisplayName("owner can soft-delete their ECO")
        void ownerDeletes() {
            when(repo.findByIdAndIsDeletedFalse(ECO_ID)).thenReturn(Optional.of(draftEco));

            service.delete(ECO_ID, OWNER);

            verify(repo).save(argThat(eco -> eco.getIsDeleted() && OWNER.equals(eco.getUpdatedBy())));
        }

        @Test @DisplayName("non-owner cannot delete — throws BusinessException")
        void strangerCannotDelete() {
            when(repo.findByIdAndIsDeletedFalse(ECO_ID)).thenReturn(Optional.of(draftEco));

            assertThatThrownBy(() -> service.delete(ECO_ID, STRANGER))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Not authorized");
        }

        @Test @DisplayName("throws ResourceNotFoundException for missing ECO")
        void missingEco() {
            when(repo.findByIdAndIsDeletedFalse(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.delete(99L, OWNER))
                .isInstanceOf(ResourceNotFoundException.class);
        }
    }
}
