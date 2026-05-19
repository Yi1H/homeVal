package com.homeval.analysis.service;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * 预测服务：集成 Task 1 的 Python ML 模型服务
 */
@Service
public class PredictionService {

    private final WebClient webClient;

    public PredictionService(WebClient.Builder webClientBuilder) {
        // Task 1 API 运行在 8000 端口
        this.webClient = webClientBuilder.baseUrl("http://localhost:8000").build();
    }

    /**
     * 获取“假设分析”预测结果（带缓存）
     * 说明：
     * - 缓存 key 使用 base_record_id + 三个可变特征，保证稳定且可读
     * - 使用 WebClient 但以同步方式 block 获取结果，便于 Spring Cache 正常缓存
     */
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

    /**
     * 反事实改造模拟（供 PDF 报告导出使用）
     * - Java 仅传 base_record_id + 三个可变特征给业务后端 /counterfactual-renovation
     * - 业务后端会用 base_record_id 还原其余事实特征，再调用 ML 服务 /predict
     */
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
