package com.windchill.service.ai;

import com.windchill.service.ai.dto.RiskPredictionRequest;
import com.windchill.service.ai.dto.RiskPredictionResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MLServiceClientTest {

    @Mock RestTemplate restTemplate;

    private MLServiceClient client(String url, boolean enabled) {
        return new MLServiceClient(restTemplate, url, enabled);
    }

    private RiskPredictionRequest sampleRequest() {
        return RiskPredictionRequest.builder()
            .partId(1L).changeType("MODIFY").bomDepth(2)
            .whereUsedCount(5).releasedAffected(1)
            .conflictingChanges(0).lifecycleState("INWORK")
            .hasComplianceIssues(false).build();
    }

    // ─── constructor / URL validation ────────────────────────────────────────

    @Nested @DisplayName("constructor URL validation")
    class UrlValidation {

        @Test @DisplayName("valid ml-service URL constructs successfully")
        void validMlServiceUrl() {
            assertThatCode(() -> client("http://ml-service:5000", true))
                .doesNotThrowAnyException();
        }

        @Test @DisplayName("valid localhost URL constructs successfully")
        void validLocalhostUrl() {
            assertThatCode(() -> client("http://localhost:5000", true))
                .doesNotThrowAnyException();
        }

        @Test @DisplayName("rejects cloud metadata endpoint (SSRF)")
        void rejectsCloudMetadata() {
            assertThatThrownBy(() -> client("http://169.254.169.254/latest/meta-data", true))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("not in the allowed list");
        }

        @Test @DisplayName("rejects internal VPC host not on allowlist")
        void rejectsArbitraryInternalHost() {
            assertThatThrownBy(() -> client("http://internal-db:3306", true))
                .isInstanceOf(IllegalStateException.class);
        }

        @Test @DisplayName("rejects ftp:// scheme")
        void rejectsFtpScheme() {
            assertThatThrownBy(() -> client("ftp://ml-service:5000", true))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("http or https");
        }

        @Test @DisplayName("rejects malformed URI")
        void rejectsMalformedUri() {
            assertThatThrownBy(() -> client("not a url ://broken", true))
                .isInstanceOf(IllegalStateException.class);
        }
    }

    // ─── predictRisk ─────────────────────────────────────────────────────────

    @Nested @DisplayName("predictRisk()")
    class PredictRisk {

        @Test @DisplayName("returns ML response when service replies 2xx")
        void successfulPrediction() {
            RiskPredictionResponse mlResponse = RiskPredictionResponse.builder()
                .riskScore(6.5).riskLevel("MEDIUM").confidence(0.88).build();
            when(restTemplate.postForEntity(anyString(), any(), eq(RiskPredictionResponse.class)))
                .thenReturn(ResponseEntity.ok(mlResponse));

            RiskPredictionResponse result = client("http://ml-service:5000", true)
                .predictRisk(sampleRequest());

            assertThat(result.getRiskScore()).isEqualTo(6.5);
            assertThat(result.getRiskLevel()).isEqualTo("MEDIUM");
            assertThat(result.getModelType()).isNull(); // ML didn't set it
        }

        @Test @DisplayName("returns fallback when service replies non-2xx")
        void nonSuccessStatusFallback() {
            when(restTemplate.postForEntity(anyString(), any(), eq(RiskPredictionResponse.class)))
                .thenReturn(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(null));

            RiskPredictionResponse result = client("http://ml-service:5000", true)
                .predictRisk(sampleRequest());

            assertThat(result.getRiskLevel()).isEqualTo("MEDIUM");
            assertThat(result.getModelType()).isEqualTo("FALLBACK");
        }

        @Test @DisplayName("returns fallback when RestTemplate throws")
        void networkErrorFallback() {
            when(restTemplate.postForEntity(anyString(), any(), eq(RiskPredictionResponse.class)))
                .thenThrow(new ResourceAccessException("Connection refused"));

            RiskPredictionResponse result = client("http://ml-service:5000", true)
                .predictRisk(sampleRequest());

            assertThat(result.getModelType()).isEqualTo("FALLBACK");
            assertThat(result.getRiskScore()).isEqualTo(5.0);
            assertThat(result.getConfidence()).isEqualTo(0.5);
        }

        @Test @DisplayName("returns fallback immediately when ML service is disabled")
        void disabledService() {
            RiskPredictionResponse result = client("http://ml-service:5000", false)
                .predictRisk(sampleRequest());

            assertThat(result.getModelType()).isEqualTo("FALLBACK");
            verifyNoInteractions(restTemplate);
        }

        @Test @DisplayName("fallback response includes manual review recommendation")
        void fallbackIncludesReviewNote() {
            when(restTemplate.postForEntity(anyString(), any(), eq(RiskPredictionResponse.class)))
                .thenThrow(new ResourceAccessException("ML down"));

            RiskPredictionResponse result = client("http://ml-service:5000", true)
                .predictRisk(sampleRequest());

            assertThat(result.getFactors()).anyMatch(f -> f.contains("Manual review"));
        }
    }

    // ─── isHealthy ───────────────────────────────────────────────────────────

    @Nested @DisplayName("isHealthy()")
    class IsHealthy {

        @Test @DisplayName("returns true when ML service responds 200")
        void healthy() {
            when(restTemplate.getForEntity(anyString(), eq(String.class)))
                .thenReturn(ResponseEntity.ok("OK"));

            assertThat(client("http://ml-service:5000", true).isHealthy()).isTrue();
        }

        @Test @DisplayName("returns false when ML service throws")
        void unhealthyOnException() {
            when(restTemplate.getForEntity(anyString(), eq(String.class)))
                .thenThrow(new ResourceAccessException("Connection refused"));

            assertThat(client("http://ml-service:5000", true).isHealthy()).isFalse();
        }

        @Test @DisplayName("returns false immediately when disabled")
        void disabledIsUnhealthy() {
            assertThat(client("http://ml-service:5000", false).isHealthy()).isFalse();
            verifyNoInteractions(restTemplate);
        }
    }
}
