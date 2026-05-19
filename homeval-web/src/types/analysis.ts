export interface FilterState {
  property_type: "all" | "single_family" | "condo_apartment";
  school_tier: "all" | "base" | "good" | "elite";
  location_zone: "all" | "downtown" | "suburban_inner" | "suburban_out";
  generation: "all" | "modern" | "mature" | "legacy";
}

export interface HousingRecord {
  id: number;
  square_footage: number;
  bedrooms: number;
  bathrooms: number;
  year_built: number;
  lot_size: number;
  distance_to_city_center: number;
  school_rating: number;
  price: number;
  property_type: "single_family" | "condo_apartment";
  school_tier: "base" | "good" | "elite";
  location_zone: "downtown" | "suburban_inner" | "suburban_out";
  generation: "modern" | "mature" | "legacy";
}

export interface MarketSummary {
  record_count: number;
  avg_price: number;
  min_price: number;
  max_price: number;
  avg_price_per_sqft: number;
  generation_distribution: Record<string, number>;
  location_zone_avg_price_per_sqft: Record<string, number>;
}

export interface MarketAnalyticsResponse {
  stats: MarketSummary;
  records: HousingRecord[];
}

export interface WhatIfRequest {
  base_record_id: number;
  simulated_features: {
    bedrooms: number;
    bathrooms: number;
    school_rating: number;
  };
}

export interface WhatIfResponse {
  base_record_id: number;
  base_price: number;
  square_footage: number;
  simulated_price: number;
}
