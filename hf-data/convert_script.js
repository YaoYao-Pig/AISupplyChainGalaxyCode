// convert_script_final_optimized.js

const createGraphNgraph = require('ngraph.graph');
const createLayout = require('ngraph.offline.layout');
const fs = require('fs-extra');
const path = require('path');
const { once } = require('events');
const cliProgress = require('cli-progress'); // 确保已安装: npm install cli-progress
const JSONStream = require('JSONStream');
const through2 = require('through2');

// --- 1. 基础配置项 ---
const CONFIG = {
    INPUT_PATH: path.resolve(__dirname, 'output_graph_filtered.json'),
    OUTPUT_DIR: path.resolve(__dirname, 'galaxy_output_data'),
    GRAPH_NAME: 'my_model_galaxy',
    VERSION_NAME: 'v1_updated_links',
    LAYOUT_ITERATIONS: 19005,
    PROPAGATION_TYPES: new Set(["FINETUNE", "MERGE", "QUANTIZED", "ADAPTER"]) // 使用 Set 提高查找速度
};

// --- 2. 业务规则常量 (使用 Set 提高性能) ---
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

// --- 3. 辅助函数 ---
const safeString = (val) => {
    if (val == null) return "None"; // check both null and undefined
    return Array.isArray(val) ? (val.length > 0 ? String(val[0]) : "None") : String(val);
};

async function writeChunk(writeStream, chunk) {
    if (!writeStream.write(chunk)) {
        await Promise.race([
            once(writeStream, 'drain'),
            once(writeStream, 'error').then(([error]) => Promise.reject(error))
        ]);
    }
}

async function writeJsonObjectStream(outputPath, writeEntries) {
    await fs.ensureDir(path.dirname(outputPath));
    const writeStream = fs.createWriteStream(outputPath, { encoding: 'utf8' });
    const completed = Promise.race([
        once(writeStream, 'finish'),
        once(writeStream, 'error').then(([error]) => Promise.reject(error))
    ]);

    try {
        await writeChunk(writeStream, '{\n');
        let isFirstEntry = true;

        const writeEntry = async (key, value) => {
            const prefix = isFirstEntry ? '' : ',\n';
            isFirstEntry = false;
            await writeChunk(writeStream, `${prefix}${JSON.stringify(String(key))}: ${JSON.stringify(value)}`);
        };

        await writeEntries(writeEntry);
        await writeChunk(writeStream, '\n}\n');
        writeStream.end();
        await completed;
    } catch (error) {
        writeStream.destroy();
        throw error;
    }
}

async function writeJsonArrayStream(outputPath, values) {
    await fs.ensureDir(path.dirname(outputPath));
    const writeStream = fs.createWriteStream(outputPath, { encoding: 'utf8' });
    const completed = Promise.race([
        once(writeStream, 'finish'),
        once(writeStream, 'error').then(([error]) => Promise.reject(error))
    ]);

    try {
        await writeChunk(writeStream, '[\n');
        for (let i = 0; i < values.length; i++) {
            const prefix = i === 0 ? '' : ',\n';
            await writeChunk(writeStream, `${prefix}${JSON.stringify(values[i])}`);
        }
        await writeChunk(writeStream, '\n]\n');
        writeStream.end();
        await completed;
    } catch (error) {
        writeStream.destroy();
        throw error;
    }
}

