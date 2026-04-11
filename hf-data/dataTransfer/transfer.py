from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent
INPUT_FILE = BASE_DIR / 'data.parquet'
OUTPUT_FILE = BASE_DIR / 'source.json'


def main():
    df = pd.read_parquet(INPUT_FILE)
    print(df.head())
    df.to_json(OUTPUT_FILE, orient='records', indent=4, force_ascii=False)
    print(f'转换完成: {OUTPUT_FILE}')


if __name__ == '__main__':
    main()
