import axios from "axios";
import { HousingFeatures, ModelInfo, PredictionResult } from "@/types/estimator";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window === "undefined" ? "http://127.0.0.1:8000" : "/api");

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const estimatorApi = {
  predict: async (data: HousingFeatures): Promise<PredictionResult> => {
    try {
      const response = await api.post("/predict", data);
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const detail =
          (error.response?.data as { detail?: string } | undefined)?.detail ||
          "无法获取估算结果，请稍后再试。";
        throw new Error(detail);
      }
      throw new Error("无法获取估算结果，请稍后再试。");
    }
  },
  
  getModelInfo: async (): Promise<ModelInfo> => {
    try {
      const response = await api.get("/model-info");
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw new Error("无法获取模型信息");
      }
      throw new Error("无法获取模型信息");
    }
  }
};
