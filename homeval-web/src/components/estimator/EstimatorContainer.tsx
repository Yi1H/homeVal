"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ModelInfo, PredictionResult } from "@/types/estimator";
import { estimatorApi } from "@/lib/api";
import { 
  Calculator, 
  TrendingUp, 
  X, 
  ArrowUpDown, 
  Trash2, 
  Loader2,
  Home,
  Calendar,
  MapPin,
  Square
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Slider } from "@/components/ui/slider";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";

const schema = z.object({
  square_footage: z.number({ message: "请输入有效的数字" })
    .int("面积必须为整数")
    .min(100, "房屋面积至少需要 100 平方英尺")
    .max(20000, "房屋面积不能超过 20,000 平方英尺"),
  bedrooms: z.number({ message: "请输入有效的数字" })
    .int("卧室数量必须为整数")
    .min(1, "至少需要 1 间卧室")
    .max(10, "卧室数量不能超过 10 间"),
  bathrooms: z.number({ message: "请输入有效的数字" })
    .min(0.5, "至少需要 0.5 间浴室")
    .max(10, "浴室数量不能超过 10 间")
    .refine((n) => (n * 2) % 1 === 0, "浴室数量仅支持 0.5 的倍数 (如 1.5, 2.0)"),
  year_built: z.number({ message: "请输入有效的数字" })
    .int("年份必须为整数")
    .min(1900, "年份不能早于 1900 年")
    .max(new Date().getFullYear(), "年份不能晚于当前年份"),
  lot_size: z.number({ message: "请输入有效的数字" })
    .int("土地面积必须为整数")
    .min(100, "土地面积至少需要 100 平方英尺")
    .max(100000, "土地面积不能超过 100,000 平方英尺"),
  distance_to_city_center: z.number({ message: "请输入有效的数字" })
    .min(0, "距离不能为负数")
    .max(100, "距离城市中心不能超过 100 英里"),
  school_rating: z.number({ message: "请输入有效的数字" })
    .min(1, "评分至少为 1 分")
    .max(10, "评分最高为 10 分"),
});

