import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
INPUT_PARQUET = BASE_DIR / 'data.parquet'
OUTPUT_JSON = BASE_DIR / 'source.json'

# 1. 读取 Parquet 文件
df = pd.read_parquet(INPUT_PARQUET)

# 2. (可选) 查看前几行
print(df.head())

# 3. 转换为 JSON
# orient='records' 会生成对象列表 [{"col":val}, {"col":val}]，这是最通用的格式
# lines=False 生成一个大的 JSON 数组；lines=True 生成 NDJSON (每行一个 JSON 对象)
df.to_json(OUTPUT_JSON, orient='records', indent=4, force_ascii=False)

print("转换完成！")
