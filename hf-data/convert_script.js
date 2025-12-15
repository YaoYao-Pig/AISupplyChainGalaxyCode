// convert_script_final_fixed.js

const createGraphNgraph = require('ngraph.graph');
const createLayout = require('ngraph.offline.layout');
const fs = require('fs-extra');
const path = require('path');
const cliProgress = require('cli-progress');
const JSONStream = require('JSONStream');
const through2 = require('through2');
// --- 配置项 ---
const INPUT_JSON_PATH = './hf_database_filtered.json';
const OUTPUT_DIR = './galaxy_output_data';
const GRAPH_NAME = 'my_model_galaxy';
const VERSION_NAME = 'v1_updated_links';
const LAYOUT_ITERATIONS = 20000;
const LOG_INTERVAL = 20000;
function safeString(val) {
    if (val === null || val === undefined) return "";
    if (Array.isArray(val)) {
        // 如果是数组，取第一个元素，如果为空则返回空串
        return val.length > 0 ? String(val[0]) : "";
    }
    return String(val); // 强制转换为字符串 (处理数字等情况)
}

// --- 2. 配置常量 ---
const LICENSE_NORMALIZATION_MAP = [
    { target: "None", sources: ["none", "unknown", "null", "undefined"] },
    { target: "llama3", sources: ["llama3", "llama-3", "llama-3-community-license"] },
    { target: "gemma", sources: ["gemma", "gemma-terms-of-use"] },
    { target: "apple-ascl", sources: ["apple-ascl", "apple-sample-code-license"] },
    { target: "mit", sources: ["mit", "mit-license"] }
];

const RISK_LISTS = {
    h_Mismatch: new Set(["apache-2.0", "None", "mit", "cc-by-nc-4.0", "cc-by-4.0", "cc-by-nc-sa-4.0", "cc-by-sa-4.0", "bsd-3-clause", "gpl-3.0", "unknown", "cc", "cc-by-nc-nd-4.0", "afl-3.0", "agpl-3.0", "cc0-1.0", "wtfpl", "cc-by-nc-2.0", "artistic-2.0", "unlicense", "cc-by-sa-3.0", "bsl-1.0", "gpl", "apple-ascl", "osl-3.0", "cc-by-nc-3.0", "cc-by-2.0", "gpl-2.0", "bsd", "ms-pl", "ecl-2.0", "bsd-3-clause-clear", "cc-by-3.0", "lgpl-3.0", "deepfloyd-if-license", "mpl-2.0", "pddl", "bsd-2-clause", "cc-by-nd-4.0", "cdla-permissive-2.0", "eupl-1.1", "cc-by-nc-sa-3.0", "etalab-2.0", "odc-by", "cc-by-2.5", "ofl-1.1", "odbl", "cc-by-nc-sa-2.0", "cdla-sharing-1.0", "lgpl-lr", "lgpl", "zlib"]),
    g_Source: new Set(["creativeml-openrail-m", "llama2", "cc-by-nc-4.0", "gemma", "llama3", "openrail++", "llama3.1", "llama3.2", "openrail", "bigcode-openrail-m", "cc-by-nc-3.0", "bigscience-bloom-rail-1.0", "llama3.3", "bigscience-openrail-m", "cc-by-nc-2.0", "deepfloyd-if-license", "c-uda"]),
    f_Source: new Set(["cc-by-nc-sa-4.0", "cc-by-sa-4.0", "gpl-3.0", "agpl-3.0", "cc-by-sa-3.0", "gpl", "osl-3.0", "gpl-2.0", "ms-pl", "lgpl-3.0", "mpl-2.0", "eupl-1.1", "cc-by-nc-sa-3.0", "odbl", "cc-by-nc-sa-2.0", "cdla-sharing-1.0", "lgpl-lr", "lgpl", "epl-2.0", "epl-1.0", "lgpl-2.1"]),
    e_Source: new Set(["cc-by-nc-nd-4.0", "cc-by-nd-4.0"]),
    d_Source: new Set(["cc-by-nc-4.0", "cc-by-4.0", "cc-by-nc-sa-4.0", "cc-by-sa-4.0", "cc", "cc-by-nc-2.0", "cc-by-sa-3.0", "cc-by-nc-3.0", "cc-by-2.0", "cc-by-3.0", "cc-by-nc-sa-3.0", "cc-by-2.5", "cc-by-nc-sa-2.0"]),
    d_ConflictTarget: new Set(["other", "creativeml-openrail-m", "llama2", "gemma", "llama3", "openrail++", "llama3.1", "llama3.2", "openrail", "bigcode-openrail-m", "bigscience-bloom-rail-1.0", "llama3.3", "agpl-3.0", "bigscience-openrail-m", "gpl", "apple-ascl", "osl-3.0", "gpl-2.0", "lgpl-3.0", "deepfloyd-if-license", "mpl-2.0", "pddl", "eupl-1.1", "odbl", "cdla-sharing-1.0", "lgpl-lr", "lgpl", "epl-2.0", "epl-1.0", "lgpl-2.1"]),
    c_Source: new Set(["gpl-3.0", "agpl-3.0", "gpl"]),
    c_ConflictParent: new Set(["other", "creativeml-openrail-m", "llama2", "cc-by-nc-4.0", "gemma", "llama3", "openrail++", "llama3.1", "llama3.2", "cc-by-nc-sa-4.0", "openrail", "bigcode-openrail-m", "bigscience-bloom-rail-1.0", "unknown", "cc", "cc-by-nc-nd-4.0", "llama3.3", "cc-by-nc-2.0", "cc-by-sa-3.0", "apple-ascl", "cc-by-nc-3.0", "cc-by-2.0", "deepfloyd-if-license", "pddl", "cc-by-nd-4.0", "cc-by-nc-sa-3.0", "etalab-2.0", "odc-by", "cc-by-2.5", "cc-by-nc-sa-2.0", "cdla-sharing-1.0", "lgpl-lr", "deepfloyd-if-license", "odbl", "osl-3.0", "ms-pl", "eupl-1.1", "afl-3.0"])
};

// --- 3. 分析函数 ---
function runComplianceAnalysis(graph, linkTypesArray) {
    console.log("🕵️ 开始合规性分析 (Safe Mode)...");

    const isPropagationEdge = (link) => {
        // 确保 linkTypesArray 存在
        if (!linkTypesArray || !linkTypesArray[link.data]) return false;
        const typeStr = linkTypesArray[link.data];
        return ["FINETUNE", "MERGE", "QUANTIZED", "ADAPTER"].includes(typeStr);
    };

    // 辅助：添加风险
    function addRisk(node, label, reason) {
        if (!node.data.compliance_risks) node.data.compliance_risks = [];
        if (!node.data.compliance_reasons) node.data.compliance_reasons = [];

        if (!node.data.compliance_risks.includes(label)) {
            node.data.compliance_risks.push(label);
            node.data.is_compliant = false;
        }
        const exists = node.data.compliance_reasons.some(r => r.type === label && r.reason === reason);
        if (!exists) {
            node.data.compliance_reasons.push({ type: label, reason: reason });
        }
    }

    // --- Step 1: Fix License & Init ---
    graph.forEachNode(node => {
        const data = node.data || {};
        
        // 安全处理数组字段 ["None"] -> "None"
        const rawLicense = safeString(data.license); 
        const licenseName = safeString(data.license_name).toLowerCase();

        let fixed = "None";
        let found = false;

        // 匹配规则
        for (const rule of LICENSE_NORMALIZATION_MAP) {
            if (rule.sources.includes(rawLicense) || rule.sources.includes(licenseName)) {
                fixed = rule.target;
                found = true;
                break;
            }
        }
        if (!found) {
            // 如果没匹配到，使用原始值 (处理 ["Apache 2.0"] 这种情况)
            fixed = rawLicense || "None";
        }
        
        data.fixed_license = fixed;
        data.compliance_risks = [];
        data.compliance_reasons = [];
        
        // 简单日期修复 (假设 createdAt 是字符串)
        if (data.createdAt && typeof data.createdAt === 'string' && data.createdAt !== "None") {
             data.createdDate = new Date(data.createdAt);
        }
    });

    // --- Step 2: h_Mismatch ---
    graph.forEachNode(node => {
        if (RISK_LISTS.h_Mismatch.has(node.data.fixed_license)) {
            addRisk(node, "h_Mismatch", `License '${node.data.fixed_license}' is in the mismatch list.`);
        }
    });

    // --- Step 3: Downstream Propagation Helper ---
    function propagateDownstream(sourceNodeId, riskLabel, reasonTemplate) {
        const queue = [sourceNodeId];
        const visited = new Set([sourceNodeId]);
        
        // 获取源节点 license，用于比较
        const sourceNode = graph.getNode(sourceNodeId);
        if(!sourceNode) return;
        const sourceLicense = sourceNode.data.fixed_license;

        while (queue.length > 0) {
            const currentId = queue.shift();
            const currentNode = graph.getNode(currentId);
            
            if (currentId !== sourceNodeId) {
                // 防止无限循环标记
                const currentRisks = currentNode.data.compliance_risks || [];
                if (!currentRisks.includes(riskLabel)) {
                    // 只有当 license 不同时才标记 (符合你的 SQL 逻辑: neighbor.fixed_license <> m.fixed_license)
                    // 但对于 ND (禁止演绎)，不管 license 是否相同都应该标记冲突
                    if (riskLabel === "e_Conflict_ND" || currentNode.data.fixed_license !== sourceLicense) {
                         addRisk(currentNode, riskLabel, reasonTemplate(sourceLicense, sourceNode.data.model_id || sourceNodeId));
                    }
                }
            }

            graph.forEachLinkedNode(currentId, (linkedNode, link) => {
                if (link.fromId === currentId && isPropagationEdge(link)) {
                    if (!visited.has(linkedNode.id)) {
                        visited.add(linkedNode.id);
                        queue.push(linkedNode.id);
                    }
                }
            });
        }
    }

    // --- Step 4: Execute Downstream Rules ---
    graph.forEachNode(node => {
        const fl = node.data.fixed_license;

        if (RISK_LISTS.g_Source.has(fl)) {
            propagateDownstream(node.id, "g_Copyleft_Terms", (srcLic, srcId) => 
                `Inherited restrictive terms from ancestor ${srcId} (${srcLic}).`);
        }
        if (RISK_LISTS.f_Source.has(fl)) {
            propagateDownstream(node.id, "f_Copyleft", (srcLic, srcId) => 
                `Inherited copyleft obligations from ancestor ${srcId} (${srcLic}).`);
        }
        if (RISK_LISTS.e_Source.has(fl)) {
             propagateDownstream(node.id, "e_Conflict_ND", (srcLic, srcId) => 
                `Derivative work prohibited by ancestor ${srcId} (${srcLic}).`);
        }
        
        // d_Conflict_CC (特殊逻辑: 只传播给 list2 中的目标)
        if (RISK_LISTS.d_Source.has(fl)) {
             const queue = [node.id];
             const visited = new Set([node.id]);
             while(queue.length > 0) {
                 const currId = queue.shift();
                 graph.forEachLinkedNode(currId, (linkedNode, link) => {
                     if (link.fromId === currId && isPropagationEdge(link) && !visited.has(linkedNode.id)) {
                         visited.add(linkedNode.id);
                         queue.push(linkedNode.id);
                         if (RISK_LISTS.d_ConflictTarget.has(linkedNode.data.fixed_license)) {
                             addRisk(linkedNode, "d_Conflict_CC", 
                                `CC License conflict: Ancestor ${safeString(node.data.model_id)} is ${fl}, but this node is ${linkedNode.data.fixed_license}.`);
                         }
                     }
                 });
             }
        }
    });

    // --- Step 5: Upstream Check (c_Conflict_FSF) ---
    graph.forEachNode(node => {
        if (RISK_LISTS.c_Source.has(node.data.fixed_license)) {
            let isConflict = false;
            let conflictParents = [];
            
            graph.forEachLinkedNode(node.id, (parentNode, link) => {
                if (link.toId === node.id && isPropagationEdge(link)) {
                    if (RISK_LISTS.c_ConflictParent.has(parentNode.data.fixed_license)) {
                        isConflict = true;
                        conflictParents.push(`${safeString(parentNode.data.model_id)}(${parentNode.data.fixed_license})`);
                    }
                }
            });

            if (isConflict) {
                addRisk(node, "c_Conflict_FSF", 
                    `FSF Conflict: GPL-like model derived from incompatible parent(s): ${conflictParents.join(', ')}.`);
                propagateDownstream(node.id, "c_Conflict_FSF", () => 
                    `Inherited FSF conflict from upstream ancestor ${safeString(node.data.model_id)}.`);
            }
        }
    });

    // --- Step 6: Lineage Analysis (Fix Crash Here) ---
    function analyzeLineage(modelKeyword, licenseKey, riskLabel) {
        const officialRoots = [];
        
        // 1. 找根节点 (安全检查)
        graph.forEachNode(node => {
            const data = node.data || {};
            // 修复点: 强制使用 safeString，防止 model_id 为空或 node.id 为数字时崩溃
            const modelIdStr = safeString(data.model_id); 
            
            if (modelIdStr && modelIdStr.includes(modelKeyword)) {
                officialRoots.push(node.id);
            }
        });

        // 2. 遍历合法后代
        const validLineageIds = new Set(officialRoots);
        const queue = [...officialRoots];
        
        while(queue.length > 0) {
            const u = queue.shift();
            graph.forEachLinkedNode(u, (v, link) => {
                if (link.fromId === u && isPropagationEdge(link)) {
                    if (!validLineageIds.has(v.id)) {
                        validLineageIds.add(v.id);
                        queue.push(v.id);
                    }
                }
            });
        }

        // 3. 检查冲突
        graph.forEachNode(node => {
            if (node.data.fixed_license === licenseKey) {
                let hasInvalidParent = false;
                let invalidParentId = null;
                
                graph.forEachLinkedNode(node.id, (parent, link) => {
                    if (link.toId === node.id && isPropagationEdge(link)) {
                        if (!validLineageIds.has(parent.id)) {
                            hasInvalidParent = true;
                            invalidParentId = safeString(parent.data.model_id) || parent.id;
                        }
                    }
                });

                if (hasInvalidParent) {
                    addRisk(node, riskLabel, 
                        `Unofficial Lineage: Has parent ${invalidParentId} not belonging to official ${modelKeyword} family.`);
                    propagateDownstream(node.id, riskLabel, () => 
                        `Inherited unofficial lineage risk from ${safeString(node.data.model_id)}.`);
                }
            }
        });
    }

    analyzeLineage("meta-llama/Llama-2-", "llama2", "b_Conflict_La2E");
    analyzeLineage("meta-llama/Meta-Llama-3-", "llama3", "a_Conflict_La3E");

    console.log("✅ 合规性分析完成。");
}

async function convertData() {

    const linkTypeMap = {}; // 用于映射类型字符串到数字ID
    const linkTypesArray = []; // 存储类型字符串本身，索引即ID
    let nextLinkTypeId = 0;
    const linkDataForSave = []; // 存储 [fromId, toId, typeId]

  let overallProgressBar = null;

  try {
    console.log(`🚀 开始转换数据，图谱名称: "${GRAPH_NAME}"`);

    const graph = createGraphNgraph();
    const displayLabels = [];
    const nodeOriginalIdToInternalIdMap = new Map();
    let internalIdCounter = 0;
    let nodesProcessed = 0;
    let relationshipsProcessed = 0;
    let fileSize = 0;

    try {
        const stats = await fs.stat(INPUT_JSON_PATH);
        fileSize = stats.size;
    } catch (e) {
        console.warn("⚠️ 无法获取文件大小用于进度条。");
    }

    overallProgressBar = new cliProgress.SingleBar({
        format: 'JSON 处理 |{bar}| {percentage}% || {value_MB}/{total_MB}MB ({status_msg})',
        barCompleteChar: '\u2588', barIncompleteChar: '\u2591', hideCursor: true
    });
    if (fileSize > 0) overallProgressBar.start(Math.round(fileSize/(1024*1024)), 0, { status_msg: "准备中..."});

    // === 阶段1: 处理节点 ===
    if (overallProgressBar) overallProgressBar.update(0, { status_msg: "处理节点..." });
    await new Promise((resolveNodePromise, rejectNodePromise) => {
        let nodeStreamBytesRead = 0;
        const nodesFileStream = fs.createReadStream(INPUT_JSON_PATH, { encoding: 'utf8' });
        nodesFileStream.on('data', chunk => {
            nodeStreamBytesRead += chunk.length;
            if (fileSize > 0 && overallProgressBar) {
                overallProgressBar.update(Math.round(nodeStreamBytesRead/(1024*1024)), {
                    value_MB: Math.round(nodeStreamBytesRead/(1024*1024)),
                    status_msg: `处理节点... (${nodesProcessed})`
                });
            }
        });
        const nodeProcessor = through2.obj(function (node, enc, callback) {
            try {
                if (!node || typeof node.id === 'undefined') { return callback(); }
                if (nodeOriginalIdToInternalIdMap.has(node.id)) { return callback(); }
                const currentInternalId = internalIdCounter++;
                nodeOriginalIdToInternalIdMap.set(node.id, currentInternalId);
                let label = node.properties?.model_id || node.id;
                displayLabels[currentInternalId] = label;
                graph.addNode(currentInternalId, {
                    originalId: node.id,
                    author: node.properties?.author,
                    license: node.properties?.license?.[0],
                    downloads: node.properties?.downloads,
                    likes: node.properties?.likes,
                    tags: node.properties?.tags,
                    createdAt: node.properties?.createdAt 
                });
                nodesProcessed++;
                if (nodesProcessed % LOG_INTERVAL === 0 && overallProgressBar) {
                    overallProgressBar.update(Math.round(nodeStreamBytesRead/(1024*1024)), { status_msg: `处理节点... (${nodesProcessed})` });
                }
            } catch (e) { console.error('\n❌ 处理单个节点时出错:', e); }
            callback();
        });
        nodesFileStream.pipe(JSONStream.parse('nodes.*')).pipe(nodeProcessor)
            .on('error', rejectNodePromise)
            .on('finish', resolveNodePromise);
        nodesFileStream.on('error', rejectNodePromise);
    }).catch(err => { if (overallProgressBar) overallProgressBar.stop(); throw err; });
    
    // === 阶段2: 处理关系 ===
    if (overallProgressBar) overallProgressBar.update(0, { status_msg: "处理关系..." });
    await new Promise((resolveRelPromise, rejectRelPromise) => {
        let relationshipStreamBytesRead = 0;
        const relationshipsFileStream = fs.createReadStream(INPUT_JSON_PATH, { encoding: 'utf8' });
        relationshipsFileStream.on('data', chunk => {
            relationshipStreamBytesRead += chunk.length;
            if (fileSize > 0 && overallProgressBar) {
                overallProgressBar.update(Math.round(relationshipStreamBytesRead/(1024*1024)), {
                    value_MB: Math.round(relationshipStreamBytesRead/(1024*1024)),
                    status_msg: `处理关系... (${relationshipsProcessed})`
                });
            }
        });
        const relationshipProcessor = through2.obj(function (rel, enc, callback) {
            try {
                if (!rel || typeof rel.start_node_id === 'undefined' || typeof rel.end_node_id === 'undefined') { return callback(); }
                const sourceInternalId = nodeOriginalIdToInternalIdMap.get(rel.start_node_id);
                const targetInternalId = nodeOriginalIdToInternalIdMap.get(rel.end_node_id);
                if (sourceInternalId === undefined || targetInternalId === undefined) { return callback(); }
                graph.addLink(sourceInternalId, targetInternalId, { type: rel.type });

                const edgeType = rel.type || 'UNKNOWN'; // 获取边的类型，提供默认值
                let typeId = linkTypeMap[edgeType];
                if (typeId === undefined) {
                    typeId = nextLinkTypeId++;
                    linkTypeMap[edgeType] = typeId;
                    linkTypesArray[typeId] = edgeType;
                }
                // 记录这条边的信息：源节点ID，目标节点ID，类型ID
                linkDataForSave.push(sourceInternalId, targetInternalId, typeId);



                relationshipsProcessed++;
                if (relationshipsProcessed % LOG_INTERVAL === 0 && overallProgressBar) {
                    overallProgressBar.update(Math.round(relationshipStreamBytesRead/(1024*1024)), { status_msg: `处理关系... (${relationshipsProcessed})` });
                }
            } catch (e) { console.error('\n❌ 处理单个关系时出错:', e); }
            callback();
        });
        relationshipsFileStream.pipe(JSONStream.parse('relationships.*')).pipe(relationshipProcessor)
            .on('error', rejectRelPromise)
            .on('finish', resolveRelPromise);
        relationshipsFileStream.on('error', rejectRelPromise);
    }).catch(err => { if (overallProgressBar) overallProgressBar.stop(); throw err; });

    if (overallProgressBar) overallProgressBar.stop();
    console.log(`\n✅ 图谱构建完成: ${graph.getNodesCount()} 个节点, ${graph.getLinksCount()} 条边。`);
    if (graph.getNodesCount() === 0) {
        console.error("❌ 图谱中没有节点，无法继续。");
        process.exit(1);
    }

    // === 布局计算 ===
    console.log(`🎨 正在计算3D布局 (迭代次数: ${LAYOUT_ITERATIONS})...`);
    const layout = createLayout(graph, {
      dimensions: 3, iterations: LAYOUT_ITERATIONS,
      gravity: -10000, springLength: 20000, springCoefficient: 0.0000001,
      theta: 0.8, dragCoefficient: 0.01
    });
    if (!layout || typeof layout.run !== 'function') throw new Error('布局对象创建失败或API不匹配。');
    console.log("⏳ 开始执行 layout.run()... 这可能需要较长时间。");
    layout.run();
    console.log('\n✅ 3D布局计算完成。');
    
    // --- 核心修正: 在所有文件保存之前，先定义好路径并创建目录 ---
    const versionSpecificPath = path.join(OUTPUT_DIR, GRAPH_NAME, VERSION_NAME);
    console.log(`📁 准备输出目录: ${versionSpecificPath}`);
    await fs.ensureDir(versionSpecificPath);
    console.log(`✅ 输出目录已确保/创建。`);


    runComplianceAnalysis(graph, linkTypesArray);

    // --- 现在开始按顺序保存所有文件 ---

    // 1. 保存 nodeData.json
    console.log(`💾 准备并保存 nodeData.json...`);
    const nodeDataForSave = [];
    graph.forEachNode(node => { nodeDataForSave[node.id] = node.data; });
    const nodeDataPath = path.join(versionSpecificPath, 'nodeData.json');
    await fs.writeJson(nodeDataPath, nodeDataForSave);
    console.log(`💾 Saved nodeData.json`);

    // 2. 保存 labels.json
    const labelsFilePath = path.join(versionSpecificPath, 'labels.json');
    await fs.writeJson(labelsFilePath, displayLabels, { spaces: 2 });
    console.log(`💾 Saved labels.json`);

    // 3. 保存 positions.bin
    const positionsArray = new Int32Array(graph.getNodesCount() * 3);
    const finalPositions = layout.getLayout();
    if (!finalPositions) throw new Error("无法从布局中获取节点位置。");
    for (let id = 0; id < graph.getNodesCount(); id++) {
        const pos = finalPositions[id];
        positionsArray[id * 3]     = Math.round(pos?.x || 0);
        positionsArray[id * 3 + 1] = Math.round(pos?.y || 0);
        positionsArray[id * 3 + 2] = Math.round(pos?.z || 0);
    }
    const positionsFilePath = path.join(versionSpecificPath, 'positions.bin');
    await fs.writeFile(positionsFilePath, Buffer.from(positionsArray.buffer));
    console.log(`💾 Saved positions.bin`);

    // 4. 保存 links.bin
    const linksDataArray = [];
    graph.forEachNode(node => {
      linksDataArray.push(-node.id - 1);
      graph.forEachLinkedNode(node.id, (linked) => linksDataArray.push(linked.id + 1), true);
    });
    const linksBuffer = new Int32Array(linksDataArray).buffer;
    const linksFilePath = path.join(versionSpecificPath, 'links.bin');
    await fs.writeFile(linksFilePath, Buffer.from(linksBuffer));
    console.log(`💾 Saved links.bin`);

// X. 保存 link_types.json (类型ID到类型字符串的映射)
const linkTypesPath = path.join(versionSpecificPath, 'link_types.json');
await fs.writeJson(linkTypesPath, linkTypesArray);
console.log(`💾 Saved link_types.json`);

// Y. 保存 link_data.bin (包含 [fromId, toId, typeId] 的扁平数组)
const linkDataBuffer = new Int32Array(linkDataForSave).buffer;
const linkDataPath = path.join(versionSpecificPath, 'link_data.bin');
await fs.writeFile(linkDataPath, Buffer.from(linkDataBuffer));
console.log(`💾 Saved link_data.bin`);


    // 5. 保存 manifest.json
    const manifestFilePath = path.join(OUTPUT_DIR, GRAPH_NAME, 'manifest.json');
    const manifestContent = { all: [VERSION_NAME], last: VERSION_NAME };
    await fs.writeJson(manifestFilePath, manifestContent, { spaces: 2 });
    console.log(`💾 Saved manifest.json`);

const nodeComplianceData = {};
let riskCount = 0;

graph.forEachNode(node => {
    // 只有当存在风险时才保存，节省文件体积
    if (node.data.compliance_risks && node.data.compliance_risks.length > 0) {
        
        // ✅ 修正点：直接使用 node.id。
        // 因为你的 graph 节点 ID 已经是用于二进制数组索引的数字 ID 了。
        // 前端拿到这个 ID 可以直接对应到 positions.bin 里的位置。
        const id = node.id; 

        nodeComplianceData[id] = {
            risks: node.data.compliance_risks,
            reasons: node.data.compliance_reasons,
            fixed_license: node.data.fixed_license,
            // 调试用：如果你想确认它是哪个原始模型，可以把原始 ID 也带上（可选）
            // original_id: node.data.id 
        };
        riskCount++;
    }
});

console.log(`📊 发现风险节点数量: ${riskCount}`);
const compliancePath = path.join(versionSpecificPath, 'compliance_data.json');
await fs.writeJson(compliancePath, nodeComplianceData);
console.log(`💾 Saved compliance_data.json`);

    console.log('\n🎉 --- 数据转换全部完成! --- 🎉');

    




  } catch (error) {
    if (overallProgressBar && typeof overallProgressBar.stop === 'function' && overallProgressBar.isActive) {
        overallProgressBar.stop();
    }
    console.error('❌ 处理过程中发生致命错误:', error);
    process.exit(1);
  }
}

convertData();