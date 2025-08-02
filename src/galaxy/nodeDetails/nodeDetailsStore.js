
import appEvents from '../service/appEvents.js';
import scene from '../store/sceneStore.js';
import DegreeWindowViewModel from './degreeWindowViewModel.js';
import getBaseNodeViewModel from '../store/baseNodeViewModel.js';
import eventify from 'ngraph.events';

const searchResultsWindowId = 'search-results';

export default nodeDetailsStore();

function nodeDetailsStore() {
  let currentNodeId, degreeVisible = false,
      currentConnectionType;
  let sidebarData = null;
  let lastSelectedNodeId = null;
  let chainFocusIndex = -1;

  const api = {
    getSelectedNode: getSelectedNode,
    getSidebarData: () => sidebarData,
  };

  // --- 所有事件监听器都应该在这里注册 ---
  appEvents.selectNode.on(updateDetails);
  appEvents.showDegree.on(updateDegreeDetails);
  appEvents.focusNextInChain.on(focusNextInChain);

  function focusNextInChain() {
    if (!sidebarData || !sidebarData.selectedNode || !sidebarData.selectedNode.inheritanceChain) return;

    const chain = sidebarData.selectedNode.inheritanceChain;
    if (chain.length === 0) return;

    chainFocusIndex = (chainFocusIndex + 1) % chain.length;
    
    const nextNodeInChain = chain[chainFocusIndex];
    const nextNodeId = scene.getNodeIdByModelId(nextNodeInChain.model);

    if (nextNodeId !== undefined) {
        console.log(`Focusing on next in chain (index ${chainFocusIndex}): ${nextNodeInChain.model}`);
        
        // 调用 focusOnNode，并传递 false，告诉它不要触发 selectNode 事件
        appEvents.focusOnNode.fire(nextNodeId, false); 
    }
  }
  // --- 核心修正: 将高亮链的监听器移动到这里 ---
  appEvents.highlightChain.on(chain => {
    if (!Array.isArray(chain)) return;

    const nodesToHighlight = chain
        .map(item => {
            const nodeId = scene.getNodeIdByModelId(item.model);
            if (nodeId === undefined) return null;
            const nodeData = scene.getGraph().getNodeData(nodeId);
            const licenseTag = (nodeData.tags || []).find(t => t.startsWith('license:'));
            const license = licenseTag ? licenseTag.substring(8) : (nodeData.license || 'N/A');
            return { id: nodeId, license: license };
        })
        .filter(node => node !== null);
    
    if (nodesToHighlight.length > 0) {
        appEvents.cls.fire();
        appEvents.highlightChainWithData.fire(nodesToHighlight);

        // --- 新增: 触发相机聚焦事件，并传递节点ID列表 ---
        const nodeIds = nodesToHighlight.map(n => n.id);
        appEvents.focusOnArea.fire(nodeIds);
        // --- 新增结束 ---
    }
  });
  // --- 修正结束 ---

  eventify(api);
  return api;

  function updateDetails(nodeId) {
    chainFocusIndex = -1;
    if (lastSelectedNodeId !== null && nodeId !== lastSelectedNodeId) {
        appEvents.highlightNeighbors.fire(lastSelectedNodeId, false);
        appEvents.activeTagChanged.fire(null);
        appEvents.cls.fire();
        appEvents.hideNodeListWindow.fire(searchResultsWindowId);
    }

    if (nodeId === undefined || nodeId === null) {
      sidebarData = null;
    } else {
      if (nodeId !== lastSelectedNodeId) {
         appEvents.highlightNeighbors.fire(nodeId, true);
      }
      const nodeInfo = scene.getNodeInfo(nodeId);
      if (nodeInfo) {
        sidebarData = {
          selectedNode: getBaseNodeViewModel(nodeId),
          incoming: scene.getConnected(nodeId, 'in'),
          outgoing: scene.getConnected(nodeId, 'out')
        };
      }
    }
    
    lastSelectedNodeId = nodeId;
    currentNodeId = nodeId;
    updateDegreeDetails(currentNodeId, currentConnectionType);
    api.fire('changed');
  }
  function updateDegreeDetails(id, connectionType) {
    currentNodeId = id;
    degreeVisible = currentNodeId !== undefined;
    if (degreeVisible) {
      currentConnectionType = connectionType;
      var rootInfo = scene.getNodeInfo(id);
      var conenctions = scene.getConnected(id, connectionType);
      var viewModel = new DegreeWindowViewModel(rootInfo.name, conenctions, connectionType, id);
      appEvents.showNodeListWindow.fire(viewModel, 'degree');
    } else {
      appEvents.hideNodeListWindow.fire('degree');
    }
    api.fire('changed');
  }

  function getSelectedNode() {
    if (currentNodeId === undefined) return;
    return getBaseNodeViewModel(currentNodeId);
  }
}