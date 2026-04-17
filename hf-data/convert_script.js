const createGraphNgraph = require('ngraph.graph');
const createLayout = require('ngraph.offline.layout');
const fs = require('fs-extra');
const path = require('path');
const cliProgress = require('cli-progress');
const JSONStream = require('JSONStream');
const through2 = require('through2');

// --- 1. 基础配置项 ---
const CONFIG = {
    INPUT_PATH: './output_graph_filtered.json',
    OUTPUT_DIR: './galaxy_output_data',
    GRAPH_NAME: 'my_model_galaxy',
    VERSION_NAME: 'v1_updated_links',

    // 注意：
    // ngraph.offline.layout 源码里循环条件是 step < iterations
    // 如果你已经有 19000.bin，想继续跑到并保存 19005.bin，
    // 这里设成 19006 更稳妥
    LAYOUT_ITERATIONS: 19006,

    // 显式写出来，便于和已有 19000.bin / 19005.bin 的保存节奏对齐
    LAYOUT_SAVE_EACH: 5,

    PROPAGATION_TYPES: new Set(["FINETUNE", "MERGE", "QUANTIZED", "ADAPTER"])
};

// --- 2. 业务规则常量 ---
const RISK_LISTS = {
    h_Mismatch: new Set([
        "apache-2.0", "None", "mit", "cc-by-nc-4.0", "cc-by-4.0", "cc-by-nc-sa-4.0",
        "cc-by-sa-4.0", "bsd-3-clause", "gpl-3.0", "unknown", "cc", "cc-by-nc-nd-4.0",
        "afl-3.0", "agpl-3.0", "cc0-1.0", "wtfpl", "cc-by-nc-2.0", "artistic-2.0",
        "unlicense", "cc-by-sa-3.0", "bsl-1.0", "gpl", "apple-ascl", "osl-3.0",
        "cc-by-nc-3.0", "cc-by-2.0", "gpl-2.0", "bsd", "ms-pl", "ecl-2.0",
        "bsd-3-clause-clear", "cc-by-3.0", "lgpl-3.0", "deepfloyd-if-license", "mpl-2.0",
        "pddl", "bsd-2-clause", "cc-by-nd-4.0", "cdla-permissive-2.0", "eupl-1.1",
        "cc-by-nc-sa-3.0", "etalab-2.0", "odc-by", "cc-by-2.5", "ofl-1.1", "odbl",
        "cc-by-nc-sa-2.0", "cdla-sharing-1.0", "lgpl-lr", "lgpl", "zlib"
    ]),

    g_Source: new Set([
        "creativeml-openrail-m", "llama2", "cc-by-nc-4.0", "gemma", "llama3", "openrail++",
        "llama3.1", "llama3.2", "openrail", "bigcode-openrail-m", "cc-by-nc-3.0",
        "bigscience-bloom-rail-1.0", "llama3.3", "bigscience-openrail-m", "cc-by-nc-2.0",
        "deepfloyd-if-license", "c-uda"
    ]),

    f_Source: new Set([
        "cc-by-nc-sa-4.0", "cc-by-sa-4.0", "gpl-3.0", "agpl-3.0", "cc-by-sa-3.0", "gpl",
        "osl-3.0", "gpl-2.0", "ms-pl", "lgpl-3.0", "mpl-2.0", "eupl-1.1",
        "cc-by-nc-sa-3.0", "odbl", "cc-by-nc-sa-2.0", "cdla-sharing-1.0", "lgpl-lr",
        "lgpl", "epl-2.0", "epl-1.0", "lgpl-2.1"
    ]),

    e_Source: new Set(["cc-by-nc-nd-4.0", "cc-by-nd-4.0"]),

    d_Source: new Set([
        "cc-by-nc-4.0", "cc-by-4.0", "cc-by-nc-sa-4.0", "cc-by-sa-4.0", "cc",
        "cc-by-nc-2.0", "cc-by-sa-3.0", "cc-by-nc-3.0", "cc-by-2.0", "cc-by-3.0",
        "cc-by-nc-sa-3.0", "cc-by-2.5", "cc-by-nc-sa-2.0"
    ]),

    d_ConflictTarget: new Set([
        "other", "creativeml-openrail-m", "llama2", "gemma", "llama3", "openrail++",
        "llama3.1", "llama3.2", "openrail", "bigcode-openrail-m", "bigscience-bloom-rail-1.0",
        "llama3.3", "agpl-3.0", "bigscience-openrail-m", "gpl", "apple-ascl", "osl-3.0",
        "gpl-2.0", "lgpl-3.0", "deepfloyd-if-license", "mpl-2.0", "pddl", "eupl-1.1",
        "odbl", "cdla-sharing-1.0", "lgpl-lr", "lgpl", "epl-2.0", "epl-1.0", "lgpl-2.1"
    ]),

    c_Source: new Set(["gpl-3.0", "agpl-3.0", "gpl"]),

    c_ConflictParent: new Set([
        "other", "creativeml-openrail-m", "llama2", "cc-by-nc-4.0", "gemma", "llama3",
        "openrail++", "llama3.1", "llama3.2", "cc-by-nc-sa-4.0", "openrail",
        "bigcode-openrail-m", "bigscience-bloom-rail-1.0", "unknown", "cc",
        "cc-by-nc-nd-4.0", "llama3.3", "cc-by-nc-2.0", "cc-by-sa-3.0", "apple-ascl",
        "cc-by-nc-3.0", "cc-by-2.0", "deepfloyd-if-license", "pddl", "cc-by-nd-4.0",
        "cc-by-nc-sa-3.0", "etalab-2.0", "odc-by", "cc-by-2.5", "cc-by-nc-sa-2.0",
        "cdla-sharing-1.0", "lgpl-lr", "deepfloyd-if-license", "odbl", "osl-3.0",
        "ms-pl", "eupl-1.1", "afl-3.0"
    ])
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
    if (val == null) return 'None';
    return Array.isArray(val) ? (val.length > 0 ? String(val[0]) : 'None') : String(val);
};

