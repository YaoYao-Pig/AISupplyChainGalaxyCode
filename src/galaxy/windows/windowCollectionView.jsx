// src/galaxy/windows/windowCollectionView.jsx

import React from 'react';
import DraggableWindow from './DraggableWindow.jsx';
import NodeListView from './nodeListView.jsx';
import LicenseListView from './LicenseListView.jsx';
import LicenseReportWindow from './LicenseReportWindow.jsx';
import ComplianceStatsWindow from './ComplianceStatsWindow.jsx';
import ComplianceGraphWindow from './ComplianceGraphWindow.jsx';
import windowCollectionModel from './windowCollectionModel.js';
import PathfindingWindow from './PathfindingWindow.jsx';
import PathfindingViewModel from './PathfindingViewModel.js';
import appEvents from '../service/appEvents.js';
import InheritanceRiskWindow from './InheritanceRiskWindow.jsx';

// 将组件类型映射到一个对象中，方便查找
const windowContentMap = {
  'degree': NodeListView,
  'pathfinder-window': PathfindingWindow,
  'degree-results-window': NodeListView,
  'search-results-window': NodeListView, 
  'compliance-graph': ComplianceGraphWindow,
  'license-distribution': LicenseListView,
  'license-report-global': LicenseReportWindow,
  'compliance-stats': ComplianceStatsWindow,
  
  // --- 修复点：确保 id 和 class 都能匹配到组件 ---
  'inheritance-risk-window': InheritanceRiskWindow, // 匹配 viewModel.class
  'inheritance-risk': InheritanceRiskWindow,        // 匹配 viewModel.id (核心修复)
};

module.exports = require('maco')(windowCollectionView, React);

function windowCollectionView(x) {
  x.render = function () {
    var windows = windowCollectionModel.getWindows();
    if (windows.length === 0) return null;

    return <div>{windows.map(toWindowView)}</div>;
  };

  x.componentDidMount = function () {
    windowCollectionModel.on('changed', update);
    appEvents.showPathfindingWindow.on(showPathfindingWindow);
  };

  x.componentWillUnmount = function() {
    windowCollectionModel.off('changed', update);
    appEvents.showPathfindingWindow.off(showPathfindingWindow); 
  };

  function showPathfindingWindow() {
    appEvents.hideNodeListWindow.fire('pathfinder');
    appEvents.showNodeListWindow.fire(new PathfindingViewModel(), 'pathfinder');
  }

  function toWindowView(viewModel, idx) {
    // 逻辑：先找 class/className，找不到再找 id
    const lookupKey = viewModel.className || viewModel.class;
    const ContentComponent = windowContentMap[lookupKey] || windowContentMap[viewModel.id];

    if (!ContentComponent) {
      console.error('No content component found for viewModel:', viewModel);
      return null; 
    }

    return (
        <DraggableWindow viewModel={viewModel} key={viewModel.id || idx}>
            <ContentComponent viewModel={viewModel} />
        </DraggableWindow>
    );
  }

  function update() {
    x.forceUpdate();
  }
}