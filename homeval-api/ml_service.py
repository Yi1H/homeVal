from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Union
import joblib
import os
import pandas as pd
import numpy as np
from utils import preprocess_features, FEATURE_COLS

app = FastAPI(
    title="房屋价格预测 API",
    description="这是一个基于机器学习模型的 API，采用标准化和特征工程优化，支持单条和批量预测。",
    version="1.1.1"
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'model', 'house_price_model.joblib')
SCALER_PATH = os.path.join(BASE_DIR, 'model', 'scaler.joblib')
METRICS_PATH = os.path.join(BASE_DIR, 'model', 'model_metrics.joblib')

try:
    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    metrics = joblib.load(METRICS_PATH)
except Exception as e:
    print(f"⚠️ 加载模型文件失败: {e}")
    model = None
    scaler = None
    metrics = None

class HousingFeatures(BaseModel):
    """输入特征模型"""
    square_footage: float = Field(..., gt=0, description="房屋面积 (平方英尺)", json_schema_extra={"example": 1550})
    bedrooms: int = Field(..., ge=1, le=10, description="卧室数量", json_schema_extra={"example": 3})
    bathrooms: float = Field(..., ge=0.0, le=10.0, description="浴室数量", json_schema_extra={"example": 2.0})
    year_built: int = Field(..., ge=1900, le=2026, description="建造年份", json_schema_extra={"example": 1997})
    lot_size: float = Field(..., gt=0, description="占地面积", json_schema_extra={"example": 6800})
    distance_to_city_center: float = Field(..., ge=0.0, le=100.0, description="距离市中心的距离 (英里)", json_schema_extra={"example": 4.1})
    school_rating: float = Field(..., ge=1.0, le=10.0, description="附近学校评分 (1-10)", json_schema_extra={"example": 7.6})

class PredictionResponse(BaseModel):
    """单条预测的返回格式"""
    prediction: float

class BatchPredictionResponse(BaseModel):
    """批量预测的返回格式"""
    predictions: List[float]

class ModelInfoResponse(BaseModel):
    """详细模型信息响应"""
    model_type: str
    r2: float
    mae: float
    mape: float
    feature_names: List[str]
    lr_coefficients: dict
    lr_intercept: float
    feature_importances: Union[dict, None]

@app.get("/health", summary="健康检查")
async def health():
    return {"status": "healthy", "model_loaded": model is not None, "scaler_loaded": scaler is not None}

@app.get("/model-info", response_model=ModelInfoResponse, summary="查看模型专业参数")
async def model_info():
    if not metrics:
        raise HTTPException(status_code=503, detail="模型数据未找到")
    
    lr_coef_dict = dict(zip(FEATURE_COLS, metrics['lr_coefficients']))
    
    fi_dict = None
    if metrics.get('feature_importances'):
        fi_dict = dict(zip(FEATURE_COLS, metrics['feature_importances']))
    
    return {
        "model_type": metrics['model_type'],
        "r2": metrics['r2'],
        "mae": metrics['mae'],
        "mape": metrics['mape'],
        "feature_names": FEATURE_COLS,
        "lr_coefficients": lr_coef_dict,
        "lr_intercept": metrics['lr_intercept'],
        "feature_importances": fi_dict
    }

@app.post("/predict", response_model=Union[PredictionResponse, BatchPredictionResponse], summary="执行预测")
async def predict(data: Union[HousingFeatures, List[HousingFeatures]]):
    if not model or not scaler:
        raise HTTPException(status_code=503, detail="模型或标准化器未就绪")
    
    try:
        input_list = data if isinstance(data, list) else [data]
        df = pd.DataFrame([item.model_dump() for item in input_list])
        
        df_processed = preprocess_features(df)
        
        X_scaled = scaler.transform(df_processed)
        
        predictions = model.predict(X_scaled)
        
        if isinstance(data, list):
            return {"predictions": predictions.tolist()}
        else:
            return {"prediction": float(predictions[0])}
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"预测过程出错: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
