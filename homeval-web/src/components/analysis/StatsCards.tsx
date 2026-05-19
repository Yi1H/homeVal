import { MarketSummary } from "@/types/analysis";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Home, DollarSign, Ruler } from "lucide-react";

interface StatsCardsProps {
  stats: MarketSummary;
  isLoading?: boolean;
}

export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  const cards = [
    {
      title: "平均价格",
      value: `$${stats.avg_price.toLocaleString()}`,
      description: "当前市场的房屋平均成交价",
      icon: DollarSign,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      title: "价格区间",
      value: `$${(stats.min_price / 1000).toFixed(0)}k - $${(stats.max_price / 1000).toFixed(0)}k`,
      description: "市场最低价与最高价范围",
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
    },
    {
      title: "平均单价",
      value: `$${stats.avg_price_per_sqft.toFixed(2)}`,
      description: "每平方英尺的平均价格",
      icon: Ruler,
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
    {
      title: "样本数量",
      value: stats.record_count.toLocaleString(),
      description: "当前筛选维度下的房源数量",
      icon: Home,
      color: "text-orange-600",
      bg: "bg-orange-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <div className={`${card.bg} p-2 rounded-lg`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "—" : card.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
