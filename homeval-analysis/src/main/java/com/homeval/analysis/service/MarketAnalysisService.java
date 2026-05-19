package com.homeval.analysis.service;

import com.homeval.analysis.model.PropertyData;
import com.opencsv.bean.CsvToBeanBuilder;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.io.FileInputStream;
import java.io.InputStreamReader;
import java.io.PushbackReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Paths;
import java.util.*;

/**
 * 市场分析服务：负责数据加载、汇总统计及计算逻辑
 */
@Service
public class MarketAnalysisService {

    private static final Logger log = LoggerFactory.getLogger(MarketAnalysisService.class);

    // 内存中的房产数据缓存
    private List<PropertyData> propertyDataList = new ArrayList<>();
    
    // 引用 Task 1 的原始 CSV 数据文件路径
    private final String CSV_PATH = "../homeval-api/data/House Price Dataset.csv";

    /**
     * 服务启动后自动加载 CSV 数据
     */
    @PostConstruct
    public void init() {
        loadData();
    }

    /**
     * 解析 CSV 文件并转换为 Java 对象列表
     */
    private void loadData() {
        try {
            String absolutePath = Paths.get(CSV_PATH).toAbsolutePath().normalize().toString();
            log.info("正在从以下路径加载市场数据: {}", absolutePath);
            InputStreamReader reader = new InputStreamReader(new FileInputStream(absolutePath), StandardCharsets.UTF_8);
            PushbackReader pushbackReader = new PushbackReader(reader, 1);
            int first = pushbackReader.read();
            if (first != 0xFEFF && first != -1) {
                pushbackReader.unread(first);
            }

            propertyDataList = new CsvToBeanBuilder<PropertyData>(pushbackReader)
                    .withType(PropertyData.class)
                    .build()
                    .parse();
            log.info("成功加载 {} 条记录", propertyDataList.size());
        } catch (Exception e) {
            log.error("市场数据加载失败", e);
        }
    }

    /**
     * 市场分析核心接口：支持四个黄金维度的筛选（与前端筛选器契约对齐）
     * - property_type: all | single_family | condo_apartment
     * - school_tier: all | base | good | elite
     * - location_zone: all | downtown | suburban_inner | suburban_out
     * - generation: all | modern | mature | legacy
     */
    @Cacheable(value = "marketAnalytics", key = "#propertyType + ':' + #schoolTier + ':' + #locationZone + ':' + #generation")
    public Map<String, Object> getMarketAnalytics(String propertyType, String schoolTier, String locationZone, String generation) {
        if (propertyDataList.isEmpty()) {
            Map<String, Object> empty = new HashMap<>();
            empty.put("stats", emptySummary());
            empty.put("records", List.of());
            return empty;
        }

        String pt = normalizeFilter(propertyType);
        String st = normalizeFilter(schoolTier);
        String lz = normalizeFilter(locationZone);
        String gen = normalizeFilter(generation);

        List<Map<String, Object>> records = propertyDataList.stream()
                .map(this::toHousingRecord)
                .filter(r -> matchesFilter(pt, (String) r.get("property_type")))
                .filter(r -> matchesFilter(st, (String) r.get("school_tier")))
                .filter(r -> matchesFilter(lz, (String) r.get("location_zone")))
                .filter(r -> matchesFilter(gen, (String) r.get("generation")))
                .toList();

        Map<String, Object> response = new HashMap<>();
        response.put("stats", buildSummary(records));
        response.put("records", records);
        return response;
    }

    public Optional<PropertyData> findById(Long id) {
        if (id == null) return Optional.empty();
        return propertyDataList.stream().filter(p -> Objects.equals(p.getId(), id)).findFirst();
    }

    private String normalizeFilter(String value) {
        if (value == null || value.isBlank()) return "all";
        String normalized = value.trim().toLowerCase(Locale.ROOT);
        if ("suburban_outer".equals(normalized)) return "suburban_out";
        return normalized;
    }

    private boolean matchesFilter(String selected, String actual) {
        if ("all".equals(selected)) return true;
        if (actual == null) return false;
        return selected.equals(actual);
    }

