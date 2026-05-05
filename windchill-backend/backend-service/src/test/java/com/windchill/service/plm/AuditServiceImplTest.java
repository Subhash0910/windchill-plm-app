package com.windchill.service.plm;

import com.windchill.common.enums.PlmEntityTypeEnum;
import com.windchill.domain.entity.AuditLog;
import com.windchill.repository.AuditLogRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuditServiceImplTest {

    @Mock AuditLogRepository repo;
    @InjectMocks AuditServiceImpl service;

    // ── log ────────────────────────────────────────────────────────────────

    @Nested @DisplayName("log")
    class Log {

        @Test @DisplayName("persists all fields to repo")
        void allFields() {
            service.log(PlmEntityTypeEnum.PART, 7L, "PROMOTE", "alice");

            ArgumentCaptor<AuditLog> cap = ArgumentCaptor.forClass(AuditLog.class);
            verify(repo).save(cap.capture());

            AuditLog entry = cap.getValue();
            assertThat(entry.getEntityType()).isEqualTo(PlmEntityTypeEnum.PART);
            assertThat(entry.getEntityId()).isEqualTo(7L);
            assertThat(entry.getAction()).isEqualTo("PROMOTE");
            assertThat(entry.getActor()).isEqualTo("alice");
        }

        @Test @DisplayName("accepts null actor (system-generated events)")
        void nullActor() {
            service.log(PlmEntityTypeEnum.DOCUMENT, 1L, "CREATE", null);

            ArgumentCaptor<AuditLog> cap = ArgumentCaptor.forClass(AuditLog.class);
            verify(repo).save(cap.capture());
            assertThat(cap.getValue().getActor()).isNull();
        }
    }

    // ── getLogs ────────────────────────────────────────────────────────────

    @Nested @DisplayName("getLogs")
    class GetLogs {

        @Test @DisplayName("delegates to repo and returns results")
        void delegates() {
            AuditLog entry = new AuditLog();
            entry.setEntityType(PlmEntityTypeEnum.PART);
            entry.setEntityId(7L);
            entry.setAction("PROMOTE");
            entry.setActor("alice");

            when(repo.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(PlmEntityTypeEnum.PART, 7L))
                .thenReturn(List.of(entry));

            List<AuditLog> result = service.getLogs(PlmEntityTypeEnum.PART, 7L);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getAction()).isEqualTo("PROMOTE");
        }

        @Test @DisplayName("returns empty list when no history")
        void empty() {
            when(repo.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(any(), anyLong()))
                .thenReturn(List.of());

            assertThat(service.getLogs(PlmEntityTypeEnum.DOCUMENT, 99L)).isEmpty();
        }
    }

    // ── getAllLogs ─────────────────────────────────────────────────────────

    @Nested @DisplayName("getAllLogs")
    class GetAllLogs {

        @Test @DisplayName("passes requested limit to pageable")
        void passesLimit() {
            when(repo.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of()));

            service.getAllLogs(50);

            ArgumentCaptor<Pageable> cap = ArgumentCaptor.forClass(Pageable.class);
            verify(repo).findAll(cap.capture());
            assertThat(cap.getValue().getPageSize()).isEqualTo(50);
        }

        @Test @DisplayName("clamps limit to 500 when too large")
        void clampMax() {
            when(repo.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of()));

            service.getAllLogs(9999);

            ArgumentCaptor<Pageable> cap = ArgumentCaptor.forClass(Pageable.class);
            verify(repo).findAll(cap.capture());
            assertThat(cap.getValue().getPageSize()).isEqualTo(500);
        }

        @Test @DisplayName("clamps limit to 1 when zero or negative")
        void clampMin() {
            when(repo.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of()));

            service.getAllLogs(0);

            ArgumentCaptor<Pageable> cap = ArgumentCaptor.forClass(Pageable.class);
            verify(repo).findAll(cap.capture());
            assertThat(cap.getValue().getPageSize()).isEqualTo(1);
        }

        @Test @DisplayName("returns page content")
        void returnsContent() {
            AuditLog log1 = new AuditLog(); log1.setAction("A");
            AuditLog log2 = new AuditLog(); log2.setAction("B");
            when(repo.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(log1, log2)));

            List<AuditLog> result = service.getAllLogs(200);

            assertThat(result).hasSize(2);
        }
    }
}