// --- 4. 合规性分析核心函数 (优化版) ---
function runComplianceAnalysis(graph) {
    console.log("🕵️ 开始合规性分析...");
    const progressBar = new cliProgress.SingleBar({ format: 'Analysis |{bar}| {percentage}% || {value}/{total} Nodes' }, cliProgress.Presets.shades_classic);
    progressBar.start(graph.getNodesCount(), 0);

    // --- 0. 预计算传播图结构 (Pre-computation) ---
    // 建立一个只包含 "传播边" 的轻量级邻接表，避免 BFS 时重复检查边类型
    const childToParents = new Map();  // Child -> [Parents]
    const parentToChildren = new Map(); // Parent -> [Children]

    graph.forEachLink(link => {
        if (link.data && link.data.type && CONFIG.PROPAGATION_TYPES.has(link.data.type)) {
            const childId = link.fromId;
            const parentId = link.toId;

            if (!childToParents.has(childId)) childToParents.set(childId, []);
            childToParents.get(childId).push(parentId);

            if (!parentToChildren.has(parentId)) parentToChildren.set(parentId, []);
            parentToChildren.get(parentId).push(childId);
        }
    });

    // 辅助：添加风险
    function addRisk(node, type, reason) {
        if (!node.data.compliance) {
            node.data.compliance = { risks: [], status: 'compliant' };
        }
        const level = RISK_LEVELS[type] || 'Warning';
        
        // 简单去重，避免同一类型同一原因重复
        const exists = node.data.compliance.risks.some(r => r.type === type && r.reason === reason);
        if (!exists) {
            node.data.compliance.risks.push({ type, level, reason });
        }
        
        // 状态升级逻辑
        if (level === 'Error') {
            node.data.compliance.status = 'error';
        } else if (level === 'Warning' && node.data.compliance.status !== 'error') {
            node.data.compliance.status = 'warning';
        }
    }

    // --- Step 1: 归一化 (Normalization) ---
    graph.forEachNode(node => {
        const data = node.data || {};
        const rawLicense = safeString(data.license); 
        const rawName = safeString(data.license_name);
        
        let fixed = rawLicense;
        const isNoneOrOther = (rawLicense === "None" || rawLicense === "other");

        if (!rawLicense || rawLicense === "null" || rawLicense === "undefined" || rawLicense === "unknown") {
            fixed = "None";
        } else if (isNoneOrOther) {
            if (rawName.includes("llama-3") || rawName === "llama3") fixed = "llama3";
            else if (rawName.includes("gemma")) fixed = "gemma";
            else if (rawName.includes("apple")) fixed = "apple-ascl";
            else if (rawName.includes("mit")) fixed = "mit";
        }
        
        node.data.fixed_license = fixed;
        node.data.compliance = { risks: [], status: 'compliant' };
        progressBar.increment();
    });
    progressBar.stop();

    console.log("   - Normalized licenses. Analyzing risks...");

    // --- Step 2: 本地风险 (Mismatch) ---
    graph.forEachNode(node => {
        const fl = node.data.fixed_license;
        if (RISK_LISTS.h_Mismatch.has(fl)) {
            const modelId = safeString(node.data.model_id).toLowerCase();
            const isLlama = modelId.includes("llama");
            const isInvalidData = ["None", "unknown", "null", "undefined", "other"].includes(fl);

            if (isInvalidData) {
                 addRisk(node, "h_Mismatch", `License information is missing or unknown ('${fl}').`);
            } else if (isLlama) {
                 addRisk(node, "h_Mismatch", `Llama-related model using generic license '${fl}' (expected specific Llama license).`);
            }
        }
    });

    // --- Step 3: 优化后的传播逻辑 (BFS using Pre-computed Map) ---
    // sourceConditionFn: (node) => boolean
    // targetConditionFn: (srcNode, currNode) => boolean
    function checkDownstreamPropagation(sourceConditionFn, targetConditionFn, riskType, reasonFn) {
        // 1. 收集所有风险源
        const sources = [];
        graph.forEachNode(node => {
            if (sourceConditionFn(node)) sources.push(node);
        });

        // 2. 对每个源进行 BFS，沿 parent -> child 的真实下游方向传播
        sources.forEach(sourceNode => {
            const sourceLic = sourceNode.data.fixed_license;
            const sourceIdStr = safeString(sourceNode.data.model_id);
            const riskReason = reasonFn(sourceLic, sourceIdStr);

            const queue = [sourceNode.id];
            const visited = new Set([sourceNode.id]); // Local visited for this source propagation

            while(queue.length > 0) {
                const currId = queue.shift();
                
                // 处理当前节点（非源节点）
                if (currId !== sourceNode.id) {
                    const currNode = graph.getNode(currId);
                    if (targetConditionFn(sourceNode, currNode)) {
                        addRisk(currNode, riskType, riskReason);
                    }
                }

                // 获取预计算的子节点
                const children = parentToChildren.get(currId);
                if (children) {
                    for (let i = 0; i < children.length; i++) {
                        const childId = children[i];
                        if (!visited.has(childId)) {
                            visited.add(childId);
                            queue.push(childId);
                        }
                    }
                }
            }
        });
    }

    // --- Step 4: 执行传播检查 ---

    // g_Copyleft_Terms
    checkDownstreamPropagation(
        (src) => RISK_LISTS.g_Source.has(src.data.fixed_license),
        (src, curr) => curr.data.fixed_license !== src.data.fixed_license,
        "g_Copyleft_Terms",
        (srcLic, srcId) => `Inherited restrictive terms from ${srcId} (${srcLic}).`
    );

    // f_Copyleft
    checkDownstreamPropagation(
        (src) => RISK_LISTS.f_Source.has(src.data.fixed_license),
        (src, curr) => curr.data.fixed_license !== src.data.fixed_license,
        "f_Copyleft",
        (srcLic, srcId) => `Inherited copyleft obligations from ${srcId} (${srcLic}).`
    );

    // e_Conflict_ND (Viral)
    checkDownstreamPropagation(
        (src) => RISK_LISTS.e_Source.has(src.data.fixed_license),
        (src, curr) => true, 
        "e_Conflict_ND",
        (srcLic, srcId) => `Violates No-Derivatives term from ${srcId} (${srcLic}).`
    );

    // d_Conflict_CC
    checkDownstreamPropagation(
        (src) => RISK_LISTS.d_Source.has(src.data.fixed_license),
        (src, curr) => RISK_LISTS.d_ConflictTarget.has(curr.data.fixed_license),
        "d_Conflict_CC",
        (srcLic, srcId) => `CC License (${srcLic}) from ${srcId} conflicts with downstream license.`
    );

    // --- Step 5: FSF Conflict (Upstream Check) ---
    graph.forEachNode(node => {
        if (RISK_LISTS.c_Source.has(node.data.fixed_license)) {
            const parents = childToParents.get(node.id);
            if (!parents) return;

            const conflictParents = [];
            for(const pid of parents) {
                const pNode = graph.getNode(pid);
                if (RISK_LISTS.c_ConflictParent.has(pNode.data.fixed_license)) {
                    conflictParents.push(safeString(pNode.data.model_id));
                }
            }
            
            if (conflictParents.length > 0) {
                const reason = `GPL model derived from incompatible parents: ${conflictParents.slice(0, 3).join(', ')}.`;
                addRisk(node, "c_Conflict_FSF", reason);
                
                // 这里仍然使用 BFS 向下传播这个特定的冲突
                checkDownstreamPropagation(
                    (src) => src.id === node.id,
                    (src, curr) => true,
                    "c_Conflict_FSF",
                    (srcLic, srcId) => `Inherited FSF conflict from upstream ${srcId}.`
                );
            }
        }
    });

    // --- Step 6: Llama Lineage (Optimized) ---
    function analyzeLineage(keyword, licenseKey, riskType) {
        // 1. 找出官方根节点
        const officialRootIds = new Set();
        graph.forEachNode(node => {
            if (safeString(node.data.model_id).includes(keyword)) officialRootIds.add(node.id);
        });
        
        // 2. 标记所有合法的后代 (Flood Fill)
        const validFamilyIds = new Set(officialRootIds);
        const queue = Array.from(officialRootIds);
        
        while(queue.length > 0) {
            const uId = queue.shift();
            const children = parentToChildren.get(uId);
            if (children) {
                for (const vId of children) {
                    if (!validFamilyIds.has(vId)) {
                        validFamilyIds.add(vId);
                        queue.push(vId);
                    }
                }
            }
        }

        // 3. 检查所有声明为 Llama 协议的节点
        const lineageSources = [];
        graph.forEachNode(node => {
            if (node.data.fixed_license === licenseKey) {
                const parents = childToParents.get(node.id);
                if (parents) {
                    let isInvalid = false;
                    const invalidParentNames = [];
                    
                    for (const pid of parents) {
                        if (!validFamilyIds.has(pid)) { // 如果父节点不在合法家族树中
                            isInvalid = true;
                            invalidParentNames.push(safeString(graph.getNode(pid).data.model_id));
                        }
                    }

                    if (isInvalid) {
                        const reason = `Unofficial lineage: Parent(s) [${invalidParentNames.slice(0,3).join(', ')}] are not in official ${keyword} family.`;
                        addRisk(node, riskType, reason);
                        lineageSources.push(node);
                    }
                }
            }
        });

        // 4. 传播 Lineage 错误
        lineageSources.forEach(sourceNode => {
             // 复用逻辑：手动调用传播
             checkDownstreamPropagation(
                (src) => src.id === sourceNode.id,
                (src, curr) => true,
                riskType,
                (srcLic, srcId) => `Inherited Lineage conflict from ${srcId}.`
            );
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
    
    // 初始化进度条
    const parseBar = new cliProgress.MultiBar({
        clearOnComplete: false,
        hideCursor: true,
        format: ' {bar} | {filename} | {value} processed'
    }, cliProgress.Presets.shades_grey);
    const nodeBar = parseBar.create(0, 0, { filename: 'Nodes' });
    const relBar = parseBar.create(0, 0, { filename: 'Links' });

    try {
        const graph = createGraphNgraph();
        const displayLabels = [];
        const nodeOriginalIdToInternalIdMap = new Map();
        let internalIdCounter = 0;
        
        console.log("📂 Reading input JSON streams...");

        // Promise for Nodes
        await new Promise((resolve, reject) => {
             const nodesStream = fs.createReadStream(CONFIG.INPUT_PATH, { encoding: 'utf8' });
             const parser = JSONStream.parse('nodes.*');
             
             nodesStream.pipe(parser)
                .pipe(through2.obj((node, enc, cb) => {
                    if (node && node.id !== undefined && !nodeOriginalIdToInternalIdMap.has(node.id)) {
                        const iId = internalIdCounter++;
                        nodeOriginalIdToInternalIdMap.set(node.id, iId);
                        displayLabels[iId] = node.properties?.model_id || node.id;
                        
                        graph.addNode(iId, {
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
                        nodeBar.increment();
                    }
                    cb();
                }))
                .on('error', reject)
                .on('finish', resolve);
        });
        nodeBar.stop();

        // Promise for Relationships
        await new Promise((resolve, reject) => {
            const relStream = fs.createReadStream(CONFIG.INPUT_PATH, { encoding: 'utf8' });
            const parser = JSONStream.parse('relationships.*');

            relStream.pipe(parser)
               .pipe(through2.obj((rel, enc, cb) => {
                   if (rel && rel.start_node_id !== undefined && rel.end_node_id !== undefined) {
                       const s = nodeOriginalIdToInternalIdMap.get(rel.start_node_id);
                       const t = nodeOriginalIdToInternalIdMap.get(rel.end_node_id);
                       
                       if (s !== undefined && t !== undefined) {
                           // 注意：ngraph 是多重图友好的，但通常一个 type 只存一条
                           graph.addLink(s, t, { type: rel.type });

                           // 收集保存数据
                           const edgeType = rel.type || 'UNKNOWN';
                           let typeId = linkTypeMap[edgeType];
                           if (typeId === undefined) {
                               typeId = nextLinkTypeId++;
                               linkTypeMap[edgeType] = typeId;
                               linkTypesArray[typeId] = edgeType;
                           }
                           linkDataForSave.push(s, t, typeId);
                           relBar.increment();
                       }
                   }
                   cb();
               }))
               .on('error', reject)
               .on('finish', resolve);
        });
        relBar.stop();
        parseBar.stop();

        console.log(`\n🕸️  Running layout (${CONFIG.LAYOUT_ITERATIONS} iterations)...`);
        const layoutCacheDir = path.join(__dirname, 'data', CONFIG.GRAPH_NAME, CONFIG.VERSION_NAME);
        const layout = createLayout(graph, {
            dimensions: 3,
            iterations: CONFIG.LAYOUT_ITERATIONS,
            outDir: layoutCacheDir
        });
        
        // 布局进度条
        // 不同版本的 ngraph.offline.layout 暴露的 API 不完全一致。
        // 优先使用 step() 以显示进度；如果不存在则退回 run()。
        const layoutBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
        layoutBar.start(CONFIG.LAYOUT_ITERATIONS, 0);

        if (typeof layout.step === 'function') {
            const batchSize = 100;
            for (let i = 0; i < CONFIG.LAYOUT_ITERATIONS; i += batchSize) {
                const steps = Math.min(batchSize, CONFIG.LAYOUT_ITERATIONS - i);
                for (let j = 0; j < steps; j++) layout.step();
                layoutBar.increment(steps);
            }
        } else if (typeof layout.run === 'function') {
            console.log(`Resetting cached layout snapshots under ${layoutCacheDir} before generating a fresh layout.`);
            layout.run(true);
            layoutBar.update(CONFIG.LAYOUT_ITERATIONS);
        } else {
            throw new TypeError('Unsupported ngraph.offline.layout API: missing step() and run().');
        }
        layoutBar.stop();
        
        // 执行合规分析
        runComplianceAnalysis(graph);

        console.log("\n💾 Saving binary data...");
        const versionPath = path.join(CONFIG.OUTPUT_DIR, CONFIG.GRAPH_NAME, CONFIG.VERSION_NAME);
        await fs.ensureDir(versionPath);

        // Save Node Data & Labels
        await writeJsonObjectStream(path.join(versionPath, 'nodeData.json'), async (writeEntry) => {
            for (let id = 0; id < graph.getNodesCount(); id++) {
                const node = graph.getNode(id);
                if (node) {
                    await writeEntry(node.id, node.data);
                }
            }
        });
        await writeJsonArrayStream(path.join(versionPath, 'labels.json'), displayLabels);

        // Save Positions
        const positionsArray = new Int32Array(graph.getNodesCount() * 3);
        for (let id = 0; id < graph.getNodesCount(); id++) {
            const pos = typeof layout.getNodePosition === 'function'
                ? layout.getNodePosition(id)
                : (typeof layout.getLayout === 'function' ? layout.getLayout()[id] : null);
            if (pos) {
                positionsArray[id * 3] = Math.round(pos.x);
                positionsArray[id * 3 + 1] = Math.round(pos.y);
                positionsArray[id * 3 + 2] = Math.round(pos.z);
            }
        }
        await fs.writeFile(path.join(versionPath, 'positions.bin'), Buffer.from(positionsArray.buffer));

        // Save Links (Visual Adjacency)
        // ngraph 存储是无向的，但 links 迭代器可以拿到所有连接
        const linksBufferData = [];
        graph.forEachNode(node => {
            linksBufferData.push(-node.id - 1); // 标记新节点开始
            // 注意：forEachLinkedNode 会同时返回入边和出边，作为无向边渲染通常没问题
            graph.forEachLinkedNode(node.id, (linked) => {
                linksBufferData.push(linked.id + 1);
            }, true); // true = unique links only? ngraph doc says third arg is 'oriented' sometimes depending on implementation
        });
        await fs.writeFile(path.join(versionPath, 'links.bin'), Buffer.from(new Int32Array(linksBufferData).buffer));

        // Save Link Types
        await fs.writeJson(path.join(versionPath, 'link_types.json'), linkTypesArray);
        await fs.writeFile(path.join(versionPath, 'link_data.bin'), Buffer.from(new Int32Array(linkDataForSave).buffer));
        
        // Manifest & Compliance
        await fs.writeJson(path.join(CONFIG.OUTPUT_DIR, CONFIG.GRAPH_NAME, 'manifest.json'), { all: [CONFIG.VERSION_NAME], last: CONFIG.VERSION_NAME });
        let problemCount = 0;
        await writeJsonObjectStream(path.join(versionPath, 'compliance_data.json'), async (writeEntry) => {
            for (let id = 0; id < graph.getNodesCount(); id++) {
                const node = graph.getNode(id);
                if (node?.data.compliance?.risks?.length > 0) {
                    problemCount++;
                    await writeEntry(node.id, {
                        ...node.data.compliance,
                        fixed_license: node.data.fixed_license
                    });
                }
            }
        });
        
        console.log(`✅ Done. Found ${problemCount} nodes with risks.`);

    } catch (error) {
        console.error("❌ Fatal Error:", error);
        process.exit(1);
    }
}

convertData();

