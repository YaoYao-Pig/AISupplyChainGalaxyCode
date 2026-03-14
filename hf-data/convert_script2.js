// convert_script_use_existing_layout.js

const createGraphNgraph = require('ngraph.graph');
// const createLayout = require('ngraph.offline.layout'); // 如果不重新计算布局，这个可能不需要了
const fs = require('fs-extra');
const path = require('path');
const cliProgress = require('cli-progress');
const JSONStream = require('JSONStream');
const through2 = require('through2');

// --- 配置项 ---
const INPUT_JSON_PATH = path.resolve(__dirname, 'output_graph_filtered.json');
const OUTPUT_DIR = path.resolve(__dirname, 'galaxy_output_data');
const GRAPH_NAME = 'my_model_galaxy';
const VERSION_NAME = 'v1_updated_links'; // 可以用新版本名区分
// const LAYOUT_ITERATIONS = 500; // 如果不重新计算布局，这个用不到

const USE_EXISTING_POSITIONS = true; // <--- 新增配置：是否使用已有的positions.bin
const EXISTING_POSITIONS_PATH = path.resolve(__dirname, 'data', 'positions.bin'); // <--- 新增配置：已有的positions.bin路径
// 注意：上面的 EXISTING_POSITIONS_PATH 假设了之前的输出目录结构和版本名是 'v1'

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
    if (USE_EXISTING_POSITIONS) {
        console.log(`ℹ️ 将使用已有的位置文件: ${EXISTING_POSITIONS_PATH}`);
    }

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

    // --- 阶段1: 处理节点 (始终需要从原始JSON获取节点信息以确保映射和标签一致) ---
    console.log(`📄 正在流式处理节点从 (用于标签和ID映射): ${INPUT_JSON_PATH}`);
    overallProgressBar = new cliProgress.SingleBar({
        format: 'JSON 节点处理 |' + '{bar}' + '| {percentage}% || {value_MB}/{total_MB}MB ({status_msg})',
        barCompleteChar: '\u2588', barIncompleteChar: '\u2591', hideCursor: true
    });
    if (fileSize > 0) overallProgressBar.start(Math.round(fileSize / (1024*1024)), 0, { status_msg: "处理节点..."});

    let nodeStreamBytesRead = 0;
    await new Promise((resolveNodePromise, rejectNodePromise) => {
        const nodesFileStream = fs.createReadStream(INPUT_JSON_PATH, { encoding: 'utf8' });
        nodesFileStream.on('data', chunk => {
            nodeStreamBytesRead += chunk.length;
            if (fileSize > 0 && overallProgressBar) {
                overallProgressBar.update(Math.round(nodeStreamBytesRead/(1024*1024)), {status_msg: `处理节点... (${nodesProcessed})`});
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
                graph.addNode(currentInternalId, { originalId: node.id });
                nodesProcessed++;
                if (nodesProcessed % LOG_INTERVAL === 0) {
                   if (fileSize > 0 && overallProgressBar) overallProgressBar.update(Math.round(nodeStreamBytesRead/(1024*1024)), { status_msg: `处理节点... (${nodesProcessed})` });
                   else process.stdout.write(`已处理节点: ${nodesProcessed}\r`);
                }
            } catch (e) { console.error('\n❌ 处理单个节点时出错:', e); }
            callback();
        });
        nodesFileStream.pipe(JSONStream.parse('nodes.*')).pipe(nodeProcessor)
            .on('error', rejectNodePromise)
            .on('finish', resolveNodePromise);
        nodesFileStream.on('error', rejectNodePromise);
    }).catch(err => {
        if (overallProgressBar) overallProgressBar.stop();
        console.error('\n❌ 节点JSON解析或处理流错误:', err);
        throw err;
    });
    if (overallProgressBar && fileSize > 0) overallProgressBar.update(Math.round(nodeStreamBytesRead/(1024*1024)), { status_msg: `节点处理完毕 (${nodesProcessed})`});
    else process.stdout.write(`\n✅ 所有节点 (${nodesProcessed}) 已从流中处理并构建映射与标签。\n`);
    if (overallProgressBar) overallProgressBar.stop();


    // --- 加载或验证节点数量 ---
    const numNodesFromGraph = graph.getNodesCount();
    console.log(`图谱中已构建 ${numNodesFromGraph} 个节点。`);
    if (numNodesFromGraph === 0) {
        console.error("❌ 未能从JSON中构建任何节点，无法继续。");
        process.exit(1);
    }

    let positionsArray;
    if (USE_EXISTING_POSITIONS) {
        console.log(`💾 正在读取已有的位置文件: ${EXISTING_POSITIONS_PATH}`);
        if (!await fs.pathExists(EXISTING_POSITIONS_PATH)) {
            throw new Error(`错误：指定的位置文件不存在 ${EXISTING_POSITIONS_PATH}`);
        }
        const positionBuffer = await fs.readFile(EXISTING_POSITIONS_PATH);
        positionsArray = new Int32Array(positionBuffer.buffer, positionBuffer.byteOffset, positionBuffer.byteLength / Int32Array.BYTES_PER_ELEMENT);
        
        if (positionsArray.length !== numNodesFromGraph * 3) {
            console.error(`❌ 错误：读取的位置文件中的数据量 (${positionsArray.length} 个值) 与图中的节点数量 (${numNodesFromGraph} 个节点 * 3 = ${numNodesFromGraph*3} 个值) 不匹配!`);
            console.error(`请确保 EXISTING_POSITIONS_PATH 指向正确的、与当前节点数据对应的 positions.bin 文件。`);
            process.exit(1);
        }
        console.log(`✅ 已成功加载 ${positionsArray.length / 3} 个节点的位置信息。`);
    } else {
        // --- 如果不使用已有的，则进行布局计算 (这部分代码与之前类似) ---
        console.log(`🎨 需要计算新的3D布局...`);
        const createLayout = require('ngraph.offline.layout'); // 仅在需要时加载
        const LAYOUT_ITERATIONS_FOR_NEW = 500; // 可以为新布局设置不同的迭代次数

        const layout = createLayout(graph, {
          dimensions: 3,
          iterations: LAYOUT_ITERATIONS_FOR_NEW,
        });
        if (!layout || typeof layout.run !== 'function') {
            throw new Error('布局对象创建失败或API不匹配 (run 方法未找到)。');
        }
        console.log(`⏳ 开始执行 layout.run() (迭代 ${LAYOUT_ITERATIONS_FOR_NEW} 次)... 这可能需要较长时间。`);
        // 可以为这个新的布局计算添加一个新的 cli-progress 实例，如果需要的话
        layout.run();
        console.log('\n✅ 新的3D布局计算完成。');
        
        positionsArray = new Int32Array(numNodesFromGraph * 3);
        const finalPositions = layout.getLayout(); // 获取位置
         if (!finalPositions) {
            throw new Error("无法从新布局中获取节点位置。");
        }
        for (let internalId = 0; internalId < numNodesFromGraph; internalId++) {
            const pos = finalPositions[internalId];
            if (!pos || typeof pos.x !== 'number' || typeof pos.y !== 'number' || typeof pos.z !== 'number') {
                console.warn(`⚠️ 未能获取节点 internalId ${internalId} 的新布局位置! 使用默认值(0,0,0).`);
                positionsArray[internalId * 3]     = 0;
                positionsArray[internalId * 3 + 1] = 0;
                positionsArray[internalId * 3 + 2] = 0;
            } else {
                positionsArray[internalId * 3]     = Math.round(pos.x);
                positionsArray[internalId * 3 + 1] = Math.round(pos.y);
                positionsArray[internalId * 3 + 2] = Math.round(pos.z);
            }
        }
    }

    // --- 阶段2: 处理关系 (始终需要从原始JSON获取，以构建 links.bin) ---
    console.log(`🔗 正在流式处理关系从 (用于 links.bin): ${INPUT_JSON_PATH}`);
    overallProgressBar = new cliProgress.SingleBar({ // 可以重新初始化或用新的实例
        format: 'JSON 关系处理 |' + '{bar}' + '| {percentage}% || {value_MB}/{total_MB}MB ({status_msg})',
        barCompleteChar: '\u2588', barIncompleteChar: '\u2591', hideCursor: true
    });
    if (fileSize > 0) overallProgressBar.start(Math.round(fileSize/(1024*1024)), 0, { status_msg: "处理关系..."});
    
    let relationshipStreamBytesRead = 0;
    await new Promise((resolveRelPromise, rejectRelPromise) => {
        const relationshipsFileStream = fs.createReadStream(INPUT_JSON_PATH, { encoding: 'utf8' });
        relationshipsFileStream.on('data', chunk => {
            relationshipStreamBytesRead += chunk.length;
            if (fileSize > 0 && overallProgressBar) {
                overallProgressBar.update(Math.round(relationshipStreamBytesRead/(1024*1024)), {status_msg: `处理关系... (${relationshipsProcessed})`});
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
                if (relationshipsProcessed % LOG_INTERVAL === 0) {
                   if (fileSize > 0 && overallProgressBar) overallProgressBar.update(Math.round(relationshipStreamBytesRead/(1024*1024)), { status_msg: `处理关系... (${relationshipsProcessed})` });
                   else process.stdout.write(`已处理关系: ${relationshipsProcessed}\r`);
                }
            } catch (e) { console.error('\n❌ 处理单个关系时出错:', e); }
            callback();
        });
        relationshipsFileStream.pipe(JSONStream.parse('relationships.*')).pipe(relationshipProcessor)
            .on('error', rejectRelPromise)
            .on('finish', resolveRelPromise);
        relationshipsFileStream.on('error', rejectRelPromise);
    }).catch(err => {
        if (overallProgressBar) overallProgressBar.stop();
        console.error('\n❌ 关系JSON解析或处理流错误:', err);
        throw err;
    });
    if (overallProgressBar && fileSize > 0) overallProgressBar.update(Math.round(relationshipStreamBytesRead/(1024*1024)), { status_msg: `关系处理完毕 (${relationshipsProcessed})`});
    else process.stdout.write(`\n✅ 所有关系 (${relationshipsProcessed}) 已从流中处理并添加到图谱中。\n`);
    if (overallProgressBar) overallProgressBar.stop();
    
    console.log(`✅ 图谱连接关系构建完成: ${graph.getNodesCount()} 个节点, ${graph.getLinksCount()} 条边。`);
    if (relationshipsProcessed === 0 && graph.getLinksCount() > 0) {
        // 这可能意味着关系是从其他地方加载的，或者这里的逻辑有误
        console.warn("⚠️ 关系处理计数为0，但图中存在边。");
    }


    // --- 保存文件 ---
    const versionSpecificPath = path.join(OUTPUT_DIR, GRAPH_NAME, VERSION_NAME);
    await fs.ensureDir(versionSpecificPath);
    console.log(`📁 输出目录已确保/创建: ${versionSpecificPath}`);

    // 保存 labels.json (与之前一样，基于第一次节点处理的结果)
    const labelsFilePath = path.join(versionSpecificPath, 'labels.json');
    await fs.writeJson(labelsFilePath, displayLabels, { spaces: 2 });
    console.log(`💾 Saved labels.json (包含 ${displayLabels.length} 个标签)`);

    // 保存 positions.bin (使用已加载的或新计算的 positionsArray)
    const positionsFilePath = path.join(versionSpecificPath, 'positions.bin');
    await fs.writeFile(positionsFilePath, Buffer.from(positionsArray.buffer));
    console.log(`💾 Saved positions.bin`);


    // 保存 links.bin (基于重新处理的关系)
    const linksDataArray = [];
    graph.forEachNode(node => {
      linksDataArray.push(-node.id - 1);
      graph.forEachLinkedNode(node.id, (linkedNode, link) => {
        linksDataArray.push(linkedNode.id + 1);
      }, true);
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

    // 保存 manifest.json
    const manifestFilePath = path.join(OUTPUT_DIR, GRAPH_NAME, 'manifest.json');
    const manifestContent = { all: [VERSION_NAME], last: VERSION_NAME };
    await fs.writeJson(manifestFilePath, manifestContent, { spaces: 2 });
    console.log(`💾 Saved manifest.json`);

    console.log('\n🎉 --- 数据转换全部完成! --- 🎉');
    // ... (后续指引)

  } catch (error) {
    if (overallProgressBar && typeof overallProgressBar.stop === 'function' && overallProgressBar.isActive) {
        overallProgressBar.stop();
    }
    console.error('❌ 处理过程中发生致命错误 (最外层catch):', error);
    process.exit(1);
  }
}

convertData();

