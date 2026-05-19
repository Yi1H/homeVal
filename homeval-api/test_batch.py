import pandas as pd
import requests
import json
import os

def test_api():
    """测试 API 的批量预测功能。"""
    # 加载测试数据
    test_data_path = os.path.join(os.path.dirname(__file__), 'data', 'Test Data For Prediction.csv')
    df = pd.read_csv(test_data_path)
    
    # 转换为字典列表格式
    batch_data = df.to_dict(orient='records')
    
    # API 地址
    url = "http://localhost:8000/predict"
    
    try:
        # 发送批量预测请求
        response = requests.post(url, json=batch_data)
        
        if response.status_code == 200:
            predictions = response.json()['predictions']
            df['predicted_price'] = predictions
            print("\n✅ 批量预测成功！全部结果如下：")
            # 使用 to_string() 可以强制打印所有行和列，而不被省略号截断
            print(df.to_string())
        else:
            print(f"错误: {response.status_code}")
            print(response.text)
            
    except requests.exceptions.ConnectionError:
        print("错误: API 服务器未运行。")

if __name__ == "__main__":
    test_api()
