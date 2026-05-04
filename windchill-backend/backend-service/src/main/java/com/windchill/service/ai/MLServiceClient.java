package com.windchill.service.ai;

import com.windchill.service.ai.dto.RiskPredictionRequest;
import com.windchill.service.ai.dto.RiskPredictionResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Arrays;
import java.util.List;

@Slf4j
@Service
public class MLServiceClient {

    private static final List<String> ALLOWED_HOSTS =
        List.of("ml-service", "localhost", "127.0.0.1", "ml-fastapi");

    private final RestTemplate restTemplate;
    private final String mlServiceUrl;
    private final boolean mlServiceEnabled;

    public MLServiceClient(
            RestTemplate restTemplate,
            @Value("${ml.service.url:http://ml-service:5000}") String mlServiceUrl,
            @Value("${ml.service.enabled:true}") boolean mlServiceEnabled) {
        validateUrl(mlServiceUrl);
        this.restTemplate = restTemplate;
        this.mlServiceUrl = mlServiceUrl;
        this.mlServiceEnabled = mlServiceEnabled;
        log.info("ML Service Client initialized: url={}, enabled={}", mlServiceUrl, mlServiceEnabled);
    }

    private static void validateUrl(String url) {
        try {
            URI uri = new URI(url);
            String scheme = uri.getScheme();
            String host   = uri.getHost();
            if (scheme == null || (!scheme.equals("http") && !scheme.equals("https"))) {
                throw new IllegalStateException("ml.service.url must use http or https scheme: " + url);
            }
            if (host == null || ALLOWED_HOSTS.stream().noneMatch(host::equals)) {
                throw new IllegalStateException(
                    "ml.service.url host '" + host + "' is not in the allowed list: " + ALLOWED_HOSTS);
            }
        } catch (URISyntaxException e) {
            throw new IllegalStateException("ml.service.url is not a valid URI: " + url, e);
        }
    }

    public RiskPredictionResponse predictRisk(RiskPredictionRequest request) {
        if (!mlServiceEnabled) {
            log.warn("ML Service is disabled, returning fallback response");
            return createFallbackResponse();
        }
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setAccept(Arrays.asList(MediaType.APPLICATION_JSON));
            HttpEntity<RiskPredictionRequest> entity = new HttpEntity<>(request, headers);
            ResponseEntity<RiskPredictionResponse> response = restTemplate.postForEntity(
                mlServiceUrl + "/predict-risk", entity, RiskPredictionResponse.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                log.info("ML prediction successful: risk_score={}, level={}",
                    response.getBody().getRiskScore(), response.getBody().getRiskLevel());
                return response.getBody();
            }
            log.warn("ML service returned non-2xx status: {}", response.getStatusCode());
            return createFallbackResponse();
        } catch (RestClientException e) {
            log.error("ML service call failed, using fallback: {}", e.getMessage());
            return createFallbackResponse();
        }
    }

    public boolean isHealthy() {
        if (!mlServiceEnabled) return false;
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(mlServiceUrl + "/health", String.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            log.warn("ML service health check failed: {}", e.getMessage());
            return false;
        }
    }

    private RiskPredictionResponse createFallbackResponse() {
        return RiskPredictionResponse.builder()
            .riskScore(5.0)
            .riskLevel("MEDIUM")
            .confidence(0.5)
            .factors(Arrays.asList("ML service unavailable - conservative estimate", "Manual review recommended"))
            .modelType("FALLBACK")
            .timestamp(java.time.Instant.now().toString())
            .build();
    }
}
