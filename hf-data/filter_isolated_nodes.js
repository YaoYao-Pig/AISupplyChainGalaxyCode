// filter_isolated_nodes.js

const fs = require('fs-extra');
const path = require('path');
const cliProgress = require('cli-progress');
const JSONStream = require('JSONStream');
const through2 = require('through2');

// --- 配置项 ---
const INPUT_JSON_PATH = './hf_database_export.json';
const OUTPUT_JSON_PATH = './hf_database_filtered.json'; // 输出的过滤后的新JSON文件
const ISOLATED_NODE_SURVIVAL_RATE = 0.1; // 孤立节点的存活率 (0.1 表示保留 10%)
const LOG_INTERVAL = 50000;
// --- 配置结束 ---

async function filterJsonFile() {
    let overallProgressBar = null;
    try {
        console.log(`🚀 开始预处理并过滤JSON文件: ${INPUT_JSON_PATH}`);
        
        const degreeMap = new Map();
        let nodesFoundInPass1 = 0;
        let relationshipsFoundInPass1 = 0;
        let fileSize = 0;

        try {
            const stats = await fs.stat(INPUT_JSON_PATH);
            fileSize = stats.size;
        } catch (e) {
            console.warn("⚠️ 无法获取文件大小用于进度条。");
        }

        // =================================================================
        // === 第一遍扫描: 计算所有节点的度
        // =================================================================
        console.log('\n--- 扫描阶段 1/2: 计算所有节点的度 ---');
        
        overallProgressBar = new cliProgress.SingleBar({
            format: '度计算 | {bar} | {percentage}% || {value_MB}/{total_MB}MB ({status_msg})',
            barCompleteChar: '\u2588', barIncompleteChar: '\u2591', hideCursor: true
        });
        if (fileSize > 0) overallProgressBar.start(Math.round(fileSize/(1024*1024)), 0, { status_msg: "初始化节点..."});
        
        // 1a: 初始化所有节点的度为 {in: 0, out: 0}
        await new Promise((resolve, reject) => {
            let bytesRead = 0;
            const stream = fs.createReadStream(INPUT_JSON_PATH, { encoding: 'utf8' });
            stream.on('data', chunk => {
                bytesRead += chunk.length;
                if (fileSize > 0 && overallProgressBar) overallProgressBar.update(Math.round(bytesRead/(1024*1024)), {status_msg: `扫描节点... (${nodesFoundInPass1})`});
            });
            stream.pipe(JSONStream.parse('nodes.*'))
                .pipe(through2.obj(function(node, enc, callback) {
                    if (node && node.id) {
                        degreeMap.set(node.id, { in: 0, out: 0 });
                        nodesFoundInPass1++;
                         if (nodesFoundInPass1 % LOG_INTERVAL === 0) {
                            if (fileSize > 0 && overallProgressBar) overallProgressBar.update(Math.round(bytesRead/(1024*1024)), {status_msg: `扫描节点... (${nodesFoundInPass1})`});
                            else process.stdout.write(`已扫描节点: ${nodesFoundInPass1}\r`);
                         }
                    }
                    callback();
                }))
                .on('error', reject)
                .on('finish', resolve);
            stream.on('error', reject);
        }).catch(err => {
            if (overallProgressBar) overallProgressBar.stop();
            console.error('\n❌ 在第一遍扫描（节点）时出错:', err);
            throw err;
        });
        if (overallProgressBar) overallProgressBar.stop();
        console.log(`\n✅ 第一遍扫描 (节点) 完成，发现 ${nodesFoundInPass1} 个节点。`);

        // 1b: 根据关系更新节点的度
        if (fileSize > 0) overallProgressBar.start(Math.round(fileSize/(1024*1024)), 0, { status_msg: "扫描关系..."});
        await new Promise((resolve, reject) => {
            let bytesRead = 0;
            const stream = fs.createReadStream(INPUT_JSON_PATH, { encoding: 'utf8' });
            stream.on('data', chunk => {
                bytesRead += chunk.length;
                if (fileSize > 0 && overallProgressBar) overallProgressBar.update(Math.round(bytesRead/(1024*1024)), {status_msg: `扫描关系... (${relationshipsFoundInPass1})`});
            });
            stream.pipe(JSONStream.parse('relationships.*'))
                .pipe(through2.obj(function(rel, enc, callback) {
                    if (rel && rel.start_node_id && rel.end_node_id) {
                        if (degreeMap.has(rel.start_node_id)) {
                            degreeMap.get(rel.start_node_id).out++;
                        }
                        if (degreeMap.has(rel.end_node_id)) {
                            degreeMap.get(rel.end_node_id).in++;
                        }
                        relationshipsFoundInPass1++;
                        if (relationshipsFoundInPass1 % LOG_INTERVAL === 0) {
                            if (fileSize > 0 && overallProgressBar) overallProgressBar.update(Math.round(bytesRead/(1024*1024)), {status_msg: `扫描关系... (${relationshipsFoundInPass1})`});
                            else process.stdout.write(`已扫描关系: ${relationshipsFoundInPass1}\r`);
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
        console.log(`\n✅ 第一遍扫描 (关系) 完成，所有节点的度已计算完毕。`);

        // =================================================================
        // === 第二遍扫描: 过滤数据并写入新文件
        // =================================================================
        console.log('\n--- 扫描阶段 2/2: 过滤并生成新的JSON文件 ---');
        
        const writeStream = fs.createWriteStream(OUTPUT_JSON_PATH, { encoding: 'utf8' });
        writeStream.write('{\n  "nodes": [\n'); // 写入新JSON的开头

        if (fileSize > 0) overallProgressBar.start(Math.round(fileSize/(1024*1024)), 0, { status_msg: "过滤节点..."});
        let isFirstNodeWritten = true;
        const keptNodeIds = new Set(); // 存储被保留的节点的ID

        // 2a: 过滤并写入节点
        await new Promise((resolve, reject) => {
            let bytesRead = 0;
            const stream = fs.createReadStream(INPUT_JSON_PATH, { encoding: 'utf8' });
            stream.on('data', chunk => {
                bytesRead += chunk.length;
                if (fileSize > 0 && overallProgressBar) overallProgressBar.update(Math.round(bytesRead/(1024*1024)), { status_msg: `过滤节点... (${keptNodeIds.size})` });
            });
            stream.pipe(JSONStream.parse('nodes.*'))
                .pipe(through2.obj(function(node, enc, callback) {
                    if (node && node.id && degreeMap.has(node.id)) {
                        const degrees = degreeMap.get(node.id);
                        const isIsolated = degrees.in === 0 && degrees.out === 0;
                        let shouldKeep = !isIsolated;

                        if (isIsolated) {
                            // 俄罗斯轮盘赌算法
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
                            keptNodeIds.add(node.id);
                        }
                    }
                    callback();
                }))
                .on('error', reject)
                .on('finish', resolve);
            stream.on('error', reject);
        }).catch(err => {
            if (overallProgressBar) overallProgressBar.stop();
            console.error('\n❌ 在第二遍扫描（过滤节点）时出错:', err);
            throw err;
        });
        if (overallProgressBar) overallProgressBar.stop();
        console.log(`\n✅ 第二遍扫描 (节点) 完成，保留了 ${keptNodeIds.size} 个节点。`);

        writeStream.write('\n  ],\n  "relationships": [\n'); // 写入节点和关系之间的部分

        // 2b: 写入关系
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
                    // 确保关系的两个端点都存在于被保留的节点中
                    if (rel && rel.start_node_id && rel.end_node_id && keptNodeIds.has(rel.start_node_id) && keptNodeIds.has(rel.end_node_id)) {
                        if (!isFirstRelWritten) {
                            writeStream.write(',\n');
                        }
                        writeStream.write(JSON.stringify(rel));
                        isFirstRelWritten = false;
                        relationshipsWritten++;
                    }
                    callback();
                }))
                .on('error', reject)
                .on('finish', resolve);
            stream.on('error', reject);
        }).catch(err => {
            if (overallProgressBar) overallProgressBar.stop();
            console.error('\n❌ 在第二遍扫描（写入关系）时出错:', err);
            throw err;
        });
        if (overallProgressBar) overallProgressBar.stop();
        console.log(`\n✅ 第二遍扫描 (关系) 完成，写入了 ${relationshipsWritten} 条关系。`);

        writeStream.write('\n  ]\n}\n'); // 写入JSON的结尾
        writeStream.end();

        await new Promise(resolve => writeStream.on('finish', resolve));

        console.log('\n🎉 --- JSON文件过滤完成! --- 🎉');
        console.log(`新的、经过过滤的JSON文件已保存至: ${OUTPUT_JSON_PATH}`);
        console.log(`下一步，请使用您之前的布局计算脚本来处理这个新的、更小的文件。`);

    } catch (error) {
        if (overallProgressBar && typeof overallProgressBar.stop === 'function' && overallProgressBar.isActive) {
            overallProgressBar.stop();
        }
        console.error('❌ 处理过程中发生致命错误:', error);
        process.exit(1);
    }
}

filterJsonFile();