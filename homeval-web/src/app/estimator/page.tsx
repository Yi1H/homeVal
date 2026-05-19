import { EstimatorContainer } from "@/components/estimator/EstimatorContainer";
import { Metadata } from "next";

// --- 服务端元数据 (Server-side Metadata) ---
// 这部分代码只在服务端运行，对 SEO 友好
export const metadata: Metadata = {
  title: "属性价值估算器 | HomeVal",
  description: "使用先进的机器学习模型估算您的房产价值",
};

/**
 * EstimatorPage: 房产估值页面入口
 * 这是一个服务端组件 (Server Component)，默认由 Next.js 服务端渲染
 */
export default function EstimatorPage() {
  // 渲染 EstimatorContainer。
  // 注意：虽然 Page 是服务端组件，但它包含的 EstimatorContainer 是客户端组件 ("use client")。
  // 这种混合模式是 Next.js App Router 的核心推荐写法。
  return <EstimatorContainer />;
}
