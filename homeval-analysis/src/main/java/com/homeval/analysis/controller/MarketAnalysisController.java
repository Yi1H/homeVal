package com.homeval.analysis.controller;

import com.homeval.analysis.model.PropertyData;
import com.homeval.analysis.service.MarketAnalysisService;
import com.homeval.analysis.service.MarketReportService;
import com.homeval.analysis.service.PredictionService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 市场分析控制器：提供房产数据的汇总统计和模拟预测接口
 */
@RestController
@RequestMapping("/api/v1/market")
@CrossOrigin(origins = "*") // 允许跨域，方便前端调用
public class MarketAnalysisController {

    private final MarketAnalysisService marketAnalysisService;
    private final PredictionService predictionService;
    private final MarketReportService marketReportService;

    // 手动实现构造函数以进行依赖注入，替代 @RequiredArgsConstructor
    public MarketAnalysisController(
            MarketAnalysisService marketAnalysisService,
            PredictionService predictionService,
            MarketReportService marketReportService
    ) {
        this.marketAnalysisService = marketAnalysisService;
        this.predictionService = predictionService;
        this.marketReportService = marketReportService;
    }

    /**
     * 市场分析接口：支持四个黄金维度的筛选（与前端 FilterState 对齐）
     */
    @GetMapping("/analytics")
    public Map<String, Object> getAnalytics(
            @RequestParam(name = "property_type", defaultValue = "all") String propertyType,
            @RequestParam(name = "school_tier", defaultValue = "all") String schoolTier,
            @RequestParam(name = "location_zone", defaultValue = "all") String locationZone,
            @RequestParam(name = "generation", defaultValue = "all") String generation
    ) {
        return marketAnalysisService.getMarketAnalytics(propertyType, schoolTier, locationZone, generation);
    }

    /**
     * 执行“假设分析”（What-if Analysis）
     * - 前端只传 base_record_id + simulated_features（bedrooms/bathrooms/school_rating）
     * - Java 端从 base_record_id 查出其余固定特征并进行“特征缝合”
     * - 调用 Task 1 的 Python 业务后端（8000）进行预测
     */
    @PostMapping("/what-if")
    public Map<String, Object> calculateWhatIf(@RequestBody WhatIfRequest request) {
        if (request == null || request.getBaseRecordId() == null || request.getSimulatedFeatures() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "请求参数不完整");
        }

