"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { analysisApi } from "@/lib/analysis-api";
import { Loader2, TrendingUp, Zap } from "lucide-react";
import { toast } from "sonner";
import { HousingRecord, WhatIfResponse } from "@/types/analysis";

export function WhatIfPanel({
  baseRecord,
  onSimulated,
  onInputChange,
}: {
  baseRecord: HousingRecord | null;
  onSimulated: (res: WhatIfResponse | null) => void;
  onInputChange?: (features: { bedrooms: number; bathrooms: number; school_rating: number }) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WhatIfResponse | null>(null);

  const [simulated, setSimulated] = useState(() => ({
    bedrooms: baseRecord?.bedrooms ?? 3,
    bathrooms: baseRecord?.bathrooms ?? 2,
    school_rating: baseRecord?.school_rating ?? 7,
  }));

  const onInputChangeRef = useRef(onInputChange);
  useEffect(() => {
    onInputChangeRef.current = onInputChange;
  }, [onInputChange]);

  useEffect(() => {
    onInputChangeRef.current?.(simulated);
  }, [simulated]);

  const updateSimulated = (patch: Partial<typeof simulated>) => {
    setSimulated((prev) => ({ ...prev, ...patch }));
  };

  const baseTitle = baseRecord ? `ID #${baseRecord.id}` : "未选择基准房源";
  const basePrice = baseRecord?.price ?? null;
  const simulatedPrice = result?.simulated_price ?? null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" /> 假设分析 (What-if)
        </CardTitle>
        <CardDescription>
          基准房源：{baseTitle}
          {basePrice != null ? `（原始价格：$${basePrice.toLocaleString()}）` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <Label>改造卧室数量 (bedrooms)</Label>
              <span>{simulated.bedrooms}</span>
            </div>
            <Slider
              min={1}
              max={5}
              step={1}
              value={[simulated.bedrooms]}
              onValueChange={(v) => updateSimulated({ bedrooms: Number(Array.isArray(v) ? v[0] : v) })}
              disabled={!baseRecord}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <Label>扩建浴室数量 (bathrooms)</Label>
              <span>{simulated.bathrooms.toFixed(1)}</span>
            </div>
            <Slider
              min={1}
              max={4}
              step={0.5}
              value={[simulated.bathrooms]}
              onValueChange={(v) => updateSimulated({ bathrooms: Number(Array.isArray(v) ? v[0] : v) })}
              disabled={!baseRecord}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <Label>周边教育配套 (school_rating)</Label>
              <span>{simulated.school_rating.toFixed(1)}</span>
            </div>
            <Slider
              min={1}
              max={10}
              step={0.1}
              value={[simulated.school_rating]}
              onValueChange={(v) =>
                updateSimulated({ school_rating: Number(Array.isArray(v) ? v[0] : v) })
              }
              disabled={!baseRecord}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-primary/10 pt-4">
          <div>
            <div className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
              模拟预测价值
            </div>
            <div className="text-2xl font-bold text-primary">
              {simulatedPrice != null ? `$${simulatedPrice.toLocaleString()}` : "—"}
            </div>
          </div>

          <Button
            disabled={!baseRecord || loading}
            onClick={async () => {
              if (!baseRecord) return;
              setLoading(true);
              try {
                const res = await analysisApi.whatIf({
                  base_record_id: baseRecord.id,
                  simulated_features: simulated,
                });
                setResult(res);
                onSimulated(res);
              } catch {
                toast.error("模拟计算失败，请确保 Java(8080)、Python(8000) 与 ML(8001) 服务正常运行");
                setResult(null);
                onSimulated(null);
              } finally {
                setLoading(false);
              }
            }}
          >
            运行模拟
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
