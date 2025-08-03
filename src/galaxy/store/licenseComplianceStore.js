const eventify = require('ngraph.events');
const appEvents = require('../service/appEvents.js');
const scene = require('./sceneStore.js');
import { isLicenseCompatible } from './licenseUtils.js';

const complianceStore = (function() {
  let graphData = { nodes: [], edges: [] };
  const api = eventify({});
  appEvents.graphDownloaded.on(buildLicenseGraph);

  function buildLicenseGraph() {
    console.log('Building license compliance graph...');
    const graph = scene.getGraph();
    if (!graph) return;

    const licenseCounts = new Map();
    const licenseEdges = new Map();
    const nodeCount = graph.getRawData().labels.length;

    for (let i = 0; i < nodeCount; i++) {
      const nodeData = graph.getNodeData(i);
      if (!nodeData) continue;
      const licenseTag = (nodeData.tags || []).find(t => typeof t === 'string' && t.startsWith('license:'));
      const currentLicense = licenseTag ? licenseTag.substring(8).trim() : (nodeData.license || 'N/A');
      licenseCounts.set(currentLicense, (licenseCounts.get(currentLicense) || 0) + 1);
      const baseModelTags = (nodeData.tags || []).filter(t => t.startsWith('base_model:'));
      baseModelTags.forEach(tag => {
          const baseModelId = tag.substring(11).trim();
          const parentNodeId = scene.getNodeIdByModelId(baseModelId);
          if (parentNodeId === undefined) return;
          const parentData = graph.getNodeData(parentNodeId);
          if (!parentData) return;
          const parentLicenseTag = (parentData.tags || []).find(t => t.startsWith('license:'));
          const parentLicense = parentLicenseTag ? parentLicenseTag.substring(8).trim() : (parentData.license || 'N/A');
          if (currentLicense === parentLicense) return;
          const edgeKey = `${parentLicense}->${currentLicense}`;
          const edge = licenseEdges.get(edgeKey) || { from: parentLicense, to: currentLicense, count: 0, isConflict: false };
          edge.count += 1;
          if (!isLicenseCompatible(currentLicense, parentLicense)) { edge.isConflict = true; }
          licenseEdges.set(edgeKey, edge);
      });
    }

    const nodes = Array.from(licenseCounts.entries()).map(([id, value]) => ({
        id: id, label: id, value: value, title: `${value} models`
    }));

    const edges = Array.from(licenseEdges.values()).map(edge => ({
        from: edge.from,
        to: edge.to,
        dashes: !edge.isConflict,
        title: `Connections: ${edge.count}`,
        size: Math.log(edge.count + 1) // 边的粗细
    }));

    graphData = { nodes, edges };
    console.log(`License graph built. Nodes: ${nodes.length}, Edges: ${edges.length}`);
    api.fire('changed');
  }

  api.getGraphData = () => graphData;
  return api;
})();
module.exports = complianceStore;