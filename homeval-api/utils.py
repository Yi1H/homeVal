import pandas as pd

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
    processed_df = df.copy()
    
    if 'year_built' in processed_df.columns:
        processed_df['house_age'] = 2026 - processed_df['year_built']
    
    missing_cols = [col for col in FEATURE_COLS if col not in processed_df.columns]
    if missing_cols:
        raise ValueError(f"缺少必要的特征列: {missing_cols}")
    
    return processed_df[FEATURE_COLS]
