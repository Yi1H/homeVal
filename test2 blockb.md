## 🏗️ 一、 数据分类层：市场细分的算法标准（基于真实字段）

Java 后端（Spring Boot 3.4.4）需要利用你给出的这 **9 个真实字段**，在内网跑并行流（`parallelStream()`）或 SQL，聚合出以下 4 个黄金维度的细分市场标签供前端筛选：

### 1. 资产类型维度 (`property_type`)

- **独栋别墅 (`single_family`)**：满足 `lot_size > 2 * square_footage` 且 `lot_size > 4000`（独立屋具有明显大于建筑面积的独立地皮）。
- **高层/联排公寓 (`condo_apartment`)**：满足 `lot_size <= 0` 或 `lot_size < square_footage`（多户共享地皮，无独立院子）。

### 2. 教育资源维度 (`school_tier`)

- **普通学区 (`base`)**：`school_rating` $\in [1.0, 4.9]$
- **优质学区 (`good`)**：`school_rating` $\in [5.0, 7.9]$
- **顶级学区 (`elite`)**：`school_rating` $\in [8.0, 10.0]$

### 3. 区位跨度维度 (`location_zone`)

- **核心市区 (`downtown`)**：`distance_to_city_center` $\le 3.0$ 英里
- **中环近郊 (`suburban_inner`)**：`distance_to_city_center` $\in (3.0, 7.0]$ 英里
- **远郊大盘 (`suburban_outer`)**：`distance_to_city_center` $> 7.0$ 英里

### 4. 房屋老化代际 (`generation`)

- **次新房 (`modern`)**：`year_built` $\ge 2010$
- **成熟期房 (`mature`)**：`year_built` $\in [1990, 2009]$
- **老派历史房 (`legacy`)**：`year_built` $< 1990$

------

## 🎛️ 二、 前端复合筛选器状态契约（Next.js / TypeScript）

前端使用 Shadcn UI 组件（Tabs 与 Select 组合）控制状态。状态对象的类型定义与你的数据集强对齐：

TypeScript

```
// src/types/market.ts
export interface FilterState {
  property_type: 'all' | 'single_family' | 'condo_apartment';
  school_tier: 'all' | 'base' | 'good' | 'elite';
  location_zone: 'all' | 'downtown' | 'suburban_inner' | 'suburban_out';
  generation: 'all' | 'modern' | 'mature' | 'legacy';
}
```

当状态变动时，前端向 Java 发起带参数的 REST API 请求：

```
/api/v1/market/analytics?property_type=single_family&school_tier=elite
```

------

## 📊 三、 联动数据表与 0 延迟 CSV 导出（3.a.iv & v）

数据表绑定通过筛选器过滤后的 `HousingRecord` 数组：

TypeScript

```
export interface HousingRecord {
  id: number;
  square_footage: number;
  bedrooms: number;
  bathrooms: number;
  year_built: number;
  lot_size: number;
  distance_to_city_center: number;
  school_rating: number;
  price: number;
}
```

### ⚙️ 纯前端 CSV 导出（完美对齐你的真实列名）：

TypeScript

```
const exportToCSV = (data: HousingRecord[]) => {
  const headers = "id,square_footage,bedrooms,bathrooms,year_built,lot_size,distance_to_city_center,school_rating,price\n";
  const rows = data.map(r => 
    `${r.id},${r.square_footage},${r.bedrooms},${r.bathrooms},${r.year_built},${r.lot_size},${r.distance_to_city_center},${r.school_rating},${r.price}`
  ).join("\n");
  
  const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `market_analysis_report_${Date.now()}.csv`;
  link.click();
};
```

------

## 📈 四、 可视化图表与“假设分析”沙盒联动设计

### 1. 混合散点趋势图（Shadcn Charts / Recharts 承载）

- **横轴 (X-Axis)**：`square_footage`（房屋面积 / $sq ft$）。
- **纵轴 (Y-Axis)**：`price`（价格 / $\$$）。
- **背景点（灰色）**：当前细分市场大盘里所有真实房源的分布点，展示面积与价格的宏观线性关系。
- **高亮蓝点**：当前用户在数据表中选中的某一套真实“基准房”。
- **动态红点**：通过滑块蹂躏模型后，动态吐出的“反事实预测点”。

------

### 2. 假设分析控制台：完全基于真实模型特征的反事实模拟

我们不再凭空捏造字段，只从模型已有的 8 个特征（扣除 ID 和 Price）中，捞出**可以通过后期人为改造或社区变迁而发生位移的 3 个核心变量**做成控制滑块（Slider）：

Plaintext

```
【 假设分析控制台 (What-If Sandbox) 】
--------------------------------------------------------------------------
当前选中的对比基准房源: ID #13 (原始大盘价: $400,000)

1. 改造卧室数量 (bedrooms)
[-] -----------(● 4)----------- [+]  (范围: 1 - 5 整数)

2. 扩建浴室数量 (bathrooms)
[-] -------(● 3.0)------------- [+]  (范围: 1.0 - 4.0，步长 0.5)

3. 周边教育配套资源变动 (school_rating)
[-] -----------------(● 9.1)--- [+]  (范围: 1.0 - 10.0，步长 0.1)
```

### 🔄 全栈数据流闭环说明（供 AI 与前后端联调）

#### 🚀 步骤 1：前端拦截与防抖

用户在界面上把 ID #13 这套房（原本：`bedrooms=4`, `bathrooms=3`, `school_rating=9.1`）的学区滑块滑动到了 `7.0`（模拟周边学校质量下滑）。松开滑块 300ms 后触发防抖，Next.js 向 Java 发送请求：

JSON

```
{
  "base_record_id": 13,
  "simulated_features": {
    "bedrooms": 4,
    "bathrooms": 3.0,
    "school_rating": 7.0
  }
}
```

#### 🚀 步骤 2：Java 后端（Spring Boot 3.4.4）特征缝合

Java 收到请求，利用 `base_record_id: 13` 去内存缓存（Caffeine）中捞出该房源**其余不可变的物理事实字段**（`square_footage=2350`, `year_built=2012`, `lot_size=10200`, `distance_to_city_center=7.8`），然后用滑块传过来的新值进行覆盖重组，拼装成完整的特征向量：

Java

```
// Java 组合出的全字段实体，百分之百与任务 1 模型所需的入参字段顺序及类型对齐
public class ModelInputVector {
    private double square_footage = 2350.0;
    private int bedrooms = 4;
    private double bathrooms = 3.0; // 对应真实数据集中的浮点数（如1.5、2.5）
    private int year_built = 2012;
    private double lot_size = 10200.0;
    private double distance_to_city_center = 7.8;
    
    // 以下为被滑块篡改的特征
    private double school_rating = 7.0; 
}
```

Java 带着这个干净的、完全没有冗余字段的实体去 `POST` 任务 1 的机器学习容器。

#### 🚀 步骤 3：模型推理与图表重绘

1. 机器学习模型返回降低学区评级后的新预测价格（比如：`345000`）。
2. Java 将新价格返回给前端。
3. 前端图表组件接收到新坐标 `{ square_footage: 2350, price: 345000 }`。
4. **终极视觉**：图表上原本处于 $(2350, 400000)$ 的高亮蓝点正下方，瞬间冒出一个高亮的**红色模拟圆点** $(2350, 345000)$。两点垂直高度差达 $5.5$ 万美金，直观地向用户宣告：一旦学区降级，这套房子的价值会缩水多少。



还需要具有排序/筛选功能的响应式数据表