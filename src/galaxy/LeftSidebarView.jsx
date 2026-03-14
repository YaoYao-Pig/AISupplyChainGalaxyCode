// src/galaxy/LeftSidebarView.jsx

import React from 'react';
import appEvents from './service/appEvents.js';
import complianceStore from './store/licenseComplianceStore.js';
import timelineStore from './store/timelineStore.js';
import detailModel from './nodeDetails/nodeDetailsStore.js';
import InsightsListWindowViewModel from './windows/InsightsListWindowViewModel.js';
import i18n from './utils/i18n.js';

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
    i18n.onChange(handleLanguageChange);
  };

  x.componentWillUnmount = function() {
    complianceStore.off('changed', updateConflictCount);
    appEvents.simulationStatusUpdate.off(updateSimulationStatus);
    appEvents.timelineChanged.off(handleTimelineUpdate);
    appEvents.cls.off(handleCls);
    i18n.offChange(handleLanguageChange);
  };

  const handleLanguageChange = () => x.forceUpdate();

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
    const conflictNodeIds = complianceStore.getConflictList().map(function (item) {
      return item.nodeId;
    });
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
    const topByCentrality = scene.getTopNModelsByCentrality(50);
    const topByRisk = scene.getTopNModelsByRisk(20);
    const merged = [];
    const seen = new Set();

    topByRisk.forEach(function (node) {
      if (seen.has(node.id)) return;
      seen.add(node.id);
      merged.push({ id: node.id, name: `[Risk ${node.riskCount}] ${node.name}`, in: node.in || 0, out: node.out || 0 });
    });

    topByCentrality.forEach(function (node) {
      if (seen.has(node.id)) return;
      seen.add(node.id);
      merged.push({ id: node.id, name: `[Core] ${node.name}`, in: node.in || 0, out: node.out || 0 });
    });

    const viewModel = new InsightsListWindowViewModel({
      id: 'key-node-ranking',
      title: i18n.t('leftSidebar.window.keyNodes'),
      list: merged
    });

    appEvents.showNodeListWindow.fire(viewModel, viewModel.id);
  };

  const handleShowImpactScope = () => {
    const selected = detailModel.getSelectedNode();
    if (!selected || selected.id === undefined) {
      console.warn('[ImpactScope] ' + i18n.t('leftSidebar.warning.selectNode'));
      return;
    }

    const impact = scene.calculateImpactScope(selected.id, 3, 300);
    const title = impact.summary.truncated
      ? i18n.t('leftSidebar.window.impactScopeTruncated', { name: impact.summary.startName, count: impact.summary.totalImpacted })
      : i18n.t('leftSidebar.window.impactScope', { name: impact.summary.startName, count: impact.summary.totalImpacted });

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
    const isOpen = x.state.isOpen;
    const conflictCount = x.state.conflictCount;
    const selectedLicense = x.state.selectedLicense;
    const isSimulating = x.state.isSimulating;
    const simulationProgress = x.state.simulationProgress;
    const isCoreHighlighted = x.state.isCoreHighlighted;
    const isCommunityView = x.state.isCommunityView;
    const isTaskTypeView = x.state.isTaskTypeView;
    const isRiskHeatmap = x.state.isRiskHeatmap;

    const containerClass = isOpen ? 'left-sidebar-container open' : 'left-sidebar-container';
    const licenses = ['MIT', 'Apache-2.0', 'GPL-3.0', 'AGPL-3.0'];
    const coreButtonText = isCoreHighlighted ? i18n.t('leftSidebar.button.showAllModels') : i18n.t('leftSidebar.button.highlightCore');
    const communityButtonText = isCommunityView ? i18n.t('leftSidebar.button.defaultView') : i18n.t('leftSidebar.button.showCommunities');
    const taskTypeButtonText = isTaskTypeView ? i18n.t('leftSidebar.button.defaultView') : i18n.t('leftSidebar.button.taskTypeView');
    const riskHeatButtonText = isRiskHeatmap ? i18n.t('leftSidebar.button.disableRiskHeatmap') : i18n.t('leftSidebar.button.riskHeatmap');

    return (
      <div
        className={containerClass}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className='left-sidebar-content'>
          <div className='sidebar-intro-card'>
            <h4>{i18n.t('leftSidebar.featureGuide.title')}</h4>
            <p>{i18n.t('leftSidebar.featureGuide.desc')}</p>
            <ul>
              <li>{i18n.t('leftSidebar.featureGuide.item1')}</li>
              <li>{i18n.t('leftSidebar.featureGuide.item2')}</li>
              <li>{i18n.t('leftSidebar.featureGuide.item3')}</li>
            </ul>
          </div>

          <h4>{i18n.t('leftSidebar.section.dataInsight')}</h4>
          <button onClick={handleGlobalStats} className='analysis-btn'>{i18n.t('leftSidebar.button.licenseStats')}</button>
          <button onClick={handleGlobalReport} className='analysis-btn'>{i18n.t('leftSidebar.button.complianceReport')}</button>
          <button onClick={handleGlobalComplianceStats} className='analysis-btn'>{i18n.t('leftSidebar.button.complianceStats')}</button>
          <button onClick={handleToggleRiskHeatmap} className='analysis-btn'>{riskHeatButtonText}</button>
          <button onClick={handleShowKeyNodeRanking} className='analysis-btn'>{i18n.t('leftSidebar.button.keyNodeRanking')}</button>
          <button onClick={handleShowImpactScope} className='analysis-btn'>{i18n.t('leftSidebar.button.impactScope')}</button>

          <hr className='sidebar-separator' />

          <h4>{i18n.t('leftSidebar.section.viewSwitch')}</h4>
          <button onClick={handleShowTaskTypeView} className='analysis-btn'>{taskTypeButtonText}</button>
          <button onClick={handleHighlightCore} className='analysis-btn'>{coreButtonText}</button>
          <button onClick={handleShowCommunities} className='analysis-btn'>{communityButtonText}</button>
          <button
            onClick={handleHighlightClick}
            className='analysis-btn highlight'
            disabled={conflictCount === 0}
          >
            {i18n.t('leftSidebar.button.highlightConflicts', { count: conflictCount })}
          </button>
          <button onClick={handleToggleTimeline} className='analysis-btn'>{i18n.t('leftSidebar.button.toggleTimeline')}</button>

          <hr className='sidebar-separator' />

          <h4>{i18n.t('leftSidebar.section.license')}</h4>
          <div className='simulator-controls'>
            <p>{i18n.t('leftSidebar.licenseSimulator')}</p>
            <select value={selectedLicense} onChange={handleLicenseChange} disabled={isSimulating}>
              <option value='none'>{i18n.t('leftSidebar.licensePlaceholder')}</option>
              {licenses.map(function (license) {
                return <option key={license} value={license}>{license}</option>;
              })}
            </select>

            {isSimulating ? (
              <div className='progress-bar-container'>
                <div className='progress-bar' style={{ width: `${simulationProgress}%` }} />
                <span className='progress-label'>{Math.round(simulationProgress)}%</span>
              </div>
            ) : (
              <button onClick={handleSimulate} className='analysis-btn' disabled={isSimulating}>
                {selectedLicense === 'none' ? i18n.t('leftSidebar.button.resetView') : i18n.t('leftSidebar.button.simulate')}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };
}, React);