        PropertyData base = marketAnalysisService.findById(request.getBaseRecordId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "找不到 base_record_id 对应的房源记录"));

        Map<String, Object> fullFeatures = new HashMap<>();
        fullFeatures.put("square_footage", base.getSquareFootage());
        fullFeatures.put("bedrooms", request.getSimulatedFeatures().getBedrooms() != null ? request.getSimulatedFeatures().getBedrooms() : base.getBedrooms());
        fullFeatures.put("bathrooms", request.getSimulatedFeatures().getBathrooms() != null ? request.getSimulatedFeatures().getBathrooms() : base.getBathrooms());
        fullFeatures.put("year_built", base.getYearBuilt());
        fullFeatures.put("lot_size", base.getLotSize());
        fullFeatures.put("distance_to_city_center", base.getDistanceToCityCenter());
        fullFeatures.put("school_rating", request.getSimulatedFeatures().getSchoolRating() != null ? request.getSimulatedFeatures().getSchoolRating() : base.getSchoolRating());

        Map<String, Object> result = predictionService.getWhatIfPredictionCached(
                base.getId(),
                request.getSimulatedFeatures().getBedrooms(),
                request.getSimulatedFeatures().getBathrooms(),
                request.getSimulatedFeatures().getSchoolRating(),
                fullFeatures
        );

        Object predicted = result == null ? null : result.get("prediction");
        double simulatedPrice = predicted instanceof Number ? ((Number) predicted).doubleValue() : 0.0;

        Map<String, Object> response = new HashMap<>();
        response.put("base_record_id", base.getId());
        response.put("base_price", base.getPrice());
        response.put("square_footage", base.getSquareFootage());
        response.put("simulated_price", simulatedPrice);
        return response;
    }

    /**
     * 导出市场分析 PDF（按 property_valuation_report.pdf 的结构风格拆成三段）
     * A：拉取大盘底色（复用 /analytics 的缓存统计）
     * B：请求 AI 容器 /counterfactual-renovation（基准房 + 三变量）
     * C：捞取附录清单（当前筛选下前 15 条记录）
     */
    @PostMapping("/report/pdf")
    public ResponseEntity<byte[]> exportReportPdf(@RequestBody ReportPdfRequest request) {
        if (request == null || request.getFilters() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "filters 不能为空");
        }
        if (request.getBaseRecordId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "base_record_id 不能为空");
        }

        Map<String, Object> analytics = marketAnalysisService.getMarketAnalytics(
                request.getFilters().getPropertyType(),
                request.getFilters().getSchoolTier(),
                request.getFilters().getLocationZone(),
                request.getFilters().getGeneration()
        );

        PropertyData base = marketAnalysisService.findById(request.getBaseRecordId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "找不到 base_record_id 对应的房源记录"));

        Integer bedrooms = request.getSimulatedFeatures() != null ? request.getSimulatedFeatures().getBedrooms() : null;
        Double bathrooms = request.getSimulatedFeatures() != null ? request.getSimulatedFeatures().getBathrooms() : null;
        Double schoolRating = request.getSimulatedFeatures() != null ? request.getSimulatedFeatures().getSchoolRating() : null;

        Map<String, Object> counterfactual = predictionService.getCounterfactualRenovationCached(
                base.getId(),
                bedrooms,
                bathrooms,
                schoolRating
        );

        List<Map<String, Object>> records = new ArrayList<>();
        Object recordsObj = analytics.get("records");
        if (recordsObj instanceof List<?> list) {
            for (Object item : list) {
                if (item instanceof Map<?, ?> map) {
                    records.add((Map<String, Object>) map);
                }
            }
        }
        List<Map<String, Object>> appendix = records.subList(0, Math.min(15, records.size()));

        byte[] pdf = marketReportService.buildPdfReport(analytics, base, counterfactual, appendix);

        String filename = "market_analysis_" + ZonedDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".pdf";
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(pdf);
    }

    public static class WhatIfRequest {
        @com.fasterxml.jackson.annotation.JsonProperty("base_record_id")
        private Long baseRecordId;

        @com.fasterxml.jackson.annotation.JsonProperty("simulated_features")
        private SimulatedFeatures simulatedFeatures;

        public Long getBaseRecordId() { return baseRecordId; }
        public void setBaseRecordId(Long baseRecordId) { this.baseRecordId = baseRecordId; }
        public SimulatedFeatures getSimulatedFeatures() { return simulatedFeatures; }
        public void setSimulatedFeatures(SimulatedFeatures simulatedFeatures) { this.simulatedFeatures = simulatedFeatures; }
    }

    public static class SimulatedFeatures {
        @com.fasterxml.jackson.annotation.JsonProperty("bedrooms")
        private Integer bedrooms;

        @com.fasterxml.jackson.annotation.JsonProperty("bathrooms")
        private Double bathrooms;

        @com.fasterxml.jackson.annotation.JsonProperty("school_rating")
        private Double schoolRating;

        public Integer getBedrooms() { return bedrooms; }
        public void setBedrooms(Integer bedrooms) { this.bedrooms = bedrooms; }
        public Double getBathrooms() { return bathrooms; }
        public void setBathrooms(Double bathrooms) { this.bathrooms = bathrooms; }
        public Double getSchoolRating() { return schoolRating; }
        public void setSchoolRating(Double schoolRating) { this.schoolRating = schoolRating; }
    }

    public static class ReportPdfRequest {
        @com.fasterxml.jackson.annotation.JsonProperty("filters")
        private Filters filters;

        @com.fasterxml.jackson.annotation.JsonProperty("base_record_id")
        private Long baseRecordId;

        @com.fasterxml.jackson.annotation.JsonProperty("simulated_features")
        private SimulatedFeatures simulatedFeatures;

        public Filters getFilters() { return filters; }
        public void setFilters(Filters filters) { this.filters = filters; }
        public Long getBaseRecordId() { return baseRecordId; }
        public void setBaseRecordId(Long baseRecordId) { this.baseRecordId = baseRecordId; }
        public SimulatedFeatures getSimulatedFeatures() { return simulatedFeatures; }
        public void setSimulatedFeatures(SimulatedFeatures simulatedFeatures) { this.simulatedFeatures = simulatedFeatures; }
    }

    public static class Filters {
        @com.fasterxml.jackson.annotation.JsonProperty("property_type")
        private String propertyType;

        @com.fasterxml.jackson.annotation.JsonProperty("school_tier")
        private String schoolTier;

        @com.fasterxml.jackson.annotation.JsonProperty("location_zone")
        private String locationZone;

        @com.fasterxml.jackson.annotation.JsonProperty("generation")
        private String generation;

        public String getPropertyType() { return propertyType; }
        public void setPropertyType(String propertyType) { this.propertyType = propertyType; }
        public String getSchoolTier() { return schoolTier; }
        public void setSchoolTier(String schoolTier) { this.schoolTier = schoolTier; }
        public String getLocationZone() { return locationZone; }
        public void setLocationZone(String locationZone) { this.locationZone = locationZone; }
        public String getGeneration() { return generation; }
        public void setGeneration(String generation) { this.generation = generation; }
    }
}
