// src/galaxy/store/edgeFilterStore.js
import eventify from 'ngraph.events';
import appEvents from '../service/appEvents.js';
import sceneStore from './sceneStore.js'; // 确保导入的是 sceneStore

function createEdgeFilterStore() {
    let enabledTypes = new Map(); // Map<string, boolean> 类型名 -> 是否启用
    let allTypes = []; // 存储所有从数据中发现的类型

    const store = {
        getEnabledTypes: () => new Map(enabledTypes), // 返回副本以防外部修改
        getAllTypes: () => [...allTypes], // 返回副本
        toggleType: (typeName) => {
            if (enabledTypes.has(typeName)) {
                enabledTypes.set(typeName, !enabledTypes.get(typeName));
                console.log(`Edge type toggled: ${typeName} -> ${enabledTypes.get(typeName)}`); // 调试日志
                store.fire('changed'); // 触发状态变更事件
            } else {
                 console.warn(`Attempted to toggle unknown edge type: ${typeName}`);
            }
        },
        // 可选：添加全部启用/禁用的方法
        enableAll: () => {
            let changed = false;
            allTypes.forEach(type => {
                if (!enabledTypes.get(type)) {
                    enabledTypes.set(type, true);
                    changed = true;
                }
            });
            if (changed) store.fire('changed');
        },
        disableAll: () => {
             let changed = false;
            allTypes.forEach(type => {
                if (enabledTypes.get(type)) {
                    enabledTypes.set(type, false);
                    changed = true;
                }
            });
            if (changed) store.fire('changed');
        }
    };
    eventify(store);

    // 监听图谱加载完成事件来初始化类型列表
    appEvents.graphDownloaded.on(initialize);

    function initialize() {
        console.log("Initializing EdgeFilterStore...");
        enabledTypes.clear();
        allTypes = [];
        const graph = sceneStore.getGraph(); // 使用正确的 sceneStore
        const rawData = graph ? graph.getRawData() : null;
        const linkTypes = rawData ? rawData.linkTypes : []; // 从 graphStore 获取 linkTypes 数组
        const linkTypesFromData = rawData ? rawData.linkTypes : []; // 从 graphStore 获取 linkTypes 数组
        console.log("Raw linkTypes from graph data:", linkTypesFromData); // <-- 新增日志
        if (linkTypes && linkTypes.length > 0) {
            // 使用 Set 去重，然后转回数组并排序
             allTypes = [...new Set(linkTypes.filter(type => type != null && type !== ''))]; // 过滤空值并去重
            allTypes.sort(); // 按字母排序
            console.log("Filtered and sorted allTypes:", allTypes); // <-- 新增日志
            allTypes.forEach(type => {
                enabledTypes.set(type, true); // 默认全部启用
            });

             // 确保 UNKNOWN 类型存在
            if (!enabledTypes.has('UNKNOWN')) {
                allTypes.push('UNKNOWN'); // 如果数据中没有，手动添加
                enabledTypes.set('UNKNOWN', true);
            }
             allTypes.sort(); // 再次排序确保 UNKNOWN 位置正确
             console.log("Final allTypes (with UNKNOWN):", allTypes); // <-- 新增日志
        console.log("Final enabledTypes map:", enabledTypes); // <-- 新增日志

        } else {
            console.warn("No link types found in graph data during EdgeFilterStore initialization. Defaulting to UNKNOWN.");
             // 如果数据中没有 linkTypes，至少提供一个 UNKNOWN
            allTypes = ['UNKNOWN'];
            enabledTypes.set('UNKNOWN', true);
            console.log("Initialized with fallback 'UNKNOWN'."); // <-- 修改日志
        }
        console.log("EdgeFilterStore Initialization Complete.");
        store.fire('changed'); // 触发一次变更事件，让监听者获取初始状态
    }

    return store;
}

// 创建并导出单例
const edgeFilterStore = createEdgeFilterStore();
export default edgeFilterStore;