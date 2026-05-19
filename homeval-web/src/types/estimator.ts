export interface HousingFeatures {
  square_footage: number;
  bedrooms: number;
  bathrooms: number;
  year_built: number;
  lot_size: number;
  distance_to_city_center: number;
  school_rating: number;
}

export interface PredictionResult extends HousingFeatures {
  id: string;
  prediction: number;
  timestamp: number;
}

export interface ModelInfo {
  model_type: string;
  r2: number;
  mae: number;
  mape: number;
  feature_names: string[];
  lr_coefficients: Record<string, number>;
  lr_intercept: number;
  feature_importances: Record<string, number> | null;
}
