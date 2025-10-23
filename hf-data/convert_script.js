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
// --- 配置结束 ---

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