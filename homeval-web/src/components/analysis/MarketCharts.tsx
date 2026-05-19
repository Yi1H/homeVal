"use client";

import { HousingRecord, WhatIfResponse } from "@/types/analysis";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis
} from "recharts";

interface MarketChartsProps {
  records: HousingRecord[];
  selectedRecord: HousingRecord | null;
  whatIf: WhatIfResponse | null;
  full?: boolean;
}

/**
 * 市场图表组件：混合散点趋势图（面积 vs 价格）
 * - 灰点：当前筛选后的全部房源分布
 * - 蓝点：当前选中的“基准房源”
 * - 红点：What-if 的反事实预测点
 */
export function MarketCharts({ records, selectedRecord, whatIf, full }: MarketChartsProps) {
  const selectedData = selectedRecord
    ? [{ square_footage: selectedRecord.square_footage, price: selectedRecord.price, id: selectedRecord.id }]
    : [];

  const whatIfData =
    selectedRecord && whatIf
      ? [{ square_footage: selectedRecord.square_footage, price: whatIf.simulated_price, id: whatIf.base_record_id }]
      : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>面积-价格趋势散点图</CardTitle>
        <CardDescription>
          灰点为当前细分市场的真实房源分布，蓝点为选中的基准房源，红点为模拟预测结果。
        </CardDescription>
      </CardHeader>
      <CardContent className={full ? "h-[520px]" : "h-[380px]"}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 24, bottom: 20, left: 24 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              type="number"
              dataKey="square_footage"
              name="square_footage"
              tickFormatter={(v) => `${v}`}
              domain={["dataMin - 100", "dataMax + 100"]}
            />
            <YAxis
              type="number"
              dataKey="price"
              name="price"
              tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
              domain={["dataMin - 5000", "dataMax + 5000"]}
            />
            <ZAxis type="number" dataKey="id" range={[40, 40]} />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              formatter={(value: unknown, name: unknown) => {
                if (name === "price") return [`$${Number(value).toLocaleString()}`, "price"];
                return [String(value), String(name)];
              }}
            />

            <Scatter name="market" data={records} fill="#94a3b8" opacity={0.35} />
            <Scatter name="base" data={selectedData} fill="#2563eb" />
            <Scatter name="what-if" data={whatIfData} fill="#ef4444" />
          </ScatterChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
