const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const createGraphNgraph = require('ngraph.graph');
// 务必确保安装了 ngraph.forcelayout (npm install ngraph.forcelayout)
const createLayout = require('ngraph.forcelayout'); 
const fs = require('fs-extra');
const path = require('path');
const JSONStream = require('JSONStream');
const through2 = require('through2');
const cliProgress = require('cli-progress');

// ============================================================
//  配置区域
// ============================================================
const CONFIG = {
    INPUT_JSON_PATH: './output_graph_filtered.json',
    OUTPUT_DIR: './galaxy_output_data',
    GRAPH_NAME: 'my_model_galaxy',
    VERSION_NAME: 'v1_updated_links',
    // 布局迭代次数。84万节点即使是 forcelayout 也很慢，建议先设 500-1000 次看效果
    LAYOUT_ITERATIONS: 1000, 
};

// ============================================================
//  Worker 线程逻辑
// ============================================================
if (!isMainThread) {
    const { task, nodes, links, config } = workerData;

    function rebuildGraph(nodeList, linkList) {
        const graph = createGraphNgraph();
        // 大量数据时，循环比 forEach 快一点点
        for (let i = 0; i < nodeList.length; i++) graph.addNode(nodeList[i].id, nodeList[i].data);
        for (let i = 0; i < linkList.length; i++) graph.addLink(linkList[i].from, linkList[i].to, linkList[i].data);
        return graph;
    }

    // --- 任务 A: Layout (物理布局) ---
    if (task === 'LAYOUT') {
        try {
            parentPort.postMessage({ type: 'log', msg: `[Layout] 重建图结构 (${nodes.length} nodes)...` });
            const graph = rebuildGraph(nodes, links);
            
            parentPort.postMessage({ type: 'log', msg: `[Layout] 初始化物理引擎 (3D)...` });
            const layout = createLayout(graph, { dimensions: 3 });
            
            const totalSteps = config.LAYOUT_ITERATIONS;
            const reportInterval = 1; // 实时汇报
            
            parentPort.postMessage({ type: 'log', msg: `[Layout] 开始迭代...` });

            for (let i = 0; i < totalSteps; i++) {
                const start = Date.now();
                layout.step(); 
                const duration = Date.now() - start;

                // 第一步时打印耗时预估
                if (i === 0) {
                     parentPort.postMessage({ type: 'log', msg: `[Perf] 单步耗时: ${(duration/1000).toFixed(2)}s. 预估剩余: ${((duration * totalSteps)/1000/60).toFixed(1)} 分钟` });
                }

                if (i % reportInterval === 0 || i === totalSteps - 1) {
                    parentPort.postMessage({ 
                        type: 'progress', 
                        current: i + 1, 
                        total: totalSteps, 
                        status: `Iter ${i+1} (${duration}ms)` 
                    });
                }
            }
            
            const positionsMap = {};
            graph.forEachNode(node => {
                const pos = layout.getNodePosition(node.id);
                positionsMap[node.id] = pos ? { x: Math.round(pos.x), y: Math.round(pos.y), z: Math.round(pos.z) } : { x: 0, y: 0, z: 0 };
            });

            parentPort.postMessage({ type: 'done', result: positionsMap });
        } catch (e) {
            parentPort.postMessage({ type: 'error', error: e.message + "\n" + e.stack });
        }
    }

    // --- 任务 B: Compliance (合规性分析 - 性能优化版) ---
    else if (task === 'COMPLIANCE') {
        try {
            parentPort.postMessage({ type: 'log', msg: `[Compliance] 重建图结构...` });
            const graph = rebuildGraph(nodes, links);
            
            // 风险规则定义
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
            const RISK_LEVELS = { h_Mismatch: 'Warning', g_Copyleft_Terms: 'Error', f_Copyleft: 'Error', e_Conflict_ND: 'Error', d_Conflict_CC: 'Error', c_Conflict_FSF: 'Error', b_Conflict_La2E: 'Error', a_Conflict_La3E: 'Error', g_Source: 'Error' };
            const safeString = (val) => (val === null || val === undefined) ? "None" : (Array.isArray(val) ? (val.length > 0 ? String(val[0]) : "None") : String(val));
            const isIn = (val, list) => list.includes(val);
            const isPropagationEdge = (link) => ["FINETUNE", "MERGE", "QUANTIZED", "ADAPTER"].includes(link.data ? link.data.type : null);
            
            const TOTAL_STEPS = 6;
            const reportStep = (stepNum, name) => parentPort.postMessage({ type: 'progress', current: stepNum, total: TOTAL_STEPS, status: name });

            function addRisk(node, type, reason) {
                if (!node.data.compliance) node.data.compliance = { risks: [], status: 'compliant' };
                const level = RISK_LEVELS[type] || 'Warning';
                const exists = node.data.compliance.risks.some(r => r.type === type && r.reason === reason);
                if (!exists) node.data.compliance.risks.push({ type, level, reason });
                if (level === 'Error') node.data.compliance.status = 'error';
                else if (level === 'Warning' && node.data.compliance.status !== 'error') node.data.compliance.status = 'warning';
            }

            // === 核心修复：BFS 传播逻辑 ===
            // 避免在遍历循环中再次遍历全图，解决 O(N^2) 卡死问题
            function bfsPropagateRisk(startNode, targetConditionFn, riskType, reasonFn) {
                const sourceLic = startNode.data.fixed_license;
                const sourceIdStr = safeString(startNode.data.model_id);
                const queue = [startNode.id];
                const visited = new Set([startNode.id]);
                
                while(queue.length > 0) {
                    const currId = queue.shift();
                    
                    // 处理当前节点（如果是下游）
                    if (currId !== startNode.id) {
                        const currNode = graph.getNode(currId);
                        if (targetConditionFn(startNode, currNode)) {
                            addRisk(currNode, riskType, reasonFn(sourceLic, sourceIdStr));
                        }
                    }
                    
                    // 继续向下游搜索
                    graph.forEachLinkedNode(currId, (linked, link) => {
                        if(link.fromId === currId && isPropagationEdge(link) && !visited.has(linked.id)) {
                            visited.add(linked.id);
                            queue.push(linked.id);
                        }
                    });
                }
            }
            
            function checkAllSourcesPropagation(sourceConditionFn, targetConditionFn, riskType, reasonFn) {
                graph.forEachNode(sourceNode => {
                    if (sourceConditionFn(sourceNode)) {
                        bfsPropagateRisk(sourceNode, targetConditionFn, riskType, reasonFn);
                    }
                });
            }

            // --- Step 1 ---
            reportStep(1, "Normalize Licenses");
            graph.forEachNode(node => {
                const data = node.data || {};
                const rawLicense = safeString(data.license); 
                const rawName = safeString(data.license_name);
                let fixed = null;
                if (!rawLicense || rawLicense === "null" || rawLicense === "undefined") fixed = "None";
                else if (isIn(rawLicense, ["None", "other"]) && isIn(rawName, ["llama3", "llama-3", "llama-3-community-license"])) fixed = "llama3";
                else if (isIn(rawLicense, ["None", "other"]) && isIn(rawName, ["gemma", "gemma-terms-of-use"])) fixed = "gemma";
                else if (isIn(rawLicense, ["None", "other"]) && isIn(rawName, ["apple-ascl", "apple-sample-code-license"])) fixed = "apple-ascl";
                else if (isIn(rawLicense, ["None", "other"]) && isIn(rawName, ["mit", "mit-license"])) fixed = "mit";
                else if (isIn(rawLicense, ["None", "unknown"])) fixed = "None";
                else fixed = rawLicense; 
                node.data.fixed_license = fixed;
                node.data.compliance = { risks: [], status: 'compliant' };
            });

            // --- Step 2 ---
            reportStep(2, "Checking Mismatches");
            graph.forEachNode(node => {
                const fl = node.data.fixed_license;
                if (RISK_LISTS.h_Mismatch.has(fl)) {
                    const modelId = safeString(node.data.model_id).toLowerCase();
                    if (["None", "unknown", "null", "undefined", "other"].includes(fl)) addRisk(node, "h_Mismatch", `License information is missing or unknown ('${fl}').`);
                    else if (modelId.includes("llama")) addRisk(node, "h_Mismatch", `Llama-related model using generic license '${fl}' (expected specific Llama license).`);
                }
            });

            // --- Step 3 ---
            reportStep(3, "Propagating Copyleft");
            checkAllSourcesPropagation(s => RISK_LISTS.g_Source.has(s.data.fixed_license), (s, c) => c.data.fixed_license !== s.data.fixed_license, "g_Copyleft_Terms", (l, i) => `Inherited restrictive terms from ${i} (${l}).`);
            checkAllSourcesPropagation(s => RISK_LISTS.f_Source.has(s.data.fixed_license), (s, c) => c.data.fixed_license !== s.data.fixed_license, "f_Copyleft", (l, i) => `Inherited copyleft obligations from ${i} (${l}).`);
            checkAllSourcesPropagation(s => RISK_LISTS.e_Source.has(s.data.fixed_license), () => true, "e_Conflict_ND", (l, i) => `Violates No-Derivatives term from ${i} (${l}).`);
            checkAllSourcesPropagation(s => RISK_LISTS.d_Source.has(s.data.fixed_license), (s, c) => RISK_LISTS.d_ConflictTarget.has(c.data.fixed_license), "d_Conflict_CC", (l, i) => `CC License (${l}) from ${i} conflicts with downstream license.`);

            // --- Step 4 (已修复) ---
            reportStep(4, "FSF Conflict Analysis");
            graph.forEachNode(node => {
                if (RISK_LISTS.c_Source.has(node.data.fixed_license)) {
                    let conflictParents = [];
                    graph.forEachLinkedNode(node.id, (parent, link) => {
                        if (link.toId === node.id && isPropagationEdge(link) && RISK_LISTS.c_ConflictParent.has(parent.data.fixed_license)) {
                            conflictParents.push(safeString(parent.data.model_id));
                        }
                    });
                    
                    if (conflictParents.length > 0) {
                        const reason = `GPL model derived from incompatible parents: ${conflictParents.join(', ')}.`;
                        addRisk(node, "c_Conflict_FSF", reason);
                        // 直接 BFS 传播，不遍历全图
                        bfsPropagateRisk(node, () => true, "c_Conflict_FSF", (l, i) => `Inherited FSF conflict from upstream ${i}.`);
                    }
                }
            });

            // --- Step 5 (已修复) ---
            reportStep(5, "Lineage Verification");
            function analyzeLineage(keyword, licenseKey, riskType) {
                const officialRoots = [];
                graph.forEachNode(node => { if (safeString(node.data.model_id).includes(keyword)) officialRoots.push(node.id); });
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
                            if (link.toId === node.id && isPropagationEdge(link) && !validIds.has(parent.id)) {
                                invalidParents.push(safeString(parent.data.model_id));
                            }
                        });
                        if (invalidParents.length > 0) {
                            addRisk(node, riskType, `Unofficial lineage: Parent(s) [${invalidParents.slice(0,3).join(', ')}...] not in official family.`);
                            // 直接 BFS 传播
                            bfsPropagateRisk(node, () => true, riskType, (l,i)=>`Inherited Lineage conflict from ${i}.`);
                        }
                    }
                });
            }
            analyzeLineage("meta-llama/Llama-2-", "llama2", "b_Conflict_La2E");
            analyzeLineage("meta-llama/Meta-Llama-3-", "llama3", "a_Conflict_La3E");

            // --- Step 6 ---
            reportStep(6, "Finalizing Results");
            const complianceResults = {};
            let problemCount = 0;
            graph.forEachNode(node => {
                if (node.data.compliance && node.data.compliance.risks && node.data.compliance.risks.length > 0) {
                    complianceResults[node.id] = node.data.compliance;
                    complianceResults[node.id].fixed_license = node.data.fixed_license;
                    problemCount++;
                }
            });

            parentPort.postMessage({ type: 'done', result: complianceResults, count: problemCount });

        } catch (e) {
            parentPort.postMessage({ type: 'error', error: e.message + "\n" + e.stack });
        }
    }
} 

