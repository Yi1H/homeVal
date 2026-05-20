package com.homeval.analysis.service;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Service
public class PredictionService {

    private final WebClient webClient;

    public PredictionService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.baseUrl("http://localhost:8000").build();
    }

    @Cacheable(value = "whatIfPredictions", key = "#baseRecordId + ':' + #bedrooms + ':' + #bathrooms + ':' + #schoolRating")
    public Map<String, Object> getWhatIfPredictionCached(
            Long baseRecordId,
            Integer bedrooms,
            Double bathrooms,
            Double schoolRating,
            Map<String, Object> fullFeatures
    ) {
        return this.webClient.post()
                .uri("/predict")
                .bodyValue(fullFeatures)
                .retrieve()
                .bodyToMono(Map.class)
                .block(Duration.ofSeconds(10));
    }

    @Cacheable(value = "whatIfPredictions", key = "'cf:' + #baseRecordId + ':' + #bedrooms + ':' + #bathrooms + ':' + #schoolRating")
    public Map<String, Object> getCounterfactualRenovationCached(
            Long baseRecordId,
            Integer bedrooms,
            Double bathrooms,
            Double schoolRating
    ) {
        Map<String, Object> simulated = new HashMap<>();
        if (bedrooms != null) simulated.put("bedrooms", bedrooms);
        if (bathrooms != null) simulated.put("bathrooms", bathrooms);
        if (schoolRating != null) simulated.put("school_rating", schoolRating);

        Map<String, Object> payload = new HashMap<>();
        payload.put("base_record_id", baseRecordId);
        payload.put("simulated_features", simulated);

        return this.webClient.post()
                .uri("/counterfactual-renovation")
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(Map.class)
                .block(Duration.ofSeconds(10));
    }

    public static class PredictionResponse {
        private String id;
        private Double prediction;
        private Long timestamp;

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public Double getPrediction() { return prediction; }
        public void setPrediction(Double prediction) { this.prediction = prediction; }
        public Long getTimestamp() { return timestamp; }
        public void setTimestamp(Long timestamp) { this.timestamp = timestamp; }
    }
}
