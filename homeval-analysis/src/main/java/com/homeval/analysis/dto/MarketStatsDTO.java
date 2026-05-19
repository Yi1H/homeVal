package com.homeval.analysis.dto;

import java.util.Map;

/**
 * 市场统计 DTO：封装分析结果
 */
public class MarketStatsDTO {
    private Double averagePrice;
    private Double minPrice;
    private Double maxPrice;
    private Double averagePricePerSqFt;
    private Map<String, Long> ageDistribution;

    public MarketStatsDTO() {}

    public MarketStatsDTO(Double averagePrice, Double minPrice, Double maxPrice, Double averagePricePerSqFt, Map<String, Long> ageDistribution) {
        this.averagePrice = averagePrice;
        this.minPrice = minPrice;
        this.maxPrice = maxPrice;
        this.averagePricePerSqFt = averagePricePerSqFt;
        this.ageDistribution = ageDistribution;
    }

    // Getters 和 Setters
    public Double getAveragePrice() { return averagePrice; }
    public void setAveragePrice(Double averagePrice) { this.averagePrice = averagePrice; }
    public Double getMinPrice() { return minPrice; }
    public void setMinPrice(Double minPrice) { this.minPrice = minPrice; }
    public Double getMaxPrice() { return maxPrice; }
    public void setMaxPrice(Double maxPrice) { this.maxPrice = maxPrice; }
    public Double getAveragePricePerSqFt() { return averagePricePerSqFt; }
    public void setAveragePricePerSqFt(Double averagePricePerSqFt) { this.averagePricePerSqFt = averagePricePerSqFt; }
    public Map<String, Long> getAgeDistribution() { return ageDistribution; }
    public void setAgeDistribution(Map<String, Long> ageDistribution) { this.ageDistribution = ageDistribution; }

    // 替代 @Builder
    public static class Builder {
        private Double averagePrice;
        private Double minPrice;
        private Double maxPrice;
        private Double averagePricePerSqFt;
        private Map<String, Long> ageDistribution;

        public Builder averagePrice(Double v) { this.averagePrice = v; return this; }
        public Builder minPrice(Double v) { this.minPrice = v; return this; }
        public Builder maxPrice(Double v) { this.maxPrice = v; return this; }
        public Builder averagePricePerSqFt(Double v) { this.averagePricePerSqFt = v; return this; }
        public Builder ageDistribution(Map<String, Long> v) { this.ageDistribution = v; return this; }

        public MarketStatsDTO build() {
            return new MarketStatsDTO(averagePrice, minPrice, maxPrice, averagePricePerSqFt, ageDistribution);
        }
    }

    public static Builder builder() {
        return new Builder();
    }
}