async function writeChunk(ws, chunk) {
    if (!ws.write(chunk)) {
        await new Promise((resolve, reject) => {
            ws.once('drain', resolve);
            ws.once('error', reject);
        });
    }
}

async function closeStream(ws) {
    await new Promise((resolve, reject) => {
        ws.end(resolve);
        ws.on('error', reject);
    });
}

async function writeLargeJsonArray(filePath, arr) {
    const ws = fs.createWriteStream(filePath, { encoding: 'utf8' });
    try {
        await writeChunk(ws, '[');
        for (let i = 0; i < arr.length; i++) {
            if (i > 0) await writeChunk(ws, ',');
            await writeChunk(ws, JSON.stringify(arr[i] ?? null));
        }
        await writeChunk(ws, ']');
        await closeStream(ws);
    } catch (err) {
        ws.destroy();
        throw err;
    }
}

async function writeLargeJsonObjectByIterator(filePath, entriesIteratorFactory) {
    const ws = fs.createWriteStream(filePath, { encoding: 'utf8' });
    try {
        await writeChunk(ws, '{');
        let first = true;

        for (const [key, value] of entriesIteratorFactory()) {
            if (value === undefined) continue;

            if (!first) await writeChunk(ws, ',');
            first = false;

            await writeChunk(ws, JSON.stringify(String(key)));
            await writeChunk(ws, ':');
            await writeChunk(ws, JSON.stringify(value));
        }

        await writeChunk(ws, '}');
        await closeStream(ws);
    } catch (err) {
        ws.destroy();
        throw err;
    }
}

