// filter_isolated_nodes_optimized.js

const fs = require('fs-extra');
const path = require('path');
const cliProgress = require('cli-progress');
const JSONStream = require('JSONStream');
const through2 = require('through2');

// --- 配置项 ---
const INPUT_JSON_PATH = './output_graph.json';
const OUTPUT_JSON_PATH = './output_graph_filtered.json';
const ISOLATED_NODE_SURVIVAL_RATE = 0.1; 
const LOG_INTERVAL = 50000;
// --- 配置结束 ---

async function filterJsonFile() {
    let overallProgressBar = null;
    try {
        console.log(`🚀 (内存优化版) 开始预处理并过滤JSON文件: ${INPUT_JSON_PATH}`);
        
        // 关键优化：使用 Set 仅存储"有关系的节点ID"，不再存储对象
        const connectedNodeIds = new Set(); 
        
        let relationshipsFoundInPass1 = 0;
        let fileSize = 0;

        try {
            const stats = await fs.stat(INPUT_JSON_PATH);
            fileSize = stats.size;
        } catch (e) {
            console.warn("⚠️ 无法获取文件大小用于进度条。");
        }

        // =================================================================
        // === 第一遍扫描: 扫描关系，找出所有"非孤立"的节点ID
        // =================================================================
        // 逻辑变更：先扫关系。因为只要出现在关系里，就一定不是孤立节点。
        console.log('\n--- 扫描阶段 1/2: 标记活跃节点 (扫描关系) ---');
        
        overallProgressBar = new cliProgress.SingleBar({
            format: '标记活跃节点 | {bar} | {percentage}% || {value_MB}/{total_MB}MB ({status_msg})',
            barCompleteChar: '\u2588', barIncompleteChar: '\u2591', hideCursor: true
        });
        if (fileSize > 0) overallProgressBar.start(Math.round(fileSize/(1024*1024)), 0, { status_msg: "初始化..."});
        
        await new Promise((resolve, reject) => {
            let bytesRead = 0;
            const stream = fs.createReadStream(INPUT_JSON_PATH, { encoding: 'utf8' });
            stream.on('data', chunk => {
                bytesRead += chunk.length;
                if (fileSize > 0 && overallProgressBar) overallProgressBar.update(Math.round(bytesRead/(1024*1024)), {status_msg: `发现关联节点... (Set大小: ${connectedNodeIds.size})`});
            });
            
            // 只解析 relationships
            stream.pipe(JSONStream.parse('relationships.*'))
                .pipe(through2.obj(function(rel, enc, callback) {
                    if (rel && rel.start_node_id && rel.end_node_id) {
                        // 只要在关系中出现过，就加入 Set
                        connectedNodeIds.add(rel.start_node_id);
                        connectedNodeIds.add(rel.end_node_id);
                        
                        relationshipsFoundInPass1++;
                        if (relationshipsFoundInPass1 % LOG_INTERVAL === 0) {
                             if (!overallProgressBar) process.stdout.write(`已扫描关系: ${relationshipsFoundInPass1}, 活跃节点数: ${connectedNodeIds.size}\r`);
                        }
                    }
                    callback();
                }))
                .on('error', reject)
                .on('finish', resolve);
            stream.on('error', reject);
        }).catch(err => {
            if (overallProgressBar) overallProgressBar.stop();
            console.error('\n❌ 在第一遍扫描（关系）时出错:', err);
            throw err;
        });
        
        if (overallProgressBar) overallProgressBar.stop();
        console.log(`\n✅ 第一遍扫描完成。发现 ${relationshipsFoundInPass1} 条关系，涉及 ${connectedNodeIds.size} 个活跃节点。`);
        
        // 显式垃圾回收建议（如果运行环境开启了 --expose-gc，但通常不需要）
        // global.gc && global.gc();

        // =================================================================
        // === 第二遍扫描: 过滤数据并写入新文件
        // =================================================================
        console.log('\n--- 扫描阶段 2/2: 过滤并生成新的JSON文件 ---');
        
        const writeStream = fs.createWriteStream(OUTPUT_JSON_PATH, { encoding: 'utf8' });
        writeStream.write('{\n  "nodes": [\n'); 

        if (fileSize > 0) overallProgressBar.start(Math.round(fileSize/(1024*1024)), 0, { status_msg: "过滤节点..."});
        
        let isFirstNodeWritten = true;
        const finalKeptNodeIds = new Set(); // 记录最终写入文件的节点ID（包含原本活跃的 + 幸运存活的孤立节点）

        // 2a: 过滤并写入节点
        let nodesProcessed = 0;
        await new Promise((resolve, reject) => {
            let bytesRead = 0;
            const stream = fs.createReadStream(INPUT_JSON_PATH, { encoding: 'utf8' });
            stream.on('data', chunk => {
                bytesRead += chunk.length;
                if (fileSize > 0 && overallProgressBar) overallProgressBar.update(Math.round(bytesRead/(1024*1024)), { status_msg: `处理节点... (${nodesProcessed})` });
            });
            
            stream.pipe(JSONStream.parse('nodes.*'))
                .pipe(through2.obj(function(node, enc, callback) {
                    nodesProcessed++;
                    if (node && node.id) {
                        // 判断是否孤立：如果 ID 不在 connectedNodeIds 集合中，就是孤立的
                        const isConnected = connectedNodeIds.has(node.id);
                        let shouldKeep = isConnected;

                        if (!isConnected) {
                            // 它是孤立节点，进行轮盘赌
                            if (Math.random() < ISOLATED_NODE_SURVIVAL_RATE) {
                                shouldKeep = true;
                            }
                        }

                        if (shouldKeep) {
                            if (!isFirstNodeWritten) {
                                writeStream.write(',\n');
                            }
                            writeStream.write(JSON.stringify(node));
                            isFirstNodeWritten = false;
                            finalKeptNodeIds.add(node.id); // 记录下来，供后面写关系时验证
                        }
                    }
                    callback();
                }))
                .on('error', reject)
                .on('finish', resolve);
            stream.on('error', reject);
        }).catch(err => {
            if (overallProgressBar) overallProgressBar.stop();
            throw err;
        });
        
        // 释放掉第一阶段的大 Set，回收内存
        connectedNodeIds.clear(); 
        
        if (overallProgressBar) overallProgressBar.stop();
        console.log(`\n✅ 节点写入完成。最终保留节点数: ${finalKeptNodeIds.size} (处理总数: ${nodesProcessed})`);

        writeStream.write('\n  ],\n  "relationships": [\n');

        // 2b: 写入关系
        // 注意：虽然第一遍扫过关系，但我们必须保证关系的 *两端* 都在 finalKeptNodeIds 里。
        // (因为理论上非孤立节点都会被保留，但为了数据一致性，最好还是检查一下)
        if (fileSize > 0) overallProgressBar.start(Math.round(fileSize/(1024*1024)), 0, { status_msg: "写入关系..."});
        
        let isFirstRelWritten = true;
        let relationshipsWritten = 0;
        
        await new Promise((resolve, reject) => {
            let bytesRead = 0;
            const stream = fs.createReadStream(INPUT_JSON_PATH, { encoding: 'utf8' });
            stream.on('data', chunk => {
                bytesRead += chunk.length;
                if (fileSize > 0 && overallProgressBar) overallProgressBar.update(Math.round(bytesRead/(1024*1024)), { status_msg: `写入关系... (${relationshipsWritten})` });
            });
            
            stream.pipe(JSONStream.parse('relationships.*'))
                .pipe(through2.obj(function(rel, enc, callback) {
                    // 确保两端都在最终保留的节点列表中
                    if (rel && rel.start_node_id && rel.end_node_id) {
                        if (finalKeptNodeIds.has(rel.start_node_id) && finalKeptNodeIds.has(rel.end_node_id)) {
                            if (!isFirstRelWritten) {
                                writeStream.write(',\n');
                            }
                            writeStream.write(JSON.stringify(rel));
                            isFirstRelWritten = false;
                            relationshipsWritten++;
                        }
                    }
                    callback();
                }))
                .on('error', reject)
                .on('finish', resolve);
            stream.on('error', reject);
        }).catch(err => {
            if (overallProgressBar) overallProgressBar.stop();
            throw err;
        });
        
        if (overallProgressBar) overallProgressBar.stop();
        console.log(`\n✅ 关系写入完成。写入了 ${relationshipsWritten} 条关系。`);

        writeStream.write('\n  ]\n}\n');
        writeStream.end();

        await new Promise(resolve => writeStream.on('finish', resolve));

        console.log('\n🎉 --- JSON文件过滤完成! --- 🎉');

    } catch (error) {
        if (overallProgressBar && overallProgressBar.stop) overallProgressBar.stop();
        console.error('❌ 错误:', error);
        process.exit(1);
    }
}

filterJsonFile();