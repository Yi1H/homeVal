"use client";

import { useEffect, useMemo, useState } from "react";
import { FilterState, HousingRecord, MarketAnalyticsResponse, WhatIfResponse } from "@/types/analysis";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileJson, FileText, CircleHelp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatsCards } from "./StatsCards";
import { MarketCharts } from "./MarketCharts";
import { MarketTable } from "./MarketTable";
import { WhatIfPanel } from "./WhatIfPanel";
import { exportMarketRecordsToCSV } from "@/lib/export-utils";
import { analysisApi } from "@/lib/analysis-api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface AnalysisDashboardProps {
  initialAnalytics: MarketAnalyticsResponse;
}

/**
 * 分析仪表盘组件：应用的“大脑”，负责集成统计卡片、图表、数据表和假设分析面板
 */
function InfoTip({ content }: { content: string }) {
  const [open, setOpen] = useState(false);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label="查看说明"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        <CircleHelp className="h-4 w-4" />
      </button>
      {open ? (
        <span className="absolute left-0 top-full z-50 mt-2 w-72 rounded-md border bg-background p-3 text-xs text-foreground shadow-md">
          {content}
        </span>
      ) : null}
    </span>
  );
}

export function AnalysisDashboard({ initialAnalytics }: AnalysisDashboardProps) {
  const propertyTypeLabel: Record<FilterState["property_type"], string> = {
    all: "全部",
    single_family: "独栋别墅",
    condo_apartment: "公寓/联排",
  };
  const schoolTierLabel: Record<FilterState["school_tier"], string> = {
    all: "全部",
    base: "普通",
    good: "优质",
    elite: "顶级",
  };
  const locationZoneLabel: Record<FilterState["location_zone"], string> = {
    all: "全部",
    downtown: "核心市区",
    suburban_inner: "中环近郊",
    suburban_out: "远郊",
  };
  const generationLabel: Record<FilterState["generation"], string> = {
    all: "全部",
    modern: "次新房",
    mature: "成熟期",
    legacy: "老派",
  };

  const defaultFilters: FilterState = {
    property_type: "all",
    school_tier: "all",
    location_zone: "all",
    generation: "all",
  };

  const [analytics, setAnalytics] = useState<MarketAnalyticsResponse>(initialAnalytics);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [selectedId, setSelectedId] = useState<number | null>(
    initialAnalytics.records.length ? initialAnalytics.records[0].id : null
  );
  const [whatIf, setWhatIf] = useState<WhatIfResponse | null>(null);
  const [simulatedInput, setSimulatedInput] = useState<{
    bedrooms: number;
    bathrooms: number;
    school_rating: number;
  }>(() => ({
    bedrooms: initialAnalytics.records[0]?.bedrooms ?? 3,
    bathrooms: initialAnalytics.records[0]?.bathrooms ?? 2,
    school_rating: initialAnalytics.records[0]?.school_rating ?? 7,
  }));
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  const updateFilters = (patch: Partial<FilterState>) => {
    setIsLoadingAnalytics(true);
    setFilters((prev) => ({ ...prev, ...patch }));
  };

  useEffect(() => {
    let cancelled = false;
    analysisApi
      .getAnalytics(filters)
      .then((res) => {
        if (cancelled) return;
        setAnalytics(res);
        setSelectedId(res.records.length ? res.records[0].id : null);
        setWhatIf(null);
      })
      .catch(() => {
        if (cancelled) return;
        toast.error("无法获取市场分析数据，请确保 Java(8080) 服务正常运行");
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoadingAnalytics(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filters]);

  const selectedRecord: HousingRecord | null = useMemo(() => {
    if (selectedId == null) return null;
    return analytics.records.find((r) => r.id === selectedId) || null;
  }, [analytics.records, selectedId]);

  return (
    <div className="space-y-8">
      <div id="analysis-export" className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="text-base font-semibold">大盘数据中心</div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                exportMarketRecordsToCSV(analytics.records, `market_analysis_report_${Date.now()}.csv`)
              }
            >
              <FileText className="mr-2 h-4 w-4" /> 导出 CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (!selectedRecord) {
                  toast.error("请先在右侧表格中选择一套基准房源");
                  return;
                }
                try {
                  const blob = await analysisApi.exportReportPdf({
                    filters,
                    base_record_id: selectedRecord.id,
                    simulated_features: simulatedInput,
                  });

                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `property_valuation_report_${Date.now()}.pdf`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                } catch {
                  toast.error("PDF 导出失败，请确保 Java(8080)、Python(8000) 与 ML(8001) 服务正常运行");
                }
              }}
            >
              <FileJson className="mr-2 h-4 w-4" /> 导出 PDF
            </Button>
          </div>
        </div>

             <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-medium">市场筛选</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                资产类型
                <InfoTip content="独栋别墅：lot_size > 2*square_footage 且 lot_size > 4000；公寓/联排：lot_size <= 0 或 lot_size < square_footage。" />
              </div>
              <Select
                value={filters.property_type}
                onValueChange={(v) => updateFilters({ property_type: v as FilterState["property_type"] })}
              >
                <SelectTrigger className="w-full min-w-52">
                  <SelectValue>{propertyTypeLabel[filters.property_type]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="single_family">独栋别墅</SelectItem>
                  <SelectItem value="condo_apartment">公寓/联排</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                学区分层
                <InfoTip content="普通：1.0-4.9；优质：5.0-7.9；顶级：8.0-10.0。" />
              </div>
              <Select
                value={filters.school_tier}
                onValueChange={(v) => updateFilters({ school_tier: v as FilterState["school_tier"] })}
              >
                <SelectTrigger className="w-full min-w-52">
                  <SelectValue>{schoolTierLabel[filters.school_tier]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="base">普通</SelectItem>
                  <SelectItem value="good">优质</SelectItem>
                  <SelectItem value="elite">顶级</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                区位跨度
                <InfoTip content="核心市区：<= 3.0 英里；中环近郊：(3.0, 7.0] 英里；远郊：> 7.0 英里。" />
              </div>
              <Select
                value={filters.location_zone}
                onValueChange={(v) => updateFilters({ location_zone: v as FilterState["location_zone"] })}
              >
                <SelectTrigger className="w-full min-w-52">
                  <SelectValue>{locationZoneLabel[filters.location_zone]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="downtown">核心市区</SelectItem>
                  <SelectItem value="suburban_inner">中环近郊</SelectItem>
                  <SelectItem value="suburban_out">远郊</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                房屋代际
                <InfoTip content="次新房：year_built >= 2010；成熟期：1990-2009；老派：< 1990。" />
              </div>
              <Select
                value={filters.generation}
                onValueChange={(v) => updateFilters({ generation: v as FilterState["generation"] })}
              >
                <SelectTrigger className="w-full min-w-52">
                  <SelectValue>{generationLabel[filters.generation]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="modern">次新房</SelectItem>
                  <SelectItem value="mature">成熟期</SelectItem>
                  <SelectItem value="legacy">老派</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <StatsCards stats={analytics.stats} isLoading={isLoadingAnalytics} />

      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[3fr_7fr] lg:items-start">
        <div className="space-y-3 lg:sticky lg:top-24">
          <div className="flex items-center justify-between">
            <div className="text-base font-semibold">单套房假设分析沙盒</div>
            <div className="text-xs text-muted-foreground">
              基准房源：{selectedRecord ? `#${selectedRecord.id}` : "未选择"}
            </div>
          </div>
          <WhatIfPanel
            key={selectedRecord?.id ?? "no-base"}
            baseRecord={selectedRecord}
            onSimulated={(res: WhatIfResponse | null) => setWhatIf(res)}
            onInputChange={(features) => setSimulatedInput(features)}
          />
        </div>

        <div className="space-y-6">
          <Tabs defaultValue="table" className="space-y-4">
            <TabsList className="grid w-full max-w-[360px] grid-cols-2">
              <TabsTrigger value="table">房产数据明细</TabsTrigger>
              <TabsTrigger value="chart">面积-价格趋势</TabsTrigger>
            </TabsList>

            <TabsContent value="table" className="space-y-4">
              <MarketTable
                data={analytics.records}
                selectedId={selectedId}
                onSelect={(id: number) => {
                  setSelectedId(id);
                  setWhatIf(null);
                }}
                bodyHeight={520}
              />
            </TabsContent>

            <TabsContent value="chart" className="space-y-4">
              <MarketCharts records={analytics.records} selectedRecord={selectedRecord} whatIf={whatIf} full />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
