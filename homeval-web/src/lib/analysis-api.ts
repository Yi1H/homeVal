import { FilterState, MarketAnalyticsResponse, WhatIfRequest, WhatIfResponse } from "@/types/analysis";

const ANALYSIS_API_URL_CLIENT =
  process.env.NEXT_PUBLIC_ANALYSIS_API_URL || "/analysis-api/api/v1/market";

const ANALYSIS_API_URL_SERVER =
  process.env.ANALYSIS_INTERNAL_URL || "http://127.0.0.1:8080/api/v1/market";

const ANALYSIS_API_URL =
  typeof window === "undefined" ? ANALYSIS_API_URL_SERVER : ANALYSIS_API_URL_CLIENT;

function toQueryString(filters: FilterState) {
  const params = new URLSearchParams();
  params.set("property_type", filters.property_type);
  params.set("school_tier", filters.school_tier);
  params.set("location_zone", filters.location_zone);
  params.set("generation", filters.generation);
  return params.toString();
}

export const analysisApi = {
  getAnalytics: async (filters: FilterState): Promise<MarketAnalyticsResponse> => {
    const query = toQueryString(filters);
    const response = await fetch(`${ANALYSIS_API_URL}/analytics?${query}`, { cache: "no-store" });
    if (!response.ok) throw new Error("无法获取市场分析数据");
    return response.json();
  },

  whatIf: async (payload: WhatIfRequest): Promise<WhatIfResponse> => {
    const response = await fetch(`${ANALYSIS_API_URL}/what-if`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error("无法获取模拟预测结果");
    return response.json();
  },

  exportReportPdf: async (payload: {
    filters: FilterState;
    base_record_id: number;
    simulated_features: { bedrooms: number; bathrooms: number; school_rating: number };
  }): Promise<Blob> => {
    const response = await fetch(`${ANALYSIS_API_URL}/report/pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error("无法导出 PDF 报告");
    return response.blob();
  },
};
