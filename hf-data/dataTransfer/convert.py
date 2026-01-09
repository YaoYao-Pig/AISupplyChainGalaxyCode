import json
import uuid
import time
from datetime import datetime, timezone

# ================= 配置区域 =================
INPUT_FILE = 'source.json'       # 你的源文件
OUTPUT_FILE = 'output_graph.json' # 输出文件
# ===========================================

def convert_timestamp_to_iso(timestamp_ms):
    """将毫秒时间戳转换为 ISO 8601"""
    if timestamp_ms is None:
        return None
    try:
        ts = float(timestamp_ms)
        dt = datetime.fromtimestamp(ts / 1000.0, tz=timezone.utc)
        return dt.strftime('%Y-%m-%dT%H:%M:%S.000Z')
    except (ValueError, TypeError):
        return None

def extract_license(tags):
    if not tags or not isinstance(tags, list):
        return ["None"]
    licenses = [t.split(":")[-1] for t in tags if isinstance(t, str) and t.startswith("license:")]
    return licenses if licenses else ["None"]

def extract_base_model(tags):
    """从标签中提取 base_model 信息"""
    if not tags or not isinstance(tags, list):
        return None
    for t in tags:
        # 标签格式通常是 base_model:author/model_name
        if isinstance(t, str) and t.startswith("base_model:"):
            return t.split(":", 1)[1]
    return None

def main():
    print(f"1. 正在读取文件: {INPUT_FILE} ...")
    
    try:
        with open(INPUT_FILE, 'r', encoding='utf-8') as f:
            source_data = json.load(f)
            if isinstance(source_data, dict):
                source_data = [source_data]
    except Exception as e:
        print(f"❌ 读取错误: {e}")
        return

    print(f"   找到 {len(source_data)} 条原始数据。")

    # --- 第一步：生成所有节点，并建立 "原始ID -> 新UUID" 的映射 ---
    # 我们需要这个映射来构建关系，因为关系需要知道目标节点的 UUID
    print("2. 正在转换节点...")
    
    nodes = []
    # 映射表: 原始的 model_id (如 meta-llama/Llama-3.2) -> 新生成的 UUID
    id_map = {} 
    
    # 临时存储每个节点引用的 base_model，用于第二步生成关系
    # 格式: { "当前节点的UUID": "基础模型的原始ID" }
    potential_relationships = []

    for record in source_data:
        original_id = record.get("id") # 例如 "meta-llama/Llama-3.2-3B"
        
        # 生成新的 UUID
        node_uuid = str(uuid.uuid4())
        
        # 记录映射
        if original_id:
            id_map[original_id] = node_uuid

        # 提取关键信息
        tags = record.get("tags", [])
        base_model_id = extract_base_model(tags)
        
        # 如果这个模型有 base_model，先记下来，等所有节点ID都生成好了再连线
        if base_model_id:
            potential_relationships.append({
                "source_uuid": node_uuid,
                "target_original_id": base_model_id,
                "type": "BASE_MODEL"
            })

        # 构建节点对象
        node = {
            "id": node_uuid,
            "labels": ["Model"],
            "properties": {
                "model_id": original_id,
                "author": record.get("author", "unknown"),
                "downloads": record.get("downloads", 0),
                "likes": record.get("likes", 0),
                "createdAt": convert_timestamp_to_iso(record.get("createdAt")),
                "lastModified": convert_timestamp_to_iso(record.get("lastModified")),
                "updated": time.time(),
                "tags": tags,
                # 注意：siblings 必须转为字符串
                "siblings": json.dumps(record.get("siblings", [])),
                "license": extract_license(tags),
                "visited": True
            }
        }
        nodes.append(node)

    print(f"   已生成 {len(nodes)} 个节点。")

    # --- 第二步：生成关系 ---
    print("3. 正在基于 base_model 标签生成关系...")
    
    relationships = []
    
    for rel_info in potential_relationships:
        source_uuid = rel_info["source_uuid"]
        target_original_id = rel_info["target_original_id"]
        
        # 关键：检查目标 Base Model 是否在我们的数据集中
        if target_original_id in id_map:
            target_uuid = id_map[target_original_id]
            
            # 创建关系对象
            relationship = {
                "id": str(uuid.uuid4()), # 关系的唯一ID
                "type": rel_info["type"],
                "start_node_id": source_uuid,
                "end_node_id": target_uuid,
                "properties": {}
            }
            relationships.append(relationship)
    
    # 如果你有额外的 MERGE 关系或其他来源，可以在这里手动添加
    # 比如从文件读取 relationships.json 并 extend 到 relationships 列表
    
    print(f"   已生成 {len(relationships)} 条关系 (仅限数据集中存在的连接)。")

    # --- 第三步：输出最终文件 ---
    final_output = {
        "nodes": nodes,
        "relationships": relationships
    }

    print(f"4. 正在写入: {OUTPUT_FILE} ...")
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(final_output, f, indent=4, ensure_ascii=False)
        
    print("🎉 转换完成！结构已包含 nodes 和 relationships。")

if __name__ == "__main__":
    main()