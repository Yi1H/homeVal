"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <div className="bg-white p-8 rounded-lg shadow-sm border border-red-100 text-center max-w-md">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="h-12 w-12 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">出错了！</h2>
        <p className="text-gray-600 mb-6">
          抱歉，加载页面时遇到了意外错误。
          <br />
          <span className="text-xs text-gray-400 font-mono mt-2 block">
            {error.message || "未知错误"}
          </span>
        </p>
        <button
          onClick={() => reset()}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
        >
          <RefreshCcw className="w-4 h-4 mr-2" />
          重试
        </button>
      </div>
    </div>
  );
}
