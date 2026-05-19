package com.homeval.analysis.model;

import com.opencsv.bean.CsvBindByName;

/**
 * 房产数据实体类：对应 CSV 文件中的每一行记录
 */
public class PropertyData {
    @CsvBindByName(column = "id")
    private Long id;

    @CsvBindByName(column = "square_footage")
    private Double squareFootage;

    @CsvBindByName(column = "bedrooms")
    private Integer bedrooms;

    @CsvBindByName(column = "bathrooms")
    private Double bathrooms;

    @CsvBindByName(column = "year_built")
    private Integer yearBuilt;

    @CsvBindByName(column = "lot_size")
    private Double lotSize;

    @CsvBindByName(column = "distance_to_city_center")
    private Double distanceToCityCenter;

    @CsvBindByName(column = "school_rating")
    private Double schoolRating;

    @CsvBindByName(column = "price")
    private Double price;

    public PropertyData() {}

    public PropertyData(Long id, Double squareFootage, Integer bedrooms, Double bathrooms, Integer yearBuilt, Double lotSize, Double distanceToCityCenter, Double schoolRating, Double price) {
        this.id = id;
        this.squareFootage = squareFootage;
        this.bedrooms = bedrooms;
        this.bathrooms = bathrooms;
        this.yearBuilt = yearBuilt;
        this.lotSize = lotSize;
        this.distanceToCityCenter = distanceToCityCenter;
        this.schoolRating = schoolRating;
        this.price = price;
    }

    // 手动实现 Getters 和 Setters 以确保编译兼容性
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Double getSquareFootage() { return squareFootage; }
    public void setSquareFootage(Double squareFootage) { this.squareFootage = squareFootage; }
    public Integer getBedrooms() { return bedrooms; }
    public void setBedrooms(Integer bedrooms) { this.bedrooms = bedrooms; }
    public Double getBathrooms() { return bathrooms; }
    public void setBathrooms(Double bathrooms) { this.bathrooms = bathrooms; }
    public Integer getYearBuilt() { return yearBuilt; }
    public void setYearBuilt(Integer yearBuilt) { this.yearBuilt = yearBuilt; }
    public Double getLotSize() { return lotSize; }
    public void setLotSize(Double lotSize) { this.lotSize = lotSize; }
    public Double getDistanceToCityCenter() { return distanceToCityCenter; }
    public void setDistanceToCityCenter(Double distanceToCityCenter) { this.distanceToCityCenter = distanceToCityCenter; }
    public Double getSchoolRating() { return schoolRating; }
    public void setSchoolRating(Double schoolRating) { this.schoolRating = schoolRating; }
    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }
}
