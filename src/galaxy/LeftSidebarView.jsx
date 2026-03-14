// src/galaxy/LeftSidebarView.jsx

import React from 'react';
import appEvents from './service/appEvents.js';
import complianceStore from './store/licenseComplianceStore.js';
import timelineStore from './store/timelineStore.js';
import detailModel from './nodeDetails/nodeDetailsStore.js';
import InsightsListWindowViewModel from './windows/InsightsListWindowViewModel.js';

const scene = require('./store/sceneStore.js');

module.exports = require('maco')((x) => {
  x.state = {
    isOpen: false,
    conflictCount: 0,
    selectedLicense: 'none',
    isSimulating: false,
    simulationProgress: 0,
    isCoreHighlighted: false,
    isCommunityView: false,
    isTaskTypeView: false,
    isRiskHeatmap: false
  };

  x.componentDidMount = function() {
    complianceStore.on('changed', updateConflictCount);
    updateConflictCount();
    appEvents.simulationStatusUpdate.on(updateSimulationStatus);
    appEvents.cls.on(handleCls);
    appEvents.timelineChanged.on(handleTimelineUpdate);
  };

  x.componentWillUnmount = function() {
    complianceStore.off('changed', updateConflictCount);
    appEvents.simulationStatusUpdate.off(updateSimulationStatus);
    appEvents.timelineChanged.off(handleTimelineUpdate);
    appEvents.cls.off(handleCls);
  };

  const handleCls = () => {
    x.setState({
      isTaskTypeView: false,
      isCommunityView: false,
      isCoreHighlighted: false,
      isRiskHeatmap: false
    });
    appEvents.showTaskTypeLegend.fire(false);
  };

  const handleTimelineUpdate = (date) => {
    if (x.state.isCommunityView && date) {
      const communitiesToRender = scene.calculateCommunitiesForDate(date);
      appEvents.showCommunities.fire(communitiesToRender);
    } else if (!date && x.state.isCommunityView) {
      const communitiesToRender = scene.getCommunities();
      appEvents.showCommunities.fire(communitiesToRender);
    }
  };

  const updateSimulationStatus = (status) => {
    x.setState({
      isSimulating: status.running,
      simulationProgress: status.progress || 0
    });
  };

  const updateConflictCount = () => {
    x.setState({
      conflictCount: complianceStore.getConflictList().length
    });
  };

  const handleMouseEnter = () => x.setState({ isOpen: true });
  const handleMouseLeave = () => x.setState({ isOpen: false });

  const handleGlobalStats = () => appEvents.showGlobalLicenseStats.fire();
  const handleGlobalReport = () => appEvents.showGlobalLicenseReport.fire();
  const handleGlobalComplianceStats = () => appEvents.showGlobalComplianceStats.fire();

  const handleHighlightClick = () => {
    const conflictNodeIds = complianceStore.getConflictList().map(c => c.nodeId);
    appEvents.highlightLicenseConflicts.fire(conflictNodeIds);
  };

  const handleToggleRiskHeatmap = () => {
    const next = !x.state.isRiskHeatmap;
    if (next) {
      appEvents.cls.fire();
    }
    appEvents.toggleRiskHeatmap.fire(next);
    x.setState({ isRiskHeatmap: next });
  };

  const handleShowKeyNodeRanking = () => {
    const topN = 50;
    const topByCentrality = scene.getTopNModelsByCentrality(topN);
    const topByRisk = scene.getTopNModelsByRisk(20);

    const merged = [];
    const seen = new Set();

    topByRisk.forEach(node => {
      if (seen.has(node.id)) return;
      seen.add(node.id);
      merged.push({ id: node.id, name: `[Risk ${node.riskCount}] ${node.name}`, in: node.in || 0, out: node.out || 0 });
    });

    topByCentrality.forEach(node => {
      if (seen.has(node.id)) return;
      seen.add(node.id);
      merged.push({ id: node.id, name: `[Core] ${node.name}`, in: node.in || 0, out: node.out || 0 });
    });

    const viewModel = new InsightsListWindowViewModel({
      id: 'key-node-ranking',
      title: 'Key Nodes (Risk + Centrality)',
      list: merged
    });

    appEvents.showNodeListWindow.fire(viewModel, viewModel.id);
  };

  const handleShowImpactScope = () => {
    const selected = detailModel.getSelectedNode();
    if (!selected || selected.id === undefined) {
      console.warn('[ImpactScope] Select a node first.');
      return;
    }

    const impact = scene.calculateImpactScope(selected.id, 3, 300);
    const title = impact.summary.truncated
      ? `Impact Scope: ${impact.summary.startName} (${impact.summary.totalImpacted}+ nodes)`
      : `Impact Scope: ${impact.summary.startName} (${impact.summary.totalImpacted} nodes)`;

    const viewModel = new InsightsListWindowViewModel({
      id: 'impact-scope-window',
      title: title,
      list: impact.nodes
    });

    appEvents.showNodeListWindow.fire(viewModel, viewModel.id);
    appEvents.showLicenseContamination.fire(selected.name);
  };

  const handleSimulate = () => {
    const selectedLicense = x.state.selectedLicense;
    if (selectedLicense === 'none') {
      appEvents.runLicenseSimulation.fire(null);
    } else {
      appEvents.runLicenseSimulation.fire(selectedLicense);
    }
  };

  const handleHighlightCore = () => {
    const currentlyHighlighted = x.state.isCoreHighlighted;
    if (currentlyHighlighted) {
      appEvents.cls.fire();
    } else {
      appEvents.cls.fire();
      appEvents.highlightCoreModels.fire(50);
    }
    x.setState({ isCoreHighlighted: !currentlyHighlighted });
  };

  const handleShowCommunities = () => {
    const currentlyShowing = x.state.isCommunityView;
    if (currentlyShowing) {
      appEvents.cls.fire();
      x.setState({ isCommunityView: false });
      return;
    }

    appEvents.cls.fire();

    const timelineState = timelineStore.getState();
    let communitiesToRender;

    if (timelineState.enabled && timelineState.currentDate) {
      const date = new Date(timelineState.currentDate);
      communitiesToRender = scene.calculateCommunitiesForDate(date);
    } else {
      communitiesToRender = scene.getCommunities();
    }

    appEvents.showCommunities.fire(communitiesToRender);
    x.setState({ isCommunityView: true });
  };

  const handleLicenseChange = (e) => x.setState({ selectedLicense: e.target.value });
  const handleToggleTimeline = () => appEvents.toggleTimeline.fire();

  const handleShowTaskTypeView = () => {
    const isTaskTypeView = x.state.isTaskTypeView;
    if (isTaskTypeView) {
      appEvents.cls.fire();
      appEvents.showTaskTypeLegend.fire(false);
    } else {
      appEvents.cls.fire();
      appEvents.showTaskTypeView.fire();
      appEvents.showTaskTypeLegend.fire(true);
    }
    x.setState({ isTaskTypeView: !isTaskTypeView });
  };

  x.render = function() {
    const {
      isOpen,
      conflictCount,
      selectedLicense,
      isSimulating,
      simulationProgress,
      isCoreHighlighted,
      isCommunityView,
      isTaskTypeView,
      isRiskHeatmap
    } = x.state;

    const containerClass = isOpen ? 'left-sidebar-container open' : 'left-sidebar-container';
    const licenses = ['MIT', 'Apache-2.0', 'GPL-3.0', 'AGPL-3.0'];
    const coreButtonText = isCoreHighlighted ? 'Show All Models' : 'Highlight Core Models';
    const communityButtonText = isCommunityView ? 'Show Default View' : 'Show Communities';
    const taskTypeButtonText = isTaskTypeView ? 'Show Default View' : 'Task Type View';
    const riskHeatButtonText = isRiskHeatmap ? 'Disable Risk Heatmap' : 'Risk Heatmap';

    return (
      <div
        className={containerClass}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className='left-sidebar-content'>
          <h4>Data Insight</h4>
          <button onClick={handleGlobalStats} className='analysis-btn'>License Stats</button>
          <button onClick={handleGlobalReport} className='analysis-btn'>Compliance Report</button>
          <button onClick={handleGlobalComplianceStats} className='analysis-btn'>Compliance Stats</button>
          <button onClick={handleToggleRiskHeatmap} className='analysis-btn'>{riskHeatButtonText}</button>
          <button onClick={handleShowKeyNodeRanking} className='analysis-btn'>Key Node Ranking</button>
          <button onClick={handleShowImpactScope} className='analysis-btn'>Impact Scope (Selected)</button>

          <hr className='sidebar-separator' />

          <h4>View Switch</h4>
          <button onClick={handleShowTaskTypeView} className='analysis-btn'>{taskTypeButtonText}</button>
          <button onClick={handleHighlightCore} className='analysis-btn'>{coreButtonText}</button>
          <button onClick={handleShowCommunities} className='analysis-btn'>{communityButtonText}</button>
          <button
            onClick={handleHighlightClick}
            className='analysis-btn highlight'
            disabled={conflictCount === 0}
          >
            Highlight Conflicts ({conflictCount})
          </button>
          <button onClick={handleToggleTimeline} className='analysis-btn'>Toggle Timeline</button>

          <hr className='sidebar-separator' />

          <h4>License</h4>
          <div className='simulator-controls'>
            <p>License Simulator</p>
            <select value={selectedLicense} onChange={handleLicenseChange} disabled={isSimulating}>
              <option value='none'>-- Select a License --</option>
              {licenses.map(l => <option key={l} value={l}>{l}</option>)}
            </select>

            {isSimulating ? (
              <div className='progress-bar-container'>
                <div className='progress-bar' style={{ width: `${simulationProgress}%` }} />
                <span className='progress-label'>{Math.round(simulationProgress)}%</span>
              </div>
            ) : (
              <button onClick={handleSimulate} className='analysis-btn' disabled={isSimulating}>
                {selectedLicense === 'none' ? 'Reset View' : 'Simulate'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };
}, React);