// ============================================================
//  主线程逻辑 (I/O, 任务调度, 进度条)
// ============================================================
else {
    (async () => {
        // 设置进度条格式
        const multibar = new cliProgress.MultiBar({
            clearOnComplete: false,
            hideCursor: true,
            format: ' {bar} | {task} | {value}/{total} | {status}',
        }, cliProgress.Presets.shades_classic);

        const readBar = multibar.create(100, 0, { task: "Data Reading", status: "Initializing..." });
        const layoutBar = multibar.create(CONFIG.LAYOUT_ITERATIONS, 0, { task: "Layout Algo ", status: "Waiting..." });
        const complianceBar = multibar.create(6, 0, { task: "Compliance  ", status: "Waiting..." });

        try {
            // --- 1. 读取数据 ---
            const nodeOriginalIdToInternalIdMap = new Map();
            let internalIdCounter = 0;
            const nodesForWorker = [];
            const linksForWorker = [];
            const displayLabels = [];
            const linkTypeMap = {}; 
            const linkTypesArray = []; 
            let nextLinkTypeId = 0;
            const linkDataForSave = []; 

            const fileStats = await fs.stat(CONFIG.INPUT_JSON_PATH);
            const fileSize = fileStats.size;
            let bytesRead = 0;

            readBar.update(0, { status: "Scanning Nodes..." });

            await new Promise((resolve, reject) => {
                fs.createReadStream(CONFIG.INPUT_JSON_PATH, { encoding: 'utf8' })
                    .on('data', chunk => {
                        bytesRead += chunk.length;
                        const progress = Math.min(45, Math.floor((bytesRead / fileSize) * 100 * 0.5));
                        readBar.update(progress, { status: `Reading Nodes (${nodesForWorker.length})` });
                    })
                    .pipe(JSONStream.parse('nodes.*'))
                    .pipe(through2.obj((node, enc, cb) => {
                        if (node && node.id !== undefined && !nodeOriginalIdToInternalIdMap.has(node.id)) {
                            const internalId = internalIdCounter++;
                            nodeOriginalIdToInternalIdMap.set(node.id, internalId);
                            nodesForWorker.push({
                                id: internalId, 
                                data: {
                                    originalId: node.id,
                                    model_id: node.properties?.model_id,
                                    author: node.properties?.author,
                                    license: node.properties?.license, 
                                    license_name: node.properties?.license_name,
                                    tags: node.properties?.tags
                                }
                            });
                            displayLabels[internalId] = node.properties?.model_id || node.id;
                        }
                        cb();
                    }))
                    .on('finish', resolve).on('error', reject);
            });

            readBar.update(50, { status: "Scanning Edges..." });

            await new Promise((resolve, reject) => {
                fs.createReadStream(CONFIG.INPUT_JSON_PATH, { encoding: 'utf8' })
                    .on('data', chunk => {
                         bytesRead += chunk.length; 
                         const progress = 50 + Math.min(50, Math.floor((bytesRead / (fileSize * 2)) * 100 * 0.5)); 
                         readBar.update(progress, { status: `Reading Links (${linksForWorker.length})` });
                    })
                    .pipe(JSONStream.parse('relationships.*'))
                    .pipe(through2.obj((rel, enc, cb) => {
                        if (rel && rel.start_node_id && rel.end_node_id) {
                            const s = nodeOriginalIdToInternalIdMap.get(rel.start_node_id);
                            const t = nodeOriginalIdToInternalIdMap.get(rel.end_node_id);
                            if (s !== undefined && t !== undefined) {
                                linksForWorker.push({ from: s, to: t, data: { type: rel.type } });
                                const edgeType = rel.type || 'UNKNOWN';
                                let typeId = linkTypeMap[edgeType];
                                if (typeId === undefined) {
                                    typeId = nextLinkTypeId++;
                                    linkTypeMap[edgeType] = typeId;
                                    linkTypesArray[typeId] = edgeType;
                                }
                                linkDataForSave.push(s, t, typeId);
                            }
                        }
                        cb();
                    }))
                    .on('finish', resolve).on('error', reject);
            });

            readBar.update(100, { status: "Done" });

            // --- 2. 启动 Workers ---
            layoutBar.update(0, { status: "Starting..." });
            complianceBar.update(0, { status: "Starting..." });

            const layoutPromise = new Promise((resolve, reject) => {
                const worker = new Worker(__filename, {
                    workerData: { task: 'LAYOUT', nodes: nodesForWorker, links: linksForWorker, config: CONFIG }
                });
                worker.on('message', msg => {
                    if (msg.type === 'progress') layoutBar.update(msg.current, { status: msg.status });
                    else if (msg.type === 'done') { layoutBar.update(CONFIG.LAYOUT_ITERATIONS, { status: "Finished" }); resolve(msg.result); }
                    else if (msg.type === 'log') layoutBar.update(0, { status: msg.msg });
                    else if (msg.type === 'error') reject(new Error(msg.error));
                });
                worker.on('error', reject);
            });

            const compliancePromise = new Promise((resolve, reject) => {
                const worker = new Worker(__filename, {
                    workerData: { task: 'COMPLIANCE', nodes: nodesForWorker, links: linksForWorker, config: CONFIG }
                });
                worker.on('message', msg => {
                    if (msg.type === 'progress') complianceBar.update(msg.current, { status: msg.status });
                    else if (msg.type === 'done') { complianceBar.update(6, { status: "Finished" }); resolve(msg); }
                    else if (msg.type === 'log') complianceBar.update(0, { status: msg.msg });
                    else if (msg.type === 'error') reject(new Error(msg.error));
                });
                worker.on('error', reject);
            });

            const [positionsResult, complianceResult] = await Promise.all([layoutPromise, compliancePromise]);
            
            multibar.stop(); 
            console.log(`\n✅ 计算完成! 发现 ${complianceResult.count} 个合规风险节点。`);

            // --- 3. 写入文件 ---
            console.log("💾 正在写入结果文件...");
            const versionSpecificPath = path.join(CONFIG.OUTPUT_DIR, CONFIG.GRAPH_NAME, CONFIG.VERSION_NAME);
            await fs.ensureDir(versionSpecificPath);

            const finalNodeData = [];
            nodesForWorker.forEach(n => {
                finalNodeData[n.id] = n.data; 
                if (complianceResult.result[n.id]) {
                    finalNodeData[n.id].compliance = complianceResult.result[n.id];
                    finalNodeData[n.id].fixed_license = complianceResult.result[n.id].fixed_license;
                }
            });
            await fs.writeJson(path.join(versionSpecificPath, 'nodeData.json'), finalNodeData);
            await fs.writeJson(path.join(versionSpecificPath, 'labels.json'), displayLabels);

            const positionsArray = new Int32Array(nodesForWorker.length * 3);
            for (let id = 0; id < nodesForWorker.length; id++) {
                const pos = positionsResult[id];
                if (pos) {
                    positionsArray[id * 3] = pos.x;
                    positionsArray[id * 3 + 1] = pos.y;
                    positionsArray[id * 3 + 2] = pos.z;
                }
            }
            await fs.writeFile(path.join(versionSpecificPath, 'positions.bin'), Buffer.from(positionsArray.buffer));

            const adj = Array.from({ length: nodesForWorker.length }, () => []);
            linksForWorker.forEach(l => adj[l.from].push(l.to));
            const linksBinaryArray = [];
            for(let id=0; id<nodesForWorker.length; id++) {
                linksBinaryArray.push(-id - 1);
                const targets = adj[id];
                if(targets) targets.forEach(tid => linksBinaryArray.push(tid + 1));
            }
            await fs.writeFile(path.join(versionSpecificPath, 'links.bin'), Buffer.from(new Int32Array(linksBinaryArray).buffer));
            await fs.writeJson(path.join(versionSpecificPath, 'link_types.json'), linkTypesArray);
            await fs.writeFile(path.join(versionSpecificPath, 'link_data.bin'), Buffer.from(new Int32Array(linkDataForSave).buffer));
            await fs.writeJson(path.join(versionSpecificPath, 'compliance_data.json'), complianceResult.result);
            await fs.writeJson(path.join(CONFIG.OUTPUT_DIR, CONFIG.GRAPH_NAME, 'manifest.json'), { all: [CONFIG.VERSION_NAME], last: CONFIG.VERSION_NAME });

            console.log("🎉 全部完成！");
            process.exit(0);

        } catch (error) {
            multibar.stop();
            console.error("\n❌ 错误:", error);
            process.exit(1);
        }
    })();
}