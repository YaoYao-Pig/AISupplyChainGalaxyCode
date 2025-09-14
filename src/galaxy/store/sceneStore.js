/**
 * Manages graph model life cycle. The low-level rendering of the particles
 * is handled by ../native/renderer.js
 */
import loadGraph from  '../service/graphLoader.js';
import appEvents from '../service/appEvents.js';
import findCommunities from 'ngraph.louvain';
import createNgraph from 'ngraph.graph';

import eventify from 'ngraph.events';

export default sceneStore();

function sceneStore() {
  var loadInProgress = true;
  var currentGraphName;
  var unknownNodeInfo = {
    inDegree: '?',
    outDegree: '?'
  }

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

    // 这是您之前添加的函数，请保留它
    getTopNModelsByInDegree: (n) => {
      if (!graph) return [];
      
      const allNodes = [];
      const labels = graph.getRawData ? graph.getRawData().labels : [];
      if (labels.length === 0) return [];

      for(let i = 0; i < labels.length; i++) {
        const nodeInfo = graph.getNodeInfo(i);
        if(nodeInfo) {
          allNodes.push({
            id: i,
            name: nodeInfo.name,
            inDegree: nodeInfo.in || 0
          });
        }
      }

      return allNodes.sort((a, b) => b.inDegree - a.inDegree).slice(0, n);
    },

    // --- 新增：计算并返回核心模型的函数 ---
    getTopNModelsByCentrality: (n) => {
      if (!graph) return [];
      
      const allNodes = [];
      const labels = graph.getRawData ? graph.getRawData().labels : [];
      if (labels.length === 0) return [];

      for (let i = 0; i < labels.length; i++) {
        const nodeInfo = graph.getNodeInfo(i);
        if (nodeInfo) {
          // 中心度 = 入度 + 出度
          const centrality = (nodeInfo.in || 0) + (nodeInfo.out || 0);
          allNodes.push({
            id: i,
            name: nodeInfo.name,
            centrality: centrality
          });
        }
      }

      // 按中心度从高到低排序，并返回前 N 个
      return allNodes.sort((a, b) => b.centrality - a.centrality).slice(0, n);
    },
    getCommunities: () => communities,
    calculateCommunitiesForDate: (limitDate) => {
      if (!graph) return null;
      console.log(`Calculating communities for data up to ${limitDate.toISOString()}`);

      const ngraph = createNgraph();
      const rawData = graph.getRawData();
      if (!rawData || !rawData.labels || !rawData.outLinks || !rawData.nodeData) {
        console.error("Cannot run time-scoped community detection: raw data is incomplete.");
        return null;
      }
      
      const visibleNodeIds = new Set();
      for (let i = 0; i < rawData.nodeData.length; i++) {
        const node = rawData.nodeData[i];
        if (node && node.createdAt && new Date(node.createdAt) <= limitDate) {
          visibleNodeIds.add(i);
        }
      }

      visibleNodeIds.forEach(nodeId => { ngraph.addNode(nodeId); });

      rawData.outLinks.forEach((links, fromId) => {
        if (links && visibleNodeIds.has(fromId)) {
          links.forEach(toId => {
            if (visibleNodeIds.has(toId)) { ngraph.addLink(fromId, toId); }
          });
        }
      });
      
      console.log(`Running community detection on a subgraph of ${ngraph.getNodesCount()} nodes and ${ngraph.getLinksCount()} links.`);
      const timedCommunitiesResult = findCommunities(ngraph);
      console.log(`Time-scoped community detection complete. Found ${timedCommunitiesResult.count} communities.`);
      return {
        result: timedCommunitiesResult,
        nodeIds: visibleNodeIds 
      };
    }
  };



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
    if (!graph) {
      unknownNodeInfo.name = nodeId;
      return unknownNodeInfo;
    }
    var nodeInfo = graph.getNodeInfo(nodeId);
    // TODO: too tired, need to get this out from here
    if (currentGraphName === 'github') {
      nodeInfo.icon = 'https://avatars.githubusercontent.com/' + nodeInfo.name;
    }

    return nodeInfo;
  }

  function getConnected(nodeId, connectionType) {
    if (!graph) {
      return [];
    }
    // 直接返回 graph.getConnected 的结果，不再进行二次处理
    return graph.getConnected(nodeId, connectionType); // <--- 修正后的代码
  }

  function reportProgress(progress) {
    api.fire('loadProgress', progress);
  }

  function loadComplete(model) {
    loadInProgress = false;
    graph = model;
    
    communities = null; 
    console.log("Graph loaded. Preparing for community detection...");
    
    setTimeout(() => {
      const ngraph = createNgraph();
      const rawData = model.getRawData();

      if (rawData && rawData.labels && rawData.outLinks) {
        for (let i = 0; i < rawData.labels.length; i++) {
          ngraph.addNode(i);
        }
        rawData.outLinks.forEach((links, fromId) => {
          if (links) {
            links.forEach(toId => {
              ngraph.addLink(fromId, toId);
            });
          }
        });
        
        console.log("Community detection started on compatible graph...");
        // **核心修复：确保声明的变量名与使用的变量名一致**
        const communityResult = findCommunities(ngraph); 
        
        const allNodeIds = new Set();
        for (let i = 0; i < rawData.labels.length; i++) {
          allNodeIds.add(i);
        }

        communities = {
          result: communityResult, // 使用这里声明的 `communityResult`
          nodeIds: allNodeIds
        };

        console.log(`Community detection complete. Found ${communities.result.count} communities.`);
      } else {
        console.error("Cannot run community detection: raw graph data is missing.");
      }
    }, 0);

    console.log("Building model_id to nodeId lookup table...");
    modelIdToNodeIdMap.clear();
    const labels = model.getRawData ? model.getRawData().labels : [];
    if (labels.length > 0) {
        for (let i = 0; i < labels.length; i++) {
            const nodeName = labels[i];
            if (nodeName) {
                modelIdToNodeIdMap.set(nodeName, i);
            }
        }
        console.log(`Lookup table built with ${modelIdToNodeIdMap.size} entries.`);
    }
    
    api.fire('loadProgress', {});
    appEvents.graphDownloaded.fire();
  }
}