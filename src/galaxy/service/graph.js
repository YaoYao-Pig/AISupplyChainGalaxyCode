// src/galaxy/service/graph.js

import linkFinder from './edgeFinder.js';
export default graph;

function graph(rawGraphLoaderData) {
  const {labels, outLinks, inLinks, positions, nodeData, linkTypes, linkData, complianceData} = rawGraphLoaderData;
  const empty = [];

  function findLinks(from, to) {
    return linkFinder(from, to, outLinks, inLinks, labels);
  }

  function getComplianceDetails(nodeId) {
    // 确保 complianceData 存在
    if (complianceData && complianceData[nodeId]) {
      const details = complianceData[nodeId];
      // 数据源中的字段是 risks，UI 需要的是 reasons，这里做一个映射
      return {
        isCompliant: false, 
        risks: details.risks || [],
        reasons: details.risks || [], // [FIX] 将 risks 赋值给 reasons，让 UI 能显示原因
        fixed_license: details.fixed_license
      };
    }
    return {
      isCompliant: true,
      risks: [],
      reasons: [],
      fixed_license: null 
    };
  }

  function findShortestPath(startNodeId, endNodeId) {
    if (startNodeId === endNodeId) return [startNodeId];

    const queue = [[startNodeId]]; 
    const visited = new Set([startNodeId]);

    while (queue.length > 0) {
      const path = queue.shift();
      const lastNode = path[path.length - 1];

      const neighbors = outLinks[lastNode] || [];
      for (const neighborId of neighbors) {
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          const newPath = [...path, neighborId];

          if (neighborId === endNodeId) {
            return newPath; 
          }
          queue.push(newPath);
        }
      }
    }

    return null; 
  }

  const api = {
    findShortestPath: findShortestPath, 
    getNodeInfo: getNodeInfo,
    getConnected: getConnected,
    find: find,
    findLinks: findLinks,
    getComplianceDetails: getComplianceDetails,
    getNodeData: (nodeId) => (nodeData && nodeId < nodeData.length) ? nodeData[nodeId] : null,
    getRawData: () => ({ 
      labels: labels,
      outLinks: outLinks,
      inLinks: inLinks,
      positions: positions,
      nodeData: nodeData,
      linkTypes: linkTypes, 
      linkData: linkData    
  }),
    findByTag: findByTag
  };

  return api;
  
  function findByTag(tagToFind) {
    const results = [];
    if (!nodeData || !tagToFind) return results;

    for (let i = 0; i < nodeData.length; i++) {
        const data = nodeData[i];
        if (data && Array.isArray(data.tags) && data.tags.includes(tagToFind)) {
            results.push(getNodeInfo(i));
        }
    }
    return results;
  }

  function find(query) {
    var result = [];
    if (!labels) return result;

    if (typeof query === 'string' && query === '') {
        const previewSize = Math.min(100, labels.length);
        for (let i = 0; i < previewSize; ++i) {
            result.push(getNodeInfo(i));
        }
        return result;
    }

    var matcher;
    if (typeof query === 'string') {
      matcher = regexMatcher(query);
    } else {
        return result;
    }

    for (var i = 0; i < labels.length; ++i) {
      if (matcher(i)) {
        result.push(getNodeInfo(i));
      }
    }
    return result;
  }

  function regexMatcher(str) {
    var regex;
    try {
      regex = new RegExp(str, 'ig');
    } catch (e) {
      return () => false;
    }
    return (i) => labels[i] && labels[i].match(regex);
  }

  function getConnected(startId, connectionType) {
    let connectedIds = [];
    if (connectionType === 'out') {
      connectedIds = outLinks[startId] || empty;
    } else if (connectionType === 'in') {
      connectedIds = inLinks[startId] || empty;
    }
    return connectedIds.map(getNodeInfo);
  }

  function getNodeInfo(id) {
    if (!labels) return;
    const outLinksCount = outLinks[id] ? outLinks[id].length : 0;
    const inLinksCount = inLinks[id] ? inLinks[id].length : 0;
    return { id, name: labels[id], out: outLinksCount, in: inLinksCount };
  }
}