// --- 4. 合规性分析核心函数 ---
function runComplianceAnalysis(graph) {
    console.log('🕵️ 开始合规性分析...');
    const progressBar = new cliProgress.SingleBar(
        { format: 'Analysis |{bar}| {percentage}% || {value}/{total} Nodes' },
        cliProgress.Presets.shades_classic
    );
    progressBar.start(graph.getNodesCount(), 0);

    // 数据里的边方向是「派生模型 -> 基础模型」(child -> parent)
    // 合规传播按「基础模型 -> 派生模型」方向扩散，所以这里翻转一次
    const propChildren = new Map(); // Parent/Base -> [Derived Children]
    const propParents = new Map();  // Child/Derived -> [Base Parents]

    graph.forEachLink(link => {
        if (link.data && link.data.type && CONFIG.PROPAGATION_TYPES.has(link.data.type)) {
            const childId = link.fromId;
            const parentId = link.toId;

            if (!propChildren.has(parentId)) propChildren.set(parentId, []);
            propChildren.get(parentId).push(childId);

            if (!propParents.has(childId)) propParents.set(childId, []);
            propParents.get(childId).push(parentId);
        }
    });

    function addRisk(node, type, reason) {
        if (!node.data.compliance) {
            node.data.compliance = { risks: [], status: 'compliant' };
        }
        const level = RISK_LEVELS[type] || 'Warning';

        const exists = node.data.compliance.risks.some(r => r.type === type && r.reason === reason);
        if (!exists) {
            node.data.compliance.risks.push({ type, level, reason });
        }

        if (level === 'Error') {
            node.data.compliance.status = 'error';
        } else if (level === 'Warning' && node.data.compliance.status !== 'error') {
            node.data.compliance.status = 'warning';
        }
    }

    // --- Step 1: 归一化 ---
    graph.forEachNode(node => {
        const data = node.data || {};
        const rawLicense = safeString(data.license);
        const rawName = safeString(data.license_name);

        let fixed = rawLicense;
        const isNoneOrOther = (rawLicense === 'None' || rawLicense === 'other');

        if (!rawLicense || rawLicense === 'null' || rawLicense === 'undefined' || rawLicense === 'unknown') {
            fixed = 'None';
        } else if (isNoneOrOther) {
            if (rawName.includes('llama-3') || rawName === 'llama3') fixed = 'llama3';
            else if (rawName.includes('gemma')) fixed = 'gemma';
            else if (rawName.includes('apple')) fixed = 'apple-ascl';
            else if (rawName.includes('mit')) fixed = 'mit';
        }

        node.data.fixed_license = fixed;
        node.data.compliance = { risks: [], status: 'compliant' };
        progressBar.increment();
    });
    progressBar.stop();

    console.log('   - Normalized licenses. Analyzing risks...');

    // --- Step 2: 本地风险 ---
    graph.forEachNode(node => {
        const fl = node.data.fixed_license;
        if (RISK_LISTS.h_Mismatch.has(fl)) {
            const modelId = safeString(node.data.model_id).toLowerCase();
            const isLlama = modelId.includes('llama');
            const isInvalidData = ['None', 'unknown', 'null', 'undefined', 'other'].includes(fl);

            if (isInvalidData) {
                addRisk(node, 'h_Mismatch', `License information is missing or unknown ('${fl}').`);
            } else if (isLlama) {
                addRisk(node, 'h_Mismatch', `Llama-related model using generic license '${fl}' (expected specific Llama license).`);
            }
        }
    });

    // --- Step 3: 传播逻辑 ---
    function checkDownstreamPropagation(sourceConditionFn, targetConditionFn, riskType, reasonFn) {
        const sources = [];
        graph.forEachNode(node => {
            if (sourceConditionFn(node)) sources.push(node);
        });

        sources.forEach(sourceNode => {
            const sourceLic = sourceNode.data.fixed_license;
            const sourceIdStr = safeString(sourceNode.data.model_id);
            const riskReason = reasonFn(sourceLic, sourceIdStr);

            const queue = [sourceNode.id];
            const visited = new Set([sourceNode.id]);

            while (queue.length > 0) {
                const currId = queue.shift();

                if (currId !== sourceNode.id) {
                    const currNode = graph.getNode(currId);
                    if (currNode && targetConditionFn(sourceNode, currNode)) {
                        addRisk(currNode, riskType, riskReason);
                    }
                }

                const children = propChildren.get(currId);
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
    checkDownstreamPropagation(
        (src) => RISK_LISTS.g_Source.has(src.data.fixed_license),
        (src, curr) => curr.data.fixed_license !== src.data.fixed_license,
        'g_Copyleft_Terms',
        (srcLic, srcId) => `Inherited restrictive terms from ${srcId} (${srcLic}).`
    );

    checkDownstreamPropagation(
        (src) => RISK_LISTS.f_Source.has(src.data.fixed_license),
        (src, curr) => curr.data.fixed_license !== src.data.fixed_license,
        'f_Copyleft',
        (srcLic, srcId) => `Inherited copyleft obligations from ${srcId} (${srcLic}).`
    );

    checkDownstreamPropagation(
        (src) => RISK_LISTS.e_Source.has(src.data.fixed_license),
        () => true,
        'e_Conflict_ND',
        (srcLic, srcId) => `Violates No-Derivatives term from ${srcId} (${srcLic}).`
    );

    checkDownstreamPropagation(
        (src) => RISK_LISTS.d_Source.has(src.data.fixed_license),
        (src, curr) => RISK_LISTS.d_ConflictTarget.has(curr.data.fixed_license),
        'd_Conflict_CC',
        (srcLic, srcId) => `CC License (${srcLic}) from ${srcId} conflicts with downstream license.`
    );

    // --- Step 5: FSF Conflict ---
    graph.forEachNode(node => {
        if (RISK_LISTS.c_Source.has(node.data.fixed_license)) {
            const parents = propParents.get(node.id);
            if (!parents) return;

            const conflictParents = [];
            for (const pid of parents) {
                const pNode = graph.getNode(pid);
                if (pNode && RISK_LISTS.c_ConflictParent.has(pNode.data.fixed_license)) {
                    conflictParents.push(safeString(pNode.data.model_id));
                }
            }

            if (conflictParents.length > 0) {
                const reason = `GPL model derived from incompatible parents: ${conflictParents.slice(0, 3).join(', ')}.`;
                addRisk(node, 'c_Conflict_FSF', reason);

                checkDownstreamPropagation(
                    (src) => src.id === node.id,
                    () => true,
                    'c_Conflict_FSF',
                    (srcLic, srcId) => `Inherited FSF conflict from upstream ${srcId}.`
                );
            }
        }
    });

    // --- Step 6: Llama Lineage ---
    function analyzeLineage(keyword, licenseKey, riskType) {
        const officialRootIds = new Set();
        graph.forEachNode(node => {
            if (safeString(node.data.model_id).includes(keyword)) officialRootIds.add(node.id);
        });

        const validFamilyIds = new Set(officialRootIds);
        const queue = Array.from(officialRootIds);

        while (queue.length > 0) {
            const uId = queue.shift();
            const children = propChildren.get(uId);
            if (children) {
                for (const vId of children) {
                    if (!validFamilyIds.has(vId)) {
                        validFamilyIds.add(vId);
                        queue.push(vId);
                    }
                }
            }
        }

        const lineageSources = [];
        graph.forEachNode(node => {
            if (node.data.fixed_license === licenseKey) {
                const parents = propParents.get(node.id);
                if (parents) {
                    let isInvalid = false;
                    const invalidParentNames = [];

                    for (const pid of parents) {
                        if (!validFamilyIds.has(pid)) {
                            isInvalid = true;
                            const parentNode = graph.getNode(pid);
                            invalidParentNames.push(parentNode ? safeString(parentNode.data.model_id) : String(pid));
                        }
                    }

                    if (isInvalid) {
                        const reason = `Unofficial lineage: Parent(s) [${invalidParentNames.slice(0, 3).join(', ')}] are not in official ${keyword} family.`;
                        addRisk(node, riskType, reason);
                        lineageSources.push(node);
                    }
                }
            }
        });

        lineageSources.forEach(sourceNode => {
            checkDownstreamPropagation(
                (src) => src.id === sourceNode.id,
                () => true,
                riskType,
                (srcLic, srcId) => `Inherited Lineage conflict from ${srcId}.`
            );
        });
    }

    analyzeLineage('meta-llama/Llama-2-', 'llama2', 'b_Conflict_La2E');
    analyzeLineage('meta-llama/Meta-Llama-3-', 'llama3', 'a_Conflict_La3E');

    console.log('✅ 多重风险分析完成。');
}

// --- 5. 主转换流程 ---
async function convertData() {
    const linkTypeMap = {};
    const linkTypesArray = [];
    let nextLinkTypeId = 0;
    const linkDataForSave = [];

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

        console.log('📂 Reading input JSON streams...');

        // 1) 读取 Nodes
        await new Promise((resolve, reject) => {
            const nodesStream = fs.createReadStream(CONFIG.INPUT_PATH, { encoding: 'utf8' });
            const parser = JSONStream.parse('nodes.*');

            nodesStream
                .pipe(parser)
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

        // 2) 读取 Relationships
        await new Promise((resolve, reject) => {
            const relStream = fs.createReadStream(CONFIG.INPUT_PATH, { encoding: 'utf8' });
            const parser = JSONStream.parse('relationships.*');

            relStream
                .pipe(parser)
                .pipe(through2.obj((rel, enc, cb) => {
                    if (rel && rel.start_node_id !== undefined && rel.end_node_id !== undefined) {
                        const s = nodeOriginalIdToInternalIdMap.get(rel.start_node_id);
                        const t = nodeOriginalIdToInternalIdMap.get(rel.end_node_id);

                        if (s !== undefined && t !== undefined) {
                            graph.addLink(s, t, { type: rel.type });

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

        const versionPath = path.join(CONFIG.OUTPUT_DIR, CONFIG.GRAPH_NAME, CONFIG.VERSION_NAME);
        await fs.ensureDir(versionPath);

        console.log(`\n🕸️  Running layout (${CONFIG.LAYOUT_ITERATIONS} iterations)...`);
        console.log(`   - layout cache dir: ${versionPath}`);
        console.log(`   - if ${versionPath} already has 19000.bin etc, it will resume from there`);

        const layout = createLayout(graph, {
            iterations: CONFIG.LAYOUT_ITERATIONS,
            saveEach: CONFIG.LAYOUT_SAVE_EACH,
            outDir: versionPath
        });

        // 关键：
        // layout.run() = 正常运行/尝试续跑
        // layout.run(true) = 覆盖已有迭代并重算
        layout.run();

        runComplianceAnalysis(graph);

        console.log('\n💾 Saving binary data...');

        // Save Node Data & Labels (streaming)
        console.log('   - writing nodeData.json (streaming)...');
        await writeLargeJsonObjectByIterator(
            path.join(versionPath, 'nodeData.json'),
            function* () {
                for (let id = 0; id < graph.getNodesCount(); id++) {
                    const node = graph.getNode(id);
                    if (node) yield [id, node.data];
                }
            }
        );

        console.log('   - writing labels.json (streaming)...');
        await writeLargeJsonArray(path.join(versionPath, 'labels.json'), displayLabels);

        // Save Positions
        // 注意：ngraph.offline.layout 自己也会写 positions.bin
        // 这里再写一次，是为了保持你原来的导出流程和格式显式可控
        console.log('   - writing positions.bin ...');
        const positionsArray = new Int32Array(graph.getNodesCount() * 3);
        const finalLayout = layout.getLayout();

        for (let id = 0; id < graph.getNodesCount(); id++) {
            const pos = finalLayout.getNodePosition(id);
            if (pos) {
                positionsArray[id * 3] = Math.round(pos.x || 0);
                positionsArray[id * 3 + 1] = Math.round(pos.y || 0);
                positionsArray[id * 3 + 2] = Math.round(pos.z || 0);
            }
        }

        await fs.writeFile(
            path.join(versionPath, 'positions.bin'),
            Buffer.from(positionsArray.buffer)
        );

        // Save Links (Visual Adjacency)
        console.log('   - writing links.bin ...');
        const linksBufferData = [];
        graph.forEachNode(node => {
            linksBufferData.push(-node.id - 1);
            graph.forEachLinkedNode(node.id, (linked) => {
                linksBufferData.push(linked.id + 1);
            }, true);
        });
        await fs.writeFile(
            path.join(versionPath, 'links.bin'),
            Buffer.from(new Int32Array(linksBufferData).buffer)
        );

        // Save Link Types
        console.log('   - writing link_types.json / link_data.bin ...');
        await fs.writeJson(path.join(versionPath, 'link_types.json'), linkTypesArray);
        await fs.writeFile(
            path.join(versionPath, 'link_data.bin'),
            Buffer.from(new Int32Array(linkDataForSave).buffer)
        );

        // Manifest
        await fs.writeJson(
            path.join(CONFIG.OUTPUT_DIR, CONFIG.GRAPH_NAME, 'manifest.json'),
            { all: [CONFIG.VERSION_NAME], last: CONFIG.VERSION_NAME }
        );

        // Compliance
        let problemCount = 0;
        graph.forEachNode(node => {
            if (node.data.compliance?.risks?.length > 0) {
                problemCount++;
            }
        });

        console.log('   - writing compliance_data.json (streaming)...');
        await writeLargeJsonObjectByIterator(
            path.join(versionPath, 'compliance_data.json'),
            function* () {
                for (let id = 0; id < graph.getNodesCount(); id++) {
                    const node = graph.getNode(id);
                    if (node?.data?.compliance?.risks?.length > 0) {
                        yield [id, {
                            ...node.data.compliance,
                            fixed_license: node.data.fixed_license
                        }];
                    }
                }
            }
        );

        console.log(`✅ Done. Found ${problemCount} nodes with risks.`);
    } catch (error) {
        console.error('❌ Fatal Error:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    convertData();
}

module.exports = {
    runComplianceAnalysis,
    convertData,
    writeLargeJsonArray,
    writeLargeJsonObjectByIterator
};