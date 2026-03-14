
import appEvents from '../service/appEvents.js';
import scene from '../store/sceneStore.js';
import DegreeWindowViewModel from './degreeWindowViewModel.js';
import getBaseNodeViewModel from '../store/baseNodeViewModel.js';
import eventify from 'ngraph.events';

const degreeWindowId = 'degree';

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
        appEvents.focusOnNode.fire(nextNodeId, false);
    }
  }

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
        const nodeIds = nodesToHighlight.map(n => n.id);
        appEvents.focusOnArea.fire(nodeIds);
    }
  });

  eventify(api);
  return api;

  function updateDetails(nodeId) {
    chainFocusIndex = -1;
    if (lastSelectedNodeId !== null && nodeId !== lastSelectedNodeId) {
        appEvents.highlightNeighbors.fire(lastSelectedNodeId, false);
        appEvents.activeTagChanged.fire(null);
        appEvents.cls.fire();
    }

    if (nodeId === undefined || nodeId === null) {
      sidebarData = null;
    } else {
      appEvents.focusOnNode.fire(nodeId, false);

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

    if (currentConnectionType !== undefined && currentConnectionType !== null) {
      updateDegreeDetails(currentNodeId, currentConnectionType);
    } else {
      degreeVisible = false;
      appEvents.hideNodeListWindow.fire(degreeWindowId);
    }

    api.fire('changed');
  }

  function updateDegreeDetails(id, connectionType) {
    currentNodeId = id;
    currentConnectionType = connectionType;
    degreeVisible = currentNodeId !== undefined && currentConnectionType !== undefined && currentConnectionType !== null;

    if (degreeVisible) {
      var rootInfo = scene.getNodeInfo(id);
      var conenctions = scene.getConnected(id, connectionType);
      var viewModel = new DegreeWindowViewModel(rootInfo.name, conenctions, connectionType, id);
      appEvents.showNodeListWindow.fire(viewModel, degreeWindowId);
    } else {
      appEvents.hideNodeListWindow.fire(degreeWindowId);
    }
    api.fire('changed');
  }

  function getSelectedNode() {
    if (currentNodeId === undefined) return;
    return getBaseNodeViewModel(currentNodeId);
  }
}