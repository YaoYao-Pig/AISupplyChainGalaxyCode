// convert_script_final_fixed_v4.js

const createGraphNgraph = require('ngraph.graph');
const createLayout = require('ngraph.offline.layout');
const fs = require('fs-extra');
const path = require('path');
const cliProgress = require('cli-progress');
const JSONStream = require('JSONStream');
const through2 = require('through2');

// --- 1. 基础配置项 ---
const INPUT_JSON_PATH = './output_graph_filtered.json';
const OUTPUT_DIR = './galaxy_output_data';
const GRAPH_NAME = 'my_model_galaxy';
const VERSION_NAME = 'v1_updated_links';
const LAYOUT_ITERATIONS = 19005;
const LOG_INTERVAL = 20000;

// --- 2. 辅助函数 ---
function safeString(val) {
    if (val === null || val === undefined) return "None";
    if (Array.isArray(val)) {
        return val.length > 0 ? String(val[0]) : "None";
    }
    return String(val);
}

// 辅助：判断是否在数组中
function isIn(val, list) {
    if (!val) return false;
    return list.includes(val);
}

// --- 3. 业务规则常量 ---

const RISK_LISTS = {
    // h_Mismatch: 包含所有非 Llama 官方许可的通用协议
    // 只有在模型是 Llama 系列时，这些协议才会被标记为 Warning
    h_Mismatch: new Set(["apache-2.0", "None", "mit", "cc-by-nc-4.0", "cc-by-4.0", "cc-by-nc-sa-4.0", "cc-by-sa-4.0", "bsd-3-clause", "gpl-3.0", "unknown", "cc", "cc-by-nc-nd-4.0", "afl-3.0", "agpl-3.0", "cc0-1.0", "wtfpl", "cc-by-nc-2.0", "artistic-2.0", "unlicense", "cc-by-sa-3.0", "bsl-1.0", "gpl", "apple-ascl", "osl-3.0", "cc-by-nc-3.0", "cc-by-2.0", "gpl-2.0", "bsd", "ms-pl", "ecl-2.0", "bsd-3-clause-clear", "cc-by-3.0", "lgpl-3.0", "deepfloyd-if-license", "mpl-2.0", "pddl", "bsd-2-clause", "cc-by-nd-4.0", "cdla-permissive-2.0", "eupl-1.1", "cc-by-nc-sa-3.0", "etalab-2.0", "odc-by", "cc-by-2.5", "ofl-1.1", "odbl", "cc-by-nc-sa-2.0", "cdla-sharing-1.0", "lgpl-lr", "lgpl", "zlib"]),

    // g_Copyleft_Terms
    g_Source: new Set(["creativeml-openrail-m", "llama2", "cc-by-nc-4.0", "gemma", "llama3", "openrail++", "llama3.1", "llama3.2", "openrail", "bigcode-openrail-m", "cc-by-nc-3.0", "bigscience-bloom-rail-1.0", "llama3.3", "bigscience-openrail-m", "cc-by-nc-2.0", "deepfloyd-if-license", "c-uda"]),
    
    // f_Copyleft
    f_Source: new Set(["cc-by-nc-sa-4.0", "cc-by-sa-4.0", "gpl-3.0", "agpl-3.0", "cc-by-sa-3.0", "gpl", "osl-3.0", "gpl-2.0", "ms-pl", "lgpl-3.0", "mpl-2.0", "eupl-1.1", "cc-by-nc-sa-3.0", "odbl", "cc-by-nc-sa-2.0", "cdla-sharing-1.0", "lgpl-lr", "lgpl", "epl-2.0", "epl-1.0", "lgpl-2.1"]),

    // e_Conflict_ND
    e_Source: new Set(["cc-by-nc-nd-4.0", "cc-by-nd-4.0"]),

    // d_Conflict_CC
    d_Source: new Set(["cc-by-nc-4.0", "cc-by-4.0", "cc-by-nc-sa-4.0", "cc-by-sa-4.0", "cc", "cc-by-nc-2.0", "cc-by-sa-3.0", "cc-by-nc-3.0", "cc-by-2.0", "cc-by-3.0", "cc-by-nc-sa-3.0", "cc-by-2.5", "cc-by-nc-sa-2.0"]),
    d_ConflictTarget: new Set(["other", "creativeml-openrail-m", "llama2", "gemma", "llama3", "openrail++", "llama3.1", "llama3.2", "openrail", "bigcode-openrail-m", "bigscience-bloom-rail-1.0", "llama3.3", "agpl-3.0", "bigscience-openrail-m", "gpl", "apple-ascl", "osl-3.0", "gpl-2.0", "lgpl-3.0", "deepfloyd-if-license", "mpl-2.0", "pddl", "eupl-1.1", "odbl", "cdla-sharing-1.0", "lgpl-lr", "lgpl", "epl-2.0", "epl-1.0", "lgpl-2.1"]),

    // c_Conflict_FSF
    c_Source: new Set(["gpl-3.0", "agpl-3.0", "gpl"]),
    c_ConflictParent: new Set(["other", "creativeml-openrail-m", "llama2", "cc-by-nc-4.0", "gemma", "llama3", "openrail++", "llama3.1", "llama3.2", "cc-by-nc-sa-4.0", "openrail", "bigcode-openrail-m", "bigscience-bloom-rail-1.0", "unknown", "cc", "cc-by-nc-nd-4.0", "llama3.3", "cc-by-nc-2.0", "cc-by-sa-3.0", "apple-ascl", "cc-by-nc-3.0", "cc-by-2.0", "deepfloyd-if-license", "pddl", "cc-by-nd-4.0", "cc-by-nc-sa-3.0", "etalab-2.0", "odc-by", "cc-by-2.5", "cc-by-nc-sa-2.0", "cdla-sharing-1.0", "lgpl-lr", "deepfloyd-if-license", "odbl", "osl-3.0", "ms-pl", "eupl-1.1", "afl-3.0"])
};

