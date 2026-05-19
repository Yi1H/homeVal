import pandas as pd

# 统一的特征列顺序，确保训练和推理时矩阵结构完全一致
# 类比前端：这就是项目的“数据字典”或常量定义
FEATURE_COLS = [
    'square_footage', 
    'bedrooms', 
    'bathrooms', 
    'lot_size', 
    'distance_to_city_center', 
    'school_rating', 
    'house_age'
]

def preprocess_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    统一的特征处理函数。
    无论是在训练（train.py）还是在推理（main.py），都必须经过这个函数的转换。
    
    作用：
    1. 特征转换：将 year_built 转换为 house_age。
    2. 字段过滤：只保留模型需要的特征。
    3. 强制排序：确保特征顺序符合模型预期。
    """
    # 深度拷贝一份数据，避免修改原始输入
    processed_df = df.copy()
    
    # 1. 特征工程：计算房龄 (假设基准年份为 2026)
    if 'year_built' in processed_df.columns:
        processed_df['house_age'] = 2026 - processed_df['year_built']
    
    # 2. 检查必要的列是否存在
    missing_cols = [col for col in FEATURE_COLS if col not in processed_df.columns]
    if missing_cols:
        raise ValueError(f"缺少必要的特征列: {missing_cols}")
    
    # 3. 强制返回指定顺序的特征子集
    return processed_df[FEATURE_COLS]
