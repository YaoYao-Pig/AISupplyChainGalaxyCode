// src/galaxy/store/licenseComplianceStore.js
const eventify = require('ngraph.events');
const appEvents = require('../service/appEvents.js');
const scene = require('./sceneStore.js');
import { isLicenseCompatible } from './licenseUtils.js';

const complianceStore = (function() {
  let conflictList = [];

  const api = eventify({
    getConflictList: () => conflictList
  });

  appEvents.graphDownloaded.on(calculateConflictList);

  function calculateConflictList() {
    const graph = scene.getGraph();
    if (!graph) {
        conflictList = [];
        return;
    }
    const allConflicts = [];
    const nodeCount = graph.getRawData().labels.length;

    for (let i = 0; i < nodeCount; i++) {
        const nodeData = graph.getNodeData(i);
        if (!nodeData) continue;

        const licenseTag = (nodeData.tags || []).find(t => typeof t === 'string' && t.startsWith('license:'));
        const currentLicense = licenseTag ? licenseTag.substring(8) : (nodeData.license || 'N/A');
        
        const baseModelTags = (nodeData.tags || []).filter(t => t.startsWith('base_model:'));
        baseModelTags.forEach(tag => {
            const baseModelId = tag.substring(11);
            const parentNodeId = scene.getNodeIdByModelId(baseModelId);
            if (parentNodeId === undefined) return;
            
            const parentData = graph.getNodeData(parentNodeId);
            if (!parentData) return;

            const parentLicenseTag = (parentData.tags || []).find(t => t.startsWith('license:'));
            const parentLicense = parentLicenseTag ? parentLicenseTag.substring(8) : (parentData.license || 'N/A');

            if (!isLicenseCompatible(currentLicense, parentLicense)) {
                allConflicts.push({
                    nodeId: i,
                    childModel: graph.getNodeInfo(i).name,
                    childLicense: currentLicense,
                    parentModel: baseModelId,
                    parentLicense: parentLicense
                });
            }
        });
    }
    conflictList = allConflicts;
    console.log(`Found ${conflictList.length} global license conflicts.`);
    api.fire('changed');
  }

  return api;
})();
module.exports = complianceStore;