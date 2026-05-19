import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Calculator,
  FileText,
  Sparkles,
  SlidersHorizontal,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <div className="bg-background">
      <section className="relative overflow-hidden flex min-h-[70vh] items-center sm:min-h-[75vh] lg:min-h-[80vh]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-[-180px] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute right-[-220px] top-[120px] h-[520px] w-[520px] rounded-full bg-indigo-500/15 blur-3xl" />
          <div className="absolute left-[-240px] top-[260px] h-[520px] w-[520px] rounded-full bg-emerald-500/10 blur-3xl" />
        </div>

        <div className="container w-full px-6 py-16 sm:py-20 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs text-muted-foreground shadow-sm backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              基于机器学习的房产估值与市场分析
            </div>

            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl">
              HomeVal 房产价值智能门户
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl">
              快速估值、批量对比、四维筛选与反事实改造推演，一站式把估值结果转化成可执行的决策。
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/estimator"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-11 px-6 shadow-sm"
                )}
              >
                立即估值
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
              <Link
                href="/analysis"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-11 px-6"
                )}
              >
                进入市场分析
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                毫秒级预测响应
              </div>
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                四维筛选视角
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                一键导出 PDF 报告
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container px-6 py-16 lg:px-8">
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
              三步完成一份可落地的估值分析
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              先用估算器得到基准，再进入市场分析筛选大盘，最后用 What-if 推演验证改造策略。
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/estimator"
                className={cn(buttonVariants({ size: "lg" }), "h-11 px-6")}
              >
                从估值开始
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
              <Link
                href="/analysis"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 px-6")}
              >
                查看市场分析
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>1. 输入参数</CardTitle>
                <CardDescription>面积、卧室/浴室、建造年份等关键变量</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>2. 拆分大盘</CardTitle>
                <CardDescription>按房型、学区、区位、代际筛选并查看样本</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>3. 改造推演与导出</CardTitle>
                <CardDescription>用 What-if 评估边际收益，生成 PDF 报告分享</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
