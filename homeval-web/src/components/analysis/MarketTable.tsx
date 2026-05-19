"use client";

import { HousingRecord } from "@/types/analysis";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useMemo } from "react";
import { ArrowUpDown } from "lucide-react";

interface MarketTableProps {
  data: HousingRecord[];
  selectedId?: number | null;
  onSelect?: (id: number) => void;
  bodyHeight?: number;
}

/**
 * 市场明细表组件：提供数据的搜索、多列排序和分页展示功能
 */
export function MarketTable({ data, selectedId, onSelect, bodyHeight = 520 }: MarketTableProps) {
  type SortKey = "id" | "price" | "square_footage" | "bedrooms" | "bathrooms" | "year_built";
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: "asc" | "desc" } | null>(null);

  /**
   * 使用 useMemo 优化：仅当原始数据或排序配置变化时才重新计算
   */
  const sortedData = useMemo(() => {
    const result = [...data];

    // 执行列排序
    if (sortConfig) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [data, sortConfig]);

  /**
   * 处理排序点击
   */
  const requestSort = (key: SortKey) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>房产数据明细</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-auto" style={{ height: bodyHeight }}>
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-background">
              <TableRow>
                {/* 表头：支持点击排序 */}
                <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => requestSort('id')}>
                  ID <ArrowUpDown className="inline ml-1 h-3 w-3" />
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => requestSort('price')}>
                  价格 <ArrowUpDown className="inline ml-1 h-3 w-3" />
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => requestSort('square_footage')}>
                  面积 (sq ft) <ArrowUpDown className="inline ml-1 h-3 w-3" />
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => requestSort('bedrooms')}>
                  卧室 <ArrowUpDown className="inline ml-1 h-3 w-3" />
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => requestSort('bathrooms')}>
                  浴室 <ArrowUpDown className="inline ml-1 h-3 w-3" />
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => requestSort('year_built')}>
                  建造年份 <ArrowUpDown className="inline ml-1 h-3 w-3" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((item) => (
                <TableRow
                  key={item.id}
                  className={selectedId === item.id ? "bg-primary/5" : undefined}
                  onClick={() => onSelect?.(item.id)}
                >
                  <TableCell className="font-medium">#{item.id}</TableCell>
                  <TableCell className="font-bold text-primary">${item.price.toLocaleString()}</TableCell>
                  <TableCell>{item.square_footage}</TableCell>
                  <TableCell>{item.bedrooms}</TableCell>
                  <TableCell>{item.bathrooms}</TableCell>
                  <TableCell>{item.year_built}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
