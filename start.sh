#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="${ROOT_DIR}/.homeval.pids"
LOG_DIR="${ROOT_DIR}/.logs"

require_cmd() {
  local name="$1"
  if ! command -v "${name}" >/dev/null 2>&1; then
    echo "缺少依赖命令：${name}"
    exit 1
  fi
}

port_pids() {
  local port="$1"
  lsof -nP -iTCP:"${port}" -sTCP:LISTEN -t 2>/dev/null || true
}

assert_ports_free() {
  local ports=("$@")
  local busy=0
  for p in "${ports[@]}"; do
    local pids
    pids="$(port_pids "${p}")"
    if [[ -n "${pids}" ]]; then
      busy=1
      echo "端口 ${p} 已被占用（PID: ${pids//$'\n'/, }）"
    fi
  done
  if [[ "${busy}" -eq 1 ]]; then
    echo ""
    echo "请先停止占用端口的进程，或使用：FORCE=1 ${0} start"
    exit 1
  fi
}

kill_ports_if_forced() {
  if [[ "${FORCE:-0}" != "1" ]]; then
    return 0
  fi
  for p in "$@"; do
    local pids
    pids="$(port_pids "${p}")"
    if [[ -n "${pids}" ]]; then
      echo "FORCE=1：停止占用端口 ${p} 的进程（PID: ${pids//$'\n'/, }）"
      kill ${pids} 2>/dev/null || true
    fi
  done
}

write_pid() {
  local name="$1"
  local pid="$2"
  echo "${name}=${pid}" >> "${PID_FILE}"
}

stop_all() {
  if [[ ! -f "${PID_FILE}" ]]; then
    echo "未找到 PID 文件：${PID_FILE}"
    return 0
  fi

  while IFS='=' read -r name pid; do
    if [[ -z "${pid}" ]]; then
      continue
    fi
    if kill -0 "${pid}" >/dev/null 2>&1; then
      echo "停止 ${name}（PID: ${pid}）"
      kill "${pid}" 2>/dev/null || true
    fi
  done < "${PID_FILE}"

  rm -f "${PID_FILE}"
}

status() {
  if [[ ! -f "${PID_FILE}" ]]; then
    echo "未启动（PID 文件不存在）"
    exit 0
  fi

  local all_ok=1
  while IFS='=' read -r name pid; do
    if [[ -z "${pid}" ]]; then
      continue
    fi
    if kill -0 "${pid}" >/dev/null 2>&1; then
      echo "${name}: running (PID: ${pid})"
    else
      echo "${name}: stopped (PID: ${pid})"
      all_ok=0
    fi
  done < "${PID_FILE}"

  if [[ "${all_ok}" -eq 1 ]]; then
    exit 0
  fi
  exit 1
}

start() {
  require_cmd lsof
  require_cmd python3
  require_cmd mvn
  require_cmd node
  require_cmd npm

  mkdir -p "${LOG_DIR}"

  local ports=(8001 8000 8080 3000)
  kill_ports_if_forced "${ports[@]}"
  assert_ports_free "${ports[@]}"

  rm -f "${PID_FILE}"

  echo "启动 ML 服务（8001）..."
  (
    cd "${ROOT_DIR}/homeval-api"
    exec python3 -m uvicorn ml_service:app --host 0.0.0.0 --port 8001
  ) > "${LOG_DIR}/ml_service.log" 2>&1 &
  write_pid "ml_service" "$!"

  echo "启动业务后端（8000）..."
  (
    cd "${ROOT_DIR}/homeval-api"
    exec python3 -m uvicorn main:app --host 0.0.0.0 --port 8000
  ) > "${LOG_DIR}/api.log" 2>&1 &
  write_pid "api" "$!"

  echo "启动 Java 分析服务（8080）..."
  (
    cd "${ROOT_DIR}/homeval-analysis"
    exec mvn -q spring-boot:run
  ) > "${LOG_DIR}/analysis.log" 2>&1 &
  write_pid "analysis" "$!"

  if [[ ! -d "${ROOT_DIR}/homeval-web/node_modules" ]]; then
    echo "检测到前端依赖未安装，执行 npm install..."
    (
      cd "${ROOT_DIR}/homeval-web"
      npm install
    ) > "${LOG_DIR}/web_install.log" 2>&1
  fi

  echo "启动前端（3000）..."
  (
    cd "${ROOT_DIR}/homeval-web"
    export NEXT_PUBLIC_API_URL="http://localhost:8000"
    export NEXT_PUBLIC_ANALYSIS_API_URL="http://localhost:8080/api/v1/market"
    exec npm run dev -- --port 3000
  ) > "${LOG_DIR}/web.log" 2>&1 &
  write_pid "web" "$!"

  echo ""
  echo "已启动："
  echo "- Web:        http://localhost:3000"
  echo "- Analysis:   http://localhost:8080/api/v1/market/analytics"
  echo "- API:        http://localhost:8000/health"
  echo "- ML Service: http://localhost:8001/health"
  echo ""
  echo "日志目录：${LOG_DIR}"
  echo "停止命令：${0} stop"

  trap 'echo ""; echo "收到退出信号，正在停止..."; stop_all' INT TERM

  while [[ -f "${PID_FILE}" ]]; do
    sleep 1
  done
}

cmd="${1:-start}"
case "${cmd}" in
  start) start ;;
  stop) stop_all ;;
  status) status ;;
  *)
    echo "用法：${0} [start|stop|status]"
    exit 1
    ;;
esac
