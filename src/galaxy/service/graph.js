// src/galaxy/service/graph.js (修正版)

import linkFinder from './edgeFinder.js';
export default graph;

function graph(rawGraphLoaderData) {
  const {labels, outLinks, inLinks, positions, nodeData} = rawGraphLoaderData;
  const empty = [];

  function findLinks(from, to) {
    return linkFinder(from, to, outLinks, inLinks, labels);
  }

  const api = {
    getNodeInfo: getNodeInfo,
    getConnected: getConnected,
    find: find,
    findLinks: findLinks,
    getNodeData: (nodeId) => (nodeData && nodeId < nodeData.length) ? nodeData[nodeId] : null,
    getRawData: () => rawGraphLoaderData,
    findByTag: findByTag // <--- 新增: 暴露新的搜索方法
  };

  return api;
  
  // --- 新增: 按标签搜索的具体实现 ---
  function findByTag(tagToFind) {
    const results = [];
    if (!nodeData || !tagToFind) return results;

    for (let i = 0; i < nodeData.length; i++) {
        const data = nodeData[i];
        // 检查当前节点的 data.tags 数组是否包含要查找的标签
        if (data && Array.isArray(data.tags) && data.tags.includes(tagToFind)) {
            // 如果包含，就获取该节点的基础信息并加入结果列表
            results.push(getNodeInfo(i));
        }
    }
    return results;
  }

  function find(query) {
    var result = [];
    if (!labels) return result;

    var matcher;
    if (typeof query === 'string') {
      if (!query) return result;
      matcher = regexMatcher(query); // regexMatcher 现在总是返回一个函数
    } else {
        return result;
    }

    for (var i = 0; i < labels.length; ++i) {
      if (matcher(i)) { // 现在 matcher 是一个函数
        result.push(getNodeInfo(i));
      }
    }
    return result;
  }

  // --- 核心修正: 确保 regexMatcher 总是返回一个函数 ---
  function regexMatcher(str) {
    var regex;
    try {
      regex = new RegExp(str, 'ig');
    } catch (e) {
      // 如果正则表达式无效，返回一个永远不匹配的函数
      return () => false;
    }
    // 返回一个执行匹配的函数
    return (i) => labels[i] && labels[i].match(regex);
  }
  // --- 修正结束 ---

  function getConnected(startId, connectionType) {
    let connectedIds = [];
    if (connectionType === 'out') {
      connectedIds = outLinks[startId] || empty;
    } else if (connectionType === 'in') {
      connectedIds = inLinks[startId] || empty;
    }
    // 返回邻居的详细信息
    return connectedIds.map(getNodeInfo);
  }

  function getNodeInfo(id) {
    if (!labels) return;
    const outLinksCount = outLinks[id] ? outLinks[id].length : 0;
    const inLinksCount = inLinks[id] ? inLinks[id].length : 0;
    return { id, name: labels[id], out: outLinksCount, in: inLinksCount };
  }
}