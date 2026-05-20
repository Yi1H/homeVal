# HomeVal

HomeVal 是一套房产价值智能评估平台，包含前端门户、Python 业务后端与机器学习服务，以及 Java 市场分析服务，支持房产估值、市场筛选分析、What-if 推演与 PDF 报告导出。

## 模块结构

- `homeval-web`：Next.js Web 门户（默认 3000）
- `homeval-api`：Python FastAPI 业务后端（默认 8000）+ ML Service（默认 8001）
- `homeval-analysis`：Java Spring Boot 市场分析服务（默认 8080）
- `start.sh`：本地一键启动脚本（启动全套服务并输出访问地址）

## 环境依赖

- Node.js + npm
- Python 3
- Maven + JDK 17

## 本地一键启动

在项目根目录执行：

```bash
chmod +x ./start.sh
./start.sh
```

常用命令：

```bash
./start.sh status
./start.sh stop
FORCE=1 ./start.sh start
```

启动后默认访问地址：

- Web：`http://localhost:3000`
- API：`http://localhost:8000/health`
- ML Service：`http://localhost:8001/health`
- Analysis：`http://localhost:8080/api/v1/market/analytics`

日志目录：`./.logs/`

## 前端环境变量（可选）

前端默认会请求本机服务，如需指定后端地址可在 `homeval-web` 中设置：

- `NEXT_PUBLIC_API_URL`（默认 `http://localhost:8000`）
- `NEXT_PUBLIC_ANALYSIS_API_URL`（默认 `http://localhost:8080/api/v1/market`）

示例（在 `homeval-web/.env.local`）：

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_ANALYSIS_API_URL=http://localhost:8080/api/v1/market
```

## 部署提示（简版）

推荐将 Web/API/Analysis 仅监听在服务器本机（如 `127.0.0.1`），使用 Nginx 统一反向代理到同一域名下：

- `/` → `homeval-web`（3000）
- `/api/` → `homeval-api`（8000）
- `/analysis-api/` → `homeval-analysis`（8080）

## License

Private