    private Map<String, Object> toHousingRecord(PropertyData p) {
        Map<String, Object> r = new HashMap<>();
        r.put("id", p.getId());
        r.put("square_footage", p.getSquareFootage());
        r.put("bedrooms", p.getBedrooms());
        r.put("bathrooms", p.getBathrooms());
        r.put("year_built", p.getYearBuilt());
        r.put("lot_size", p.getLotSize());
        r.put("distance_to_city_center", p.getDistanceToCityCenter());
        r.put("school_rating", p.getSchoolRating());
        r.put("price", p.getPrice());

        r.put("property_type", classifyPropertyType(p));
        r.put("school_tier", classifySchoolTier(p));
        r.put("location_zone", classifyLocationZone(p));
        r.put("generation", classifyGeneration(p));
        return r;
    }

    private Map<String, Object> emptySummary() {
        Map<String, Object> summary = new HashMap<>();
        summary.put("record_count", 0);
        summary.put("avg_price", 0.0);
        summary.put("min_price", 0.0);
        summary.put("max_price", 0.0);
        summary.put("avg_price_per_sqft", 0.0);
        summary.put("generation_distribution", Map.of());
        summary.put("location_zone_avg_price_per_sqft", Map.of());
        return summary;
    }

    private Map<String, Object> buildSummary(List<Map<String, Object>> records) {
        Map<String, Object> summary = new HashMap<>();
        summary.put("record_count", records.size());

        if (records.isEmpty()) {
            summary.putAll(emptySummary());
            return summary;
        }

        DoubleSummaryStatistics priceStats = records.stream()
                .map(r -> r.get("price"))
                .filter(Objects::nonNull)
                .mapToDouble(v -> v instanceof Number ? ((Number) v).doubleValue() : 0.0)
                .summaryStatistics();

        double avgPricePerSqFt = records.stream()
                .filter(r -> r.get("price") instanceof Number && r.get("square_footage") instanceof Number)
                .mapToDouble(r -> ((Number) r.get("price")).doubleValue() / Math.max(((Number) r.get("square_footage")).doubleValue(), 1.0))
                .average()
                .orElse(0.0);

        Map<String, Integer> generationDist = new HashMap<>();
        Map<String, DoubleSummaryStatistics> zoneStats = new HashMap<>();

        for (Map<String, Object> r : records) {
            String generation = (String) r.get("generation");
            String zone = (String) r.get("location_zone");
            generationDist.put(generation, generationDist.getOrDefault(generation, 0) + 1);

            Object price = r.get("price");
            Object sqft = r.get("square_footage");
            if (price instanceof Number && sqft instanceof Number && ((Number) sqft).doubleValue() > 0) {
                double ppsf = ((Number) price).doubleValue() / ((Number) sqft).doubleValue();
                zoneStats.computeIfAbsent(zone, k -> new DoubleSummaryStatistics()).accept(ppsf);
            }
        }

        Map<String, Double> zoneAvg = new HashMap<>();
        for (Map.Entry<String, DoubleSummaryStatistics> e : zoneStats.entrySet()) {
            zoneAvg.put(e.getKey(), e.getValue().getAverage());
        }

        summary.put("avg_price", priceStats.getAverage());
        summary.put("min_price", priceStats.getMin());
        summary.put("max_price", priceStats.getMax());
        summary.put("avg_price_per_sqft", avgPricePerSqFt);
        summary.put("generation_distribution", generationDist);
        summary.put("location_zone_avg_price_per_sqft", zoneAvg);
        return summary;
    }

    private String classifyPropertyType(PropertyData p) {
        Double lotSize = p.getLotSize();
        Double squareFootage = p.getSquareFootage();

        if (lotSize == null || squareFootage == null) return "condo_apartment";
        if (lotSize > 2 * squareFootage && lotSize > 4000) return "single_family";
        if (lotSize <= 0 || lotSize < squareFootage) return "condo_apartment";
        return lotSize >= squareFootage ? "single_family" : "condo_apartment";
    }

    private String classifySchoolTier(PropertyData p) {
        Double rating = p.getSchoolRating();
        if (rating == null) return "base";
        if (rating < 5.0) return "base";
        if (rating < 8.0) return "good";
        return "elite";
    }

    private String classifyLocationZone(PropertyData p) {
        Double d = p.getDistanceToCityCenter();
        if (d == null) return "suburban_out";
        if (d <= 3.0) return "downtown";
        if (d <= 7.0) return "suburban_inner";
        return "suburban_out";
    }

    private String classifyGeneration(PropertyData p) {
        Integer year = p.getYearBuilt();
        if (year == null) return "legacy";
        if (year >= 2010) return "modern";
        if (year >= 1990) return "mature";
        return "legacy";
    }

    /**
     * 获取全量数据列表
     */
    public List<PropertyData> getAllData() {
        return propertyDataList;
    }
}