export function EstimatorContainer() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState<PredictionResult | null>(null);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [isLoadingModelInfo, setIsLoadingModelInfo] = useState(true);
  const [history, setHistory] = useState<PredictionResult[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("homeval_history");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      square_footage: 1500,
      bedrooms: 3,
      bathrooms: 2,
      year_built: 2000,
      lot_size: 5000,
      distance_to_city_center: 5,
      school_rating: 7,
    },
  });

  useEffect(() => {
    localStorage.setItem("homeval_history", JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    let cancelled = false;
    estimatorApi
      .getModelInfo()
      .then((res) => {
        if (cancelled) return;
        setModelInfo(res);
      })
      .catch(() => {
        if (cancelled) return;
        toast.error("无法获取模型参数，请确保 Python(8000) 与 ML(8001) 服务正常运行");
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoadingModelInfo(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = async (data: z.infer<typeof schema>) => {
    setIsLoading(true);
    try {
      const result = await estimatorApi.predict(data);
      const fullResult = { ...data, ...result };
      setCurrentResult(fullResult);
      setHistory(prev => [fullResult, ...prev].slice(0, 10));
      toast.success("估算成功！");
    } catch (err) {
      const message = err instanceof Error ? err.message : "预测失败";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-7xl py-10 space-y-10">
      <div className="space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight">房产价值估算</h1>
        <p className="text-xl text-muted-foreground">直接输入参数，获取基于 ML 模型 实时估值。</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-stretch">
        {/* --- 输入表单 --- */}
        <Card className="lg:col-span-5 h-full shadow-lg border-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Calculator className="text-primary" /> 输入房产参数</CardTitle>
          </CardHeader>
          <CardContent className="h-full flex flex-col">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex h-full flex-col gap-6">
                <div className="grid grid-cols-2 gap-6">
                  <FormField control={form.control} name="square_footage" render={({ field }) => (
                    <FormItem>
                      <FormLabel>面积 (sq ft)</FormLabel>
                      <FormControl><Input type="number" placeholder="1500" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                      <FormDescription>房屋的总室内面积</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="year_built" render={({ field }) => (
                    <FormItem>
                      <FormLabel>建造年份</FormLabel>
                      <FormControl><Input type="number" placeholder="2000" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                      <FormDescription>房屋最初建成的年份</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="bedrooms" render={({ field }) => (
                    <FormItem>
                      <FormLabel>卧室数量</FormLabel>
                      <FormControl><Input type="number" placeholder="3" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                      <FormDescription>标准卧室的总数</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="bathrooms" render={({ field }) => (
                    <FormItem>
                      <FormLabel>浴室数量</FormLabel>
                      <FormControl><Input type="number" step="0.5" placeholder="2.5" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                      <FormDescription>支持 0.5 (半卫)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="lot_size" render={({ field }) => (
                    <FormItem>
                      <FormLabel>占地面积</FormLabel>
                      <FormControl><Input type="number" placeholder="5000" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                      <FormDescription>整块土地的总面积</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="distance_to_city_center" render={({ field }) => (
                    <FormItem>
                      <FormLabel>距市中心 (miles)</FormLabel>
                      <FormControl><Input type="number" step="0.1" placeholder="5.0" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                      <FormDescription>到最近市中心的直线距离</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="school_rating" render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between"><FormLabel>周边学校评分</FormLabel><span className="text-xs font-bold text-primary">{field.value}/10</span></div>
                    <FormControl><Slider min={1} max={10} step={0.5} value={[field.value]} onValueChange={v => field.onChange(Array.isArray(v) ? v[0] : v)} /></FormControl>
                    <FormDescription>基于当地公立学校的综合评分</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full h-12" disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin mr-2" /> : "计算价格"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* --- 单次结果展示 --- */}
        <div className="lg:col-span-7 space-y-6">
          {currentResult ? (
            <Card className="bg-primary/5 border-none shadow-inner overflow-hidden">
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2"><TrendingUp /> 估算结果</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-5xl font-black text-primary tracking-tighter">
                  {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(currentResult.prediction)}
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground"><Square className="h-4 w-4"/> {currentResult.square_footage} sq ft</div>
                  <div className="flex items-center gap-2 text-muted-foreground"><Home className="h-4 w-4"/> {currentResult.bedrooms}卧 / {currentResult.bathrooms}卫</div>
                  <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4"/> {currentResult.year_built}年</div>
                  <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4"/> {currentResult.distance_to_city_center} miles</div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="h-full min-h-[300px] flex items-center justify-center border-2 border-dashed rounded-xl bg-muted/30 text-muted-foreground">
              等待输入参数...
            </div>
          )}

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-medium">模型参数</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingModelInfo ? (
                <div className="text-sm text-muted-foreground">加载中...</div>
              ) : modelInfo ? (
                <>
                  <div className="rounded-md border overflow-x-auto">
                    <Table className="min-w-max">
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead>Field</TableHead>
                          <TableHead>字段</TableHead>
                          <TableHead className="text-right">Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>model_type</TableCell>
                          <TableCell>模型类型</TableCell>
                          <TableCell className="text-right">{modelInfo.model_type}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>r2</TableCell>
                          <TableCell>决定系数</TableCell>
                          <TableCell className="text-right">{Number(modelInfo.r2).toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>mae</TableCell>
                          <TableCell>平均绝对误差</TableCell>
                          <TableCell className="text-right">{Number(modelInfo.mae).toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>mape</TableCell>
                          <TableCell>平均绝对百分比误差</TableCell>
                          <TableCell className="text-right">{Number(modelInfo.mape).toFixed(2)}</TableCell>
                        </TableRow>
                        {modelInfo.feature_importances ? null : (
                          <TableRow>
                            <TableCell>lr_intercept</TableCell>
                            <TableCell>线性回归截距</TableCell>
                            <TableCell className="text-right">{Number(modelInfo.lr_intercept).toFixed(2)}</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {modelInfo.feature_importances ? (
                    <div className="rounded-md border overflow-x-auto">
                      <Table className="min-w-max">
                        <TableHeader className="bg-muted/50">
                          <TableRow>
                            <TableHead>Feature</TableHead>
                            <TableHead>特征</TableHead>
                            <TableHead className="text-right">Importance</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(modelInfo.feature_importances)
                            .sort((a, b) => b[1] - a[1])
                            .map(([feature, value]) => {
                              const zh: Record<string, string> = {
                                square_footage: "面积",
                                bedrooms: "卧室数量",
                                bathrooms: "浴室数量",
                                lot_size: "占地面积",
                                distance_to_city_center: "距市中心距离",
                                school_rating: "学校评分",
                                house_age: "房龄",
                              };
                              return (
                                <TableRow key={feature}>
                                  <TableCell>{feature}</TableCell>
                                  <TableCell>{zh[feature] || feature}</TableCell>
                                  <TableCell className="text-right">{Number(value).toFixed(2)}</TableCell>
                                </TableRow>
                              );
                            })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="rounded-md border overflow-x-auto">
                      <Table className="min-w-max">
                        <TableHeader className="bg-muted/50">
                          <TableRow>
                            <TableHead>Feature</TableHead>
                            <TableHead>特征</TableHead>
                            <TableHead className="text-right">Coefficient</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(modelInfo.lr_coefficients).map(([feature, value]) => {
                            const zh: Record<string, string> = {
                              square_footage: "面积",
                              bedrooms: "卧室数量",
                              bathrooms: "浴室数量",
                              lot_size: "占地面积",
                              distance_to_city_center: "距市中心距离",
                              school_rating: "学校评分",
                              house_age: "房龄",
                            };
                            return (
                              <TableRow key={feature}>
                                <TableCell>{feature}</TableCell>
                                <TableCell>{zh[feature] || feature}</TableCell>
                                <TableCell className="text-right">{Number(value).toFixed(2)}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-sm text-muted-foreground">暂无数据</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* --- 历史记录对比表格 --- */}
        {history.length > 0 && (
          <Card className="lg:col-span-12">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xl flex items-center gap-2"><ArrowUpDown className="h-5 w-5" /> 对比分析</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setHistory([])} className="text-destructive"><Trash2 className="h-4 w-4 mr-1" /> 清空</Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table className="min-w-max">
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>特征</TableHead>
                      {history.map((h, i) => (
                        <TableHead key={h.id}>
                          <div className="flex items-center justify-between">记录 #{history.length - i} <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => setHistory(history.filter(x => x.id !== h.id))} /></div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="bg-primary/5 font-bold">
                      <TableCell>预测价值</TableCell>
                      {history.map(h => <TableCell key={h.id} className="text-primary">${h.prediction.toLocaleString()}</TableCell>)}
                    </TableRow>
                    <TableRow><TableCell>面积</TableCell>{history.map(h => <TableCell key={h.id}>{h.square_footage}</TableCell>)}</TableRow>
                    <TableRow><TableCell>卧室/浴室</TableCell>{history.map(h => <TableCell key={h.id}>{h.bedrooms}/{h.bathrooms}</TableCell>)}</TableRow>
                    <TableRow><TableCell>学校评分</TableCell>{history.map(h => <TableCell key={h.id}>{h.school_rating}</TableCell>)}</TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
