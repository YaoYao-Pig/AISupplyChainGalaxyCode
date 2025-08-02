// src/galaxy/store/licenseComplianceStore.js

import eventify from 'ngraph.events';
import appEvents from '../service/appEvents.js';
import scene from './sceneStore.js';
import getBaseNodeViewModel from './baseNodeViewModel.js';

// ------------------------------------------------------------------
// ⚠️ 核心业务逻辑：许可证兼容性判断函数 (占位符实现)
// 您需要根据真实的许可证规则来完善这里的逻辑。
// 当前的规则是：只有两个许可证完全相同时才算兼容。
// ------------------------------------------------------------------
function isLicenseCompatible(childLicense, parentLicense) {
  if (!childLicense || !parentLicense) return true; // 如果信息不全，暂时视为合规
  if (parentLicense === 'N/A' || parentLicense === 'Unknown') return true; // 父节点许可证未知，暂时放行
  
  // 简单规则：必须完全一致
  return childLicense === parentLicense;
}


const complianceStore = (function() {
  let conflictList = [];
  const api = eventify({});

  appEvents.graphDownloaded.on(analyzeAllNodes);

  function analyzeAllNodes() {
    console.log('Analyzing license compliance for all nodes...');
    const graph = scene.getGraph();
    if (!graph) return;

    const newConflictList = [];
    const nodeCount = graph.getRawData().labels.length;

    for (let i = 0; i < nodeCount; i++) {
      const nodeViewModel = getBaseNodeViewModel(i);
      const chain = nodeViewModel.inheritanceChain;

      if (chain && chain.length > 1) {
        for (let j = 0; j < chain.length - 1; j++) {
          const child = chain[j];
          const parent = chain[j+1];
          
          if (!isLicenseCompatible(child.license, parent.license)) {
            newConflictList.push({
              nodeId: i, // 冲突链条所属的原始节点ID
              childModel: child.model,
              childLicense: child.license,
              parentModel: parent.model,
              parentLicense: parent.license
            });
            // 一旦发现冲突，就将整个节点标记为冲突，不再继续检查该链的更深层级
            break; 
          }
        }
      }
    }
    conflictList = newConflictList;
    console.log(`License compliance analysis complete. Found ${conflictList.length} conflicts.`);
    api.fire('changed');
  }
  
  api.getConflictList = () => conflictList;
  api.isLicenseCompatible = isLicenseCompatible; // 将判断函数也暴露出去，方便其他模块使用

  return api;
})();

export default complianceStore;