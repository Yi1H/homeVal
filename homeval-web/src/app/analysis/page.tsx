import { analysisApi } from "@/lib/analysis-api";
import { AnalysisDashboard } from "@/components/analysis/AnalysisDashboard";
import { FilterState } from "@/types/analysis";

export const dynamic = "force-dynamic";

export default async function AnalysisPage() {
  const defaultFilters: FilterState = {
    property_type: "all",
    school_tier: "all",
    location_zone: "all",
    generation: "all",
  };

  const initialAnalytics = await analysisApi.getAnalytics(defaultFilters).catch(() => ({
    stats: {
      record_count: 0,
      avg_price: 0,
      min_price: 0,
      max_price: 0,
      avg_price_per_sqft: 0,
      generation_distribution: {},
      location_zone_avg_price_per_sqft: {},
    },
    records: [],
  }));

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight">市场分析仪表盘</h1>
        <p className="text-muted-foreground mt-2">
          基于全量房产数据集的多维分析、假设分析及数据可视化。
        </p>
      </div>
      
      <AnalysisDashboard initialAnalytics={initialAnalytics} />
    </div>
  );
}
