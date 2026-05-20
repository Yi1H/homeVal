import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error, mean_absolute_percentage_error
import joblib
import os
from utils import preprocess_features, FEATURE_COLS

def train_model():
    """
    重构后的训练脚本：使用统一的 utils.py 进行特征处理。
    """
    data_path = os.path.join(os.path.dirname(__file__), 'data', 'House Price Dataset.csv')
    df = pd.read_csv(data_path)

    X = preprocess_features(df)
    y = df['price']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    lr_model = LinearRegression()
    lr_model.fit(X_train_scaled, y_train)
    y_pred_lr = lr_model.predict(X_test_scaled)
    r2_lr = r2_score(y_test, y_pred_lr)
    mae_lr = mean_absolute_error(y_test, y_pred_lr)

    rf_model = RandomForestRegressor(n_estimators=100, random_state=42)
    rf_model.fit(X_train_scaled, y_train)
    y_pred_rf = rf_model.predict(X_test_scaled)
    r2_rf = r2_score(y_test, y_pred_rf)
    mae_rf = mean_absolute_error(y_test, y_pred_rf)

    print("\n--- 📊 模型对比结果 ---")
    print(f"线性回归: R2 = {r2_lr:.4f}, MAE = {mae_lr:.2f}")
    print(f"随机森林: R2 = {r2_rf:.4f}, MAE = {mae_rf:.2f}")

    best_model = rf_model if r2_rf > r2_lr else lr_model
    model_type = "Random Forest" if r2_rf > r2_lr else "Linear Regression"
    print(f"\n🏆 最终选择模型: {model_type}")

    model_dir = os.path.join(os.path.dirname(__file__), 'model')
    os.makedirs(model_dir, exist_ok=True)
    
    joblib.dump(best_model, os.path.join(model_dir, 'house_price_model.joblib'))
    joblib.dump(scaler, os.path.join(model_dir, 'scaler.joblib'))
    
    metrics = {
        "model_type": model_type,
        "r2": r2_rf if r2_rf > r2_lr else r2_lr,
        "mae": mae_rf if r2_rf > r2_lr else mae_lr,
        "mse": mean_squared_error(y_test, y_pred_rf if r2_rf > r2_lr else y_pred_lr),
        "mape": mean_absolute_percentage_error(y_test, y_pred_rf if r2_rf > r2_lr else y_pred_lr),
        "feature_names": FEATURE_COLS,
        "lr_coefficients": lr_model.coef_.tolist(),
        "lr_intercept": lr_model.intercept_,
        "feature_importances": rf_model.feature_importances_.tolist() if r2_rf > r2_lr else None
    }
    joblib.dump(metrics, os.path.join(model_dir, 'model_metrics.joblib'))
    print(f"💾 所有模型文件已更新")

if __name__ == "__main__":
    train_model()