// 风险等级: Mismatch 为 Warning，其他为 Error
const RISK_LEVELS = {
    h_Mismatch: 'Warning',       
    g_Copyleft_Terms: 'Error',
    f_Copyleft: 'Error',
    e_Conflict_ND: 'Error',
    d_Conflict_CC: 'Error',
    c_Conflict_FSF: 'Error',
    b_Conflict_La2E: 'Error',
    a_Conflict_La3E: 'Error',
    g_Source: 'Error' 
};

// --- 4. 合规性分析核心函数 ---
function runComplianceAnalysis(graph) {
    console.log("🕵️ 开始合规性分析 (Fix Edges & Mismatch Logic)...");

    // [关键修复] 直接从边对象中读取 type 字符串，不再依赖 ID 映射
    const isPropagationEdge = (link) => {
        const typeStr = link.data ? link.data.type : null;
        if (!typeStr) return false;
        return ["FINETUNE", "MERGE", "QUANTIZED", "ADAPTER"].includes(typeStr);
    };

    function addRisk(node, type, reason) {
        if (!node.data.compliance) {
            node.data.compliance = { risks: [], status: 'compliant' };
        }
        const level = RISK_LEVELS[type] || 'Warning'; 
        
        const exists = node.data.compliance.risks.some(r => r.type === type && r.reason === reason);
        if (!exists) {
            node.data.compliance.risks.push({ type, level, reason });
        }
        
        // Error > Warning > Compliant
        if (level === 'Error') {
            node.data.compliance.status = 'error';
        } else if (level === 'Warning' && node.data.compliance.status !== 'error') {
            node.data.compliance.status = 'warning';
        }
    }

    // --- Step 1: 严格归一化 ---
    graph.forEachNode(node => {
        const data = node.data || {};
        const rawLicense = safeString(data.license); 
        const rawName = safeString(data.license_name);
        
        let fixed = null;

        if (!rawLicense || rawLicense === "null" || rawLicense === "undefined") {
            fixed = "None";
        }
        else if (isIn(rawLicense, ["None", "other"]) && isIn(rawName, ["llama3", "llama-3", "llama-3-community-license"])) {
            fixed = "llama3";
        }
        else if (isIn(rawLicense, ["None", "other"]) && isIn(rawName, ["gemma", "gemma-terms-of-use"])) {
            fixed = "gemma";
        }
        else if (isIn(rawLicense, ["None", "other"]) && isIn(rawName, ["apple-ascl", "apple-sample-code-license"])) {
            fixed = "apple-ascl";
        }
        else if (isIn(rawLicense, ["None", "other"]) && isIn(rawName, ["mit", "mit-license"])) {
            fixed = "mit";
        }
        else if (isIn(rawLicense, ["None", "unknown"])) {
            fixed = "None";
        }
        else {
            fixed = rawLicense; 
        }
        
        node.data.fixed_license = fixed;
        node.data.compliance = { risks: [], status: 'compliant' };
    });

    // --- Step 2: h_Mismatch (Warning) ---
    graph.forEachNode(node => {
        const fl = node.data.fixed_license;
        if (RISK_LISTS.h_Mismatch.has(fl)) {
            const modelId = safeString(node.data.model_id).toLowerCase();
            const isLlama = modelId.includes("llama");
            const isInvalidData = ["None", "unknown", "null", "undefined", "other"].includes(fl);

            // 1. 无效数据 -> 任何模型都报 Warning
            if (isInvalidData) {
                 addRisk(node, "h_Mismatch", `License information is missing or unknown ('${fl}').`);
            }
            // 2. Llama 模型使用了通用协议 -> 报 Warning (Mismatch)
            else if (isLlama) {
                 addRisk(node, "h_Mismatch", `Llama-related model using generic license '${fl}' (expected specific Llama license).`);
            }
        }
    });

    // --- Step 3: 传播逻辑核心 (BFS) ---
    function checkDownstreamPropagation(sourceConditionFn, targetConditionFn, riskType, reasonFn) {
        graph.forEachNode(sourceNode => {
            if (!sourceConditionFn(sourceNode)) return;

            const sourceLic = sourceNode.data.fixed_license;
            const sourceIdStr = safeString(sourceNode.data.model_id);

            const queue = [sourceNode.id];
            const visited = new Set([sourceNode.id]);
            
            while(queue.length > 0) {
                const currId = queue.shift();
                
                if (currId !== sourceNode.id) {
                    const currNode = graph.getNode(currId);
                    if (targetConditionFn(sourceNode, currNode)) {
                        addRisk(currNode, riskType, reasonFn(sourceLic, sourceIdStr));
                    }
                }
                
                graph.forEachLinkedNode(currId, (linked, link) => {
                    // 检查是否为向下游的边 (currId -> linked)
                    if(link.fromId === currId && isPropagationEdge(link) && !visited.has(linked.id)) {
                        visited.add(linked.id);
                        queue.push(linked.id);
                    }
                });
            }
        });
    }

    // --- Step 4: 执行各种 Error 检查 ---

    // g_Copyleft_Terms (Error)
    checkDownstreamPropagation(
        (src) => RISK_LISTS.g_Source.has(src.data.fixed_license),
        (src, curr) => curr.data.fixed_license !== src.data.fixed_license,
        "g_Copyleft_Terms",
        (srcLic, srcId) => `Inherited restrictive terms from ${srcId} (${srcLic}).`
    );

    // f_Copyleft (Error)
    checkDownstreamPropagation(
        (src) => RISK_LISTS.f_Source.has(src.data.fixed_license),
        (src, curr) => curr.data.fixed_license !== src.data.fixed_license,
        "f_Copyleft",
        (srcLic, srcId) => `Inherited copyleft obligations from ${srcId} (${srcLic}).`
    );

    // e_Conflict_ND (Error)
    checkDownstreamPropagation(
        (src) => RISK_LISTS.e_Source.has(src.data.fixed_license),
        (src, curr) => true, 
        "e_Conflict_ND",
        (srcLic, srcId) => `Violates No-Derivatives term from ${srcId} (${srcLic}).`
    );

    // d_Conflict_CC (Error)
    checkDownstreamPropagation(
        (src) => RISK_LISTS.d_Source.has(src.data.fixed_license),
        (src, curr) => RISK_LISTS.d_ConflictTarget.has(curr.data.fixed_license),
        "d_Conflict_CC",
        (srcLic, srcId) => `CC License (${srcLic}) from ${srcId} conflicts with downstream license.`
    );

    // --- Step 5: FSF Conflict (Error) ---
    graph.forEachNode(node => {
        if (RISK_LISTS.c_Source.has(node.data.fixed_license)) {
            let conflictParents = [];
            graph.forEachLinkedNode(node.id, (parent, link) => {
                // 检查是否为上游边 (parent -> node)
                if (link.toId === node.id && isPropagationEdge(link)) {
                    if (RISK_LISTS.c_ConflictParent.has(parent.data.fixed_license)) {
                        conflictParents.push(safeString(parent.data.model_id));
                    }
                }
            });
            
            if (conflictParents.length > 0) {
                const reason = `GPL model derived from incompatible parents: ${conflictParents.join(', ')}.`;
                addRisk(node, "c_Conflict_FSF", reason);
                checkDownstreamPropagation(
                    (src) => src.id === node.id,
                    (src, curr) => true,
                    "c_Conflict_FSF",
                    (srcLic, srcId) => `Inherited FSF conflict from upstream ${srcId}.`
                );
            }
        }
    });

    // --- Step 6: Llama Lineage (Error) ---
    function analyzeLineage(keyword, licenseKey, riskType) {
        const officialRoots = [];
        graph.forEachNode(node => {
            if (safeString(node.data.model_id).includes(keyword)) officialRoots.push(node.id);
        });
        
        const validIds = new Set(officialRoots);
        const queue = [...officialRoots];
        while(queue.length > 0) {
            const u = queue.shift();
            graph.forEachLinkedNode(u, (v, link) => {
                if(link.fromId === u && isPropagationEdge(link) && !validIds.has(v.id)) {
                    validIds.add(v.id);
                    queue.push(v.id);
                }
            });
        }

        graph.forEachNode(node => {
            if (node.data.fixed_license === licenseKey) {
                let invalidParents = [];
                graph.forEachLinkedNode(node.id, (parent, link) => {
                    if (link.toId === node.id && isPropagationEdge(link)) {
                        if (!validIds.has(parent.id)) {
                            invalidParents.push(safeString(parent.data.model_id));
                        }
                    }
                });

                if (invalidParents.length > 0) {
                    const reason = `Unofficial lineage: Parent(s) [${invalidParents.slice(0,3).join(', ')}...] are not in official ${keyword} family.`;
                    addRisk(node, riskType, reason);
                    checkDownstreamPropagation(
                        (src) => src.id === node.id,
                        (src, curr) => true,
                        riskType,
                        (srcLic, srcId) => `Inherited Lineage conflict from ${srcId}.`
                    );
                }
            }
        });
    }

    analyzeLineage("meta-llama/Llama-2-", "llama2", "b_Conflict_La2E");
    analyzeLineage("meta-llama/Meta-Llama-3-", "llama3", "a_Conflict_La3E");

    console.log("✅ 多重风险分析完成。");
}

// --- 5. 主转换流程 ---
async function convertData() {
    const linkTypeMap = {}; 
    const linkTypesArray = []; 
    let nextLinkTypeId = 0;
    const linkDataForSave = []; 
    try {
        const graph = createGraphNgraph();
        const displayLabels = [];
        const nodeOriginalIdToInternalIdMap = new Map();
        let internalIdCounter = 0;
        let nodesProcessed = 0;
        let relationshipsProcessed = 0;
        
        console.log("📂 Reading input JSON...");

        await new Promise((resolveNodePromise, rejectNodePromise) => {
             const nodesFileStream = fs.createReadStream(INPUT_JSON_PATH, { encoding: 'utf8' });
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
                        model_id: node.properties?.model_id,
                        author: node.properties?.author,
                        license: node.properties?.license, 
                        license_name: node.properties?.license_name,
                        downloads: node.properties?.downloads,
                        likes: node.properties?.likes,
                        tags: node.properties?.tags,
                        createdAt: node.properties?.createdAt 
                    });
                    nodesProcessed++;
                } catch (e) { console.error(e); }
                callback();
            });
            nodesFileStream.pipe(JSONStream.parse('nodes.*')).pipe(nodeProcessor)
                .on('error', rejectNodePromise).on('finish', resolveNodePromise);
        });
        console.log(`Node read complete: ${nodesProcessed} nodes.`);

        await new Promise((resolveRelPromise, rejectRelPromise) => {
            const relationshipsFileStream = fs.createReadStream(INPUT_JSON_PATH, { encoding: 'utf8' });
            const relationshipProcessor = through2.obj(function (rel, enc, callback) {
                try {
                     if (!rel || typeof rel.start_node_id === 'undefined' || typeof rel.end_node_id === 'undefined') return callback();
                     const s = nodeOriginalIdToInternalIdMap.get(rel.start_node_id);
                     const t = nodeOriginalIdToInternalIdMap.get(rel.end_node_id);
                     if (s === undefined || t === undefined) return callback();
                     
                     graph.addLink(s, t, { type: rel.type });
                     
                     const edgeType = rel.type || 'UNKNOWN';
                     let typeId = linkTypeMap[edgeType];
                     if (typeId === undefined) {
                         typeId = nextLinkTypeId++;
                         linkTypeMap[edgeType] = typeId;
                         linkTypesArray[typeId] = edgeType;
                     }
                     linkDataForSave.push(s, t, typeId);
                     relationshipsProcessed++;
                } catch (e) {}
                callback();
            });
            relationshipsFileStream.pipe(JSONStream.parse('relationships.*')).pipe(relationshipProcessor)
                .on('error', rejectRelPromise).on('finish', resolveRelPromise);
        });

        console.log("🕸️ Running layout...");
        const layout = createLayout(graph, { dimensions: 3, iterations: LAYOUT_ITERATIONS });
        layout.run();
        
        const versionSpecificPath = path.join(OUTPUT_DIR, GRAPH_NAME, VERSION_NAME);
        await fs.ensureDir(versionSpecificPath);

        runComplianceAnalysis(graph);

        console.log("💾 Saving data...");
        const nodeDataForSave = [];
        graph.forEachNode(node => { nodeDataForSave[node.id] = node.data; });
        await fs.writeJson(path.join(versionSpecificPath, 'nodeData.json'), nodeDataForSave);
        await fs.writeJson(path.join(versionSpecificPath, 'labels.json'), displayLabels);

        const positionsArray = new Int32Array(graph.getNodesCount() * 3);
        const finalPositions = layout.getLayout();
        for (let id = 0; id < graph.getNodesCount(); id++) {
            const pos = finalPositions ? finalPositions[id] : null;
            if (pos) {
                positionsArray[id * 3] = Math.round(pos.x);
                positionsArray[id * 3 + 1] = Math.round(pos.y);
                positionsArray[id * 3 + 2] = Math.round(pos.z);
            } else {
                positionsArray[id * 3] = 0; positionsArray[id * 3 + 1] = 0; positionsArray[id * 3 + 2] = 0;
            }
        }
        await fs.writeFile(path.join(versionSpecificPath, 'positions.bin'), Buffer.from(positionsArray.buffer));

        const linksDataArray = [];
        graph.forEachNode(node => {
            linksDataArray.push(-node.id - 1);
            graph.forEachLinkedNode(node.id, (linked) => linksDataArray.push(linked.id + 1), true);
        });
        await fs.writeFile(path.join(versionSpecificPath, 'links.bin'), Buffer.from(new Int32Array(linksDataArray).buffer));

        await fs.writeJson(path.join(versionSpecificPath, 'link_types.json'), linkTypesArray);
        await fs.writeFile(path.join(versionSpecificPath, 'link_data.bin'), Buffer.from(new Int32Array(linkDataForSave).buffer));
        
        await fs.writeJson(path.join(OUTPUT_DIR, GRAPH_NAME, 'manifest.json'), { all: [VERSION_NAME], last: VERSION_NAME });

        const nodeComplianceData = {};
        let problemCount = 0;
        graph.forEachNode(node => {
            if (node.data.compliance && node.data.compliance.risks && node.data.compliance.risks.length > 0) {
                const id = node.id;
                nodeComplianceData[id] = node.data.compliance;
                nodeComplianceData[id].fixed_license = node.data.fixed_license;
                problemCount++;
            }
        });
        await fs.writeJson(path.join(versionSpecificPath, 'compliance_data.json'), nodeComplianceData);
        
        console.log(`✅ Done. Found ${problemCount} nodes with compliance risks.`);

    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

convertData();