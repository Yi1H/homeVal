import { EstimatorContainer } from "@/components/estimator/EstimatorContainer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "属性价值估算器 | HomeVal",
  description: "使用先进的机器学习模型估算您的房产价值",
};

export default function EstimatorPage() {
  return <EstimatorContainer />;
}
