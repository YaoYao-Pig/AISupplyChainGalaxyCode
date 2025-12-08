import loadGraph from  '../service/graphLoader.js';
import appEvents from '../service/appEvents.js';
import findCommunities from 'ngraph.louvain';
import createNgraph from 'ngraph.graph';
import eventify from 'ngraph.events';
import { isLicenseCompatible } from './licenseUtils.js'; // 确保导入这个工具函数
export default sceneStore();

function sceneStore() {
  var loadInProgress = true;
  var currentGraphName;
  var unknownNodeInfo = { inDegree: '?', outDegree: '?' };

  var graph;
  var modelIdToNodeIdMap = new Map();
  var communities;

  var api = {
    isLoading: isLoading,
    getGraph: getGraph,
    getGraphName: getGraphName,
    getNodeInfo: getNodeInfo,
    getConnected: getConnected,
    find: find,
    findByTag: (tag) => graph ? graph.findByTag(tag) : [],
    getNodeIdByModelId: (modelId) => modelIdToNodeIdMap.get(modelId),
    
    getTopNModelsByInDegree: (n) => {
        // ... (保持原样)
        if (!graph) return [];
        const allNodes = [];
        const labels = graph.getRawData ? graph.getRawData().labels : [];
        if (labels.length === 0) return [];
        for(let i = 0; i < labels.length; i++) {
            const nodeInfo = graph.getNodeInfo(i);
            if(nodeInfo) {
            allNodes.push({ id: i, name: nodeInfo.name, inDegree: nodeInfo.in || 0 });
            }
        }
        return allNodes.sort((a, b) => b.inDegree - a.inDegree).slice(0, n);
    },

    getTopNModelsByCentrality: (n) => {
        // ... (保持原样)
        if (!graph) return [];
        const allNodes = [];
        const labels = graph.getRawData ? graph.getRawData().labels : [];
        if (labels.length === 0) return [];
        for (let i = 0; i < labels.length; i++) {
            const nodeInfo = graph.getNodeInfo(i);
            if (nodeInfo) {
            const centrality = (nodeInfo.in || 0) + (nodeInfo.out || 0);
            allNodes.push({ id: i, name: nodeInfo.name, centrality: centrality });
            }
        }
        return allNodes.sort((a, b) => b.centrality - a.centrality).slice(0, n);
    },

    getCommunities: () => communities,

    calculateCommunitiesForDate: (limitDate) => {
      if (!graph) return null;
      // console.log(`Calculating communities for data up to ${limitDate ? limitDate.toISOString() : 'end of time'}`);

      const ngraph = createNgraph();
      const rawData = graph.getRawData();
      if (!rawData || !rawData.labels || !rawData.outLinks || !rawData.nodeData) {
        return null;
      }
      
      const visibleNodeIds = new Set();
      for (let i = 0; i < rawData.nodeData.length; i++) {
        const node = rawData.nodeData[i];
        // 如果没有日期限制(limitDate为null)，或者节点日期在限制之前
        if (!limitDate || (node && node.createdAt && new Date(node.createdAt) <= limitDate)) {
          visibleNodeIds.add(i);
          ngraph.addNode(i);
        }
      }

      // 构建子图连接
      rawData.outLinks.forEach((links, fromId) => {
        if (links && visibleNodeIds.has(fromId)) {
          links.forEach(toId => {
            if (visibleNodeIds.has(toId)) { ngraph.addLink(fromId, toId); }
          });
        }
      });
      
      if (ngraph.getNodesCount() === 0) return { result: null, nodeIds: new Set(), centroids: [] };

      // 运行社区发现
      const communityResult = findCommunities(ngraph);
      
      // *** 新增: 计算社区气泡数据 (质心) ***
      const centroids = calculateCentroids(communityResult, visibleNodeIds, rawData.positions);

      return {
        result: communityResult,
        nodeIds: visibleNodeIds,
        centroids: centroids // 返回气泡数据
      };
    },


    // *** 新增：寻找替代模型 ***
    findAlternativeModels: (targetNodeId, targetLicense) => {
        if (!graph) return [];
        const targetNodeData = graph.getNodeData(targetNodeId);
        const targetNodeInfo = graph.getNodeInfo(targetNodeId);
        if (!targetNodeData || !targetNodeData.tags) return [];

        // 1. 确定目标标签（排除通用标签）
        const tags = targetNodeData.tags.filter(t => 
            !t.startsWith('license:') && 
            !t.startsWith('base_model:') &&
            !t.startsWith('arxiv:')
        );
        if (tags.length === 0) return [];

        // 2. 搜索具有相同标签的所有节点
        const candidates = new Map();
        tags.forEach(tag => {
            const nodesWithTag = graph.findByTag(tag); // 利用 graph.js 现有的 findByTag
            nodesWithTag.forEach(node => {
                if (node.id === targetNodeId) return; // 排除自己
                
                if (!candidates.has(node.id)) {
                    candidates.set(node.id, { node: node, score: 0, sharedTags: 0 });
                }
                const cand = candidates.get(node.id);
                cand.score += 1; // 基础分：共享标签数量
                cand.sharedTags += 1;
            });
        });

        // 3. 过滤和排序
        const results = [];
        candidates.forEach((cand, id) => {
            const nodeData = graph.getNodeData(id);
            if (!nodeData) return;

            // 检查许可证是否兼容
            const licenseTag = (nodeData.tags || []).find(t => t.startsWith('license:'));
            const license = licenseTag ? licenseTag.substring(8) : (nodeData.license || 'N/A');
            
            if (isLicenseCompatible(license, targetLicense)) {
                // 加分项：流行度 (入度)
                cand.score += (cand.node.in || 0) * 0.1; 
                results.push({
                    id: id,
                    name: cand.node.name,
                    license: license,
                    score: cand.score,
                    sharedTags: cand.sharedTags
                });
            }
        });

        // 返回得分最高的 5 个
        return results.sort((a, b) => b.score - a.score).slice(0, 5);
    }

  };

  // *** 辅助函数：计算质心 ***
  function calculateCentroids(communityResult, nodeIds, positions) {
      const groups = new Map(); // communityId -> { count, xSum, ySum, zSum }

      nodeIds.forEach(nodeId => {
          const commId = communityResult.getClass(nodeId);
          if (commId === undefined) return;

          if (!groups.has(commId)) {
              groups.set(commId, { count: 0, xSum: 0, ySum: 0, zSum: 0, nodeIds: [] });
          }
          const g = groups.get(commId);
          g.count++;
          g.xSum += positions[nodeId * 3];
          g.ySum += positions[nodeId * 3 + 1];
          g.zSum += positions[nodeId * 3 + 2];
          // g.nodeIds.push(nodeId); // 可选：如果需要分析标签
      });

      const centroids = [];
      const MIN_COMMUNITY_SIZE = 5; // 过滤掉太小的碎片社区

      groups.forEach((data, commId) => {
          if (data.count < MIN_COMMUNITY_SIZE) return;
          centroids.push({
              communityId: commId,
              x: data.xSum / data.count,
              y: data.ySum / data.count,
              z: data.zSum / data.count,
              size: data.count,
              // 半径粗略估算：假设密度均匀，体积与数量成正比，半径与立方根成正比
              // 乘以系数调整视觉效果
              radius: Math.pow(data.count, 1/3) * 40 
          });
      });

      return centroids;
  }

  appEvents.downloadGraphRequested.on(downloadGraph);
  eventify(api);
  return api;

  function find(query) {
    return graph.find(query);
  }

  function isLoading() {
    return loadInProgress;
  }

  function downloadGraph(graphName) {
    if (graphName === currentGraphName) return;

    loadInProgress = true;
    currentGraphName = graphName;
    loadGraph(graphName, reportProgress).then(loadComplete);
  }

  function getGraph() {
    return graph;
  }

  function getGraphName() {
    return currentGraphName;
  }

  function getNodeInfo(nodeId) {
    if (!graph) { unknownNodeInfo.name = nodeId; return unknownNodeInfo; }
    var nodeInfo = graph.getNodeInfo(nodeId);
    if (currentGraphName === 'github') { nodeInfo.icon = 'https://avatars.githubusercontent.com/' + nodeInfo.name; }
    return nodeInfo;
  }
  function getConnected(nodeId, connectionType) {
    if (!graph) return [];
    return graph.getConnected(nodeId, connectionType);
  }
  function reportProgress(progress) { api.fire('loadProgress', progress); }

  function loadComplete(model) {
    loadInProgress = false;
    graph = model;
    communities = null; 
    
    // 初始化时计算一次全局社区（无时间限制）
    setTimeout(() => {
        // 复用 calculateCommunitiesForDate 逻辑，传 null 表示无限制
        const result = api.calculateCommunitiesForDate(null);
        if (result) {
            communities = result;
            console.log(`Global community detection complete. Found ${communities.result.count} communities.`);
        }
    }, 0);

    console.log("Building model_id to nodeId lookup table...");
    modelIdToNodeIdMap.clear();
    const labels = model.getRawData ? model.getRawData().labels : [];
    if (labels.length > 0) {
        for (let i = 0; i < labels.length; i++) {
            const nodeName = labels[i];
            if (nodeName) { modelIdToNodeIdMap.set(nodeName, i); }
        }
    }
    api.fire('loadProgress', {});
    appEvents.graphDownloaded.fire();
  }
}