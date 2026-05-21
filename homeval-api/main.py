from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from typing import List, Union
import httpx
import logging
import asyncio
import uuid
import time
import os
import pandas as pd

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="App 1 业务后端服务",
    description="该服务负责接收前端表单，进行严格校验，并与机器学习模型服务通信。",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ML_SERVICE_URL = os.getenv("ML_SERVICE_URL", "http://localhost:8001")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.getenv("MARKET_DATASET_PATH", os.path.join(BASE_DIR, "data", "House Price Dataset.csv"))

try:
    _df_market = pd.read_csv(DATASET_PATH)
    _df_market["id"] = _df_market["id"].astype(int)
    _market_by_id = _df_market.set_index("id").to_dict(orient="index")
except Exception as e:
    logger.error(f"加载市场数据集失败: {e}")
    _market_by_id = {}

class HousingFeatures(BaseModel):
    """
    接收前端表单的严格校验模型
    """
    square_footage: float = Field(..., gt=0, description="面积必须大于 0")
    bedrooms: int = Field(..., ge=1, le=10, description="卧室数量在 1-10 之间")
    bathrooms: float = Field(..., ge=0.5, le=10, description="浴室数量在 0.5-10 之间")
    year_built: int = Field(..., ge=1900, le=2026, description="建造年份在 1900-2026 之间")
    lot_size: float = Field(..., gt=0, description="占地面积必须大于 0")
    distance_to_city_center: float = Field(..., ge=0, description="距离不能为负数")
    school_rating: float = Field(..., ge=1, le=10, description="学校评分在 1-10 之间")

    @field_validator('year_built')
    @classmethod
    def validate_year(cls, v: int) -> int:
        if v > 2026:
            raise ValueError('建造年份不能晚于当前预测基准年 2026')
        return v


class CounterfactualRenovationRequest(BaseModel):
    base_record_id: int = Field(..., description="基准房源 ID")
    simulated_features: dict = Field(
        ...,
        description="仅允许覆盖 bedrooms/bathrooms/school_rating 三个可变特征",
    )

    @field_validator("simulated_features")
    @classmethod
    def validate_simulated_features(cls, v: dict) -> dict:
        allowed = {"bedrooms", "bathrooms", "school_rating"}
        unknown = set(v.keys()) - allowed
        if unknown:
            raise ValueError(f"simulated_features 不允许的字段: {sorted(list(unknown))}")
        return v

@app.get("/health")
async def health():
    """检查业务后端及下游 ML 服务的健康状态"""
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{ML_SERVICE_URL}/health", timeout=2.0)
            ml_status = resp.json() if resp.status_code == 200 else "unhealthy"
    except Exception:
        ml_status = "unreachable"
    
    return {
        "status": "healthy",
        "downstream_ml_service": ml_status
    }

@app.get("/model-info")
async def get_model_info():
    """转发获取模型信息的请求"""
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{ML_SERVICE_URL}/model-info", timeout=5.0)
            if resp.status_code != 200:
                raise HTTPException(status_code=resp.status_code, detail="下游模型服务返回错误")
            return resp.json()
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="下游模型服务响应超时")
    except Exception as e:
        logger.error(f"Error communicating with ML service: {e}")
        raise HTTPException(status_code=500, detail="业务后端通信异常")

@app.post("/predict")
async def predict_proxy(data: HousingFeatures):
    """
    核心预测代理路由
    1. 接收前端严格校验后的数据
    2. 向 Task 1 的 ML 模型服务发起通信
    3. 妥善处理超时与异常
    """
    logger.info(f"接收到预测请求: {data.model_dump()}")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{ML_SERVICE_URL}/predict",
                json=data.model_dump(),
                timeout=10.0
            )
            
            if response.status_code >= 500:
                logger.error(f"下游服务异常: {response.text}")
                raise HTTPException(status_code=502, detail="机器学习模型服务暂时不可用")
            elif response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=response.text)
            
            result = response.json()
            if isinstance(result, dict):
                result["id"] = str(uuid.uuid4())
                result["timestamp"] = int(time.time() * 1000)
            elif isinstance(result, list):
                for item in result:
                    item["id"] = str(uuid.uuid4())
                    item["timestamp"] = int(time.time() * 1000)
            
            return result
            
    except httpx.TimeoutException:
        logger.error("下游服务响应超时")
        raise HTTPException(status_code=504, detail="模型计算超时，请稍后重试")
    except httpx.RequestError as exc:
        logger.error(f"通信链路异常: {exc}")
        raise HTTPException(status_code=503, detail="无法连接到机器学习模型服务")
    except Exception as e:
        logger.error(f"未预期的错误: {e}")
        raise HTTPException(status_code=500, detail="系统内部错误")


@app.post("/counterfactual-renovation")
async def counterfactual_renovation(req: CounterfactualRenovationRequest):
    """
    反事实改造模拟接口（供 Java 导出 PDF/报告时调用）
    - 输入：base_record_id + simulated_features(三个可变特征)
    - 逻辑：用 base_record_id 从本地数据集还原其余“不可变事实特征”，拼装完整特征向量，然后调用 ML 服务 /predict
    - 输出：base_price / simulated_price / delta
    """
    base = _market_by_id.get(int(req.base_record_id))
    if not base:
        raise HTTPException(status_code=404, detail="找不到 base_record_id 对应的房源记录")

    full_features = {
        "square_footage": float(base["square_footage"]),
        "bedrooms": int(req.simulated_features.get("bedrooms", base["bedrooms"])),
        "bathrooms": float(req.simulated_features.get("bathrooms", base["bathrooms"])),
        "year_built": int(base["year_built"]),
        "lot_size": float(base["lot_size"]),
        "distance_to_city_center": float(base["distance_to_city_center"]),
        "school_rating": float(req.simulated_features.get("school_rating", base["school_rating"])),
    }

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(f"{ML_SERVICE_URL}/predict", json=full_features, timeout=10.0)
            if resp.status_code != 200:
                raise HTTPException(status_code=resp.status_code, detail=resp.text)
            predicted = resp.json().get("prediction", None)
            if predicted is None:
                raise HTTPException(status_code=502, detail="下游模型服务未返回 prediction")
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="模型计算超时，请稍后重试")
    except httpx.RequestError as exc:
        raise HTTPException(status_code=503, detail=f"无法连接到机器学习模型服务: {exc}")

    base_price = float(base["price"])
    simulated_price = float(predicted)
    delta = simulated_price - base_price

    return {
        "base_record_id": int(req.base_record_id),
        "base_price": base_price,
        "square_footage": float(base["square_footage"]),
        "simulated_price": simulated_price,
        "delta": delta,
        "base_features": {
            "square_footage": float(base["square_footage"]),
            "bedrooms": int(base["bedrooms"]),
            "bathrooms": float(base["bathrooms"]),
            "year_built": int(base["year_built"]),
            "lot_size": float(base["lot_size"]),
            "distance_to_city_center": float(base["distance_to_city_center"]),
            "school_rating": float(base["school_rating"]),
        },
        "simulated_features": full_features,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
