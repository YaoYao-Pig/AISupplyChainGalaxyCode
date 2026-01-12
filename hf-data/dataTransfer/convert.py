import json
import uuid
import time
from datetime import datetime, timezone

# ================= 配置区域 =================
INPUT_FILE = 'source.json'
OUTPUT_FILE = 'output_graph.json'
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

# ================= 核心修改：增强的关系提取函数 =================
def extract_relationships_detailed(tags):
    """
    从标签中提取基础模型及其具体关系类型。
    返回列表: [{'target_id': '...', 'type': 'FINETUNE'}, ...]
    """
    if not tags or not isinstance(tags, list):
        return []

    relationships = {} # 使用字典去重: { target_id: type }
    
    # 1. 预扫描全局标签 (上下文)
    is_global_merge = any(t.lower() in ['merge', 'mergekit'] for t in tags if isinstance(t, str))
    is_global_quantized = any(t.lower() in ['quantized', 'gguf', 'awq', 'gptq'] for t in tags if isinstance(t, str))

    for t in tags:
        if not isinstance(t, str) or not t.startswith("base_model:"):
            continue

        parts = t.split(":")
        
        # 逻辑 A: 显式结构 base_model:{type}:{id}
        # 例如: base_model:finetune:Author/Model
        if len(parts) >= 3 and parts[1] in ['finetune', 'adapter', 'merge', 'quantized']:
            rel_type = parts[1].upper() # 转大写: FINETUNE
            target_id = ":".join(parts[2:]) # 重新组合剩余部分作为ID
            
            # 存入字典，显式类型的优先级最高，直接覆盖
            relationships[target_id] = rel_type
            
        # 逻辑 B: 简写结构 base_model:{id}
        # 例如: base_model:Author/Model
        elif len(parts) >= 2:
            target_id = ":".join(parts[1:])
            
            # 确定默认类型
            current_type = "BASE_MODEL"
            if is_global_merge:
                current_type = "MERGE"
            elif is_global_quantized:
                current_type = "QUANTIZED"
            
            # 只有当该ID还没有被记录，或者之前记录的是普通的BASE_MODEL时，才更新
            # 这样避免覆盖掉上面逻辑A已经提取到的 "FINETUNE" 等更精确的信息
            if target_id not in relationships or relationships[target_id] == "BASE_MODEL":
                relationships[target_id] = current_type

    # 转换为列表返回
    return [{"target_original_id": k, "type": v} for k, v in relationships.items()]
# ==============================================================

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
    print("2. 正在转换节点...")
    
    nodes = []
    id_map = {} 
    potential_relationships = []

    for record in source_data:
        original_id = record.get("id")
        node_uuid = str(uuid.uuid4())
        
        if original_id:
            id_map[original_id] = node_uuid

        # --- 修复点：解析 cardData ---
        raw_card_data = record.get("cardData", "{}")
        card_data_obj = {}
        
        # 如果是字符串，尝试解析 JSON
        if isinstance(raw_card_data, str):
            try:
                card_data_obj = json.loads(raw_card_data)
            except json.JSONDecodeError:
                # 如果解析失败，说明数据格式有问题，保持为空字典
                card_data_obj = {}
        # 如果已经是字典（有些数据可能不同），直接使用
        elif isinstance(raw_card_data, dict):
            card_data_obj = raw_card_data
        
        # 此时 card_data_obj 必定是字典，安全获取 license
        license_name_val = card_data_obj.get("license", "None")
        # ---------------------------

        tags = record.get("tags", [])
        
        # 调用关系提取逻辑
        extracted_rels = extract_relationships_detailed(tags)
        
        for rel in extracted_rels:
            potential_relationships.append({
                "source_uuid": node_uuid,
                "target_original_id": rel["target_original_id"],
                "type": rel["type"]
            })

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
                "siblings": json.dumps(record.get("siblings", [])),
                "license": extract_license(tags),
                # 修复后这里使用解析好的变量
                "license_name": license_name_val, 
                "visited": True
            }
        }
        nodes.append(node)

    print(f"   已生成 {len(nodes)} 个节点。")

    print("3. 正在生成关系...")
    
    relationships = []
    
    for rel_info in potential_relationships:
        source_uuid = rel_info["source_uuid"]
        target_original_id = rel_info["target_original_id"]
        rel_type = rel_info["type"]
        
        if target_original_id in id_map:
            target_uuid = id_map[target_original_id]
            
            relationship = {
                "id": str(uuid.uuid4()),
                "type": rel_type,
                "start_node_id": source_uuid,
                "end_node_id": target_uuid,
                "properties": {}
            }
            relationships.append(relationship)
    
    print(f"   已生成 {len(relationships)} 条关系。")

    final_output = {
        "nodes": nodes,
        "relationships": relationships
    }

    print(f"4. 正在写入: {OUTPUT_FILE} ...")
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(final_output, f, indent=4, ensure_ascii=False)
        
    print("🎉 转换完成！")

    
if __name__ == "__main__":
    main()