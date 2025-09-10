// src/galaxy/windows/windowCollectionView.jsx

import React from 'react';
import DraggableWindow from './DraggableWindow.jsx'; // 引入拖拽外壳
import NodeListView from './nodeListView.jsx';
import LicenseListView from './LicenseListView.jsx';
import LicenseReportWindow from './LicenseReportWindow.jsx';
import ComplianceStatsWindow from './ComplianceStatsWindow.jsx';
import ComplianceGraphWindow from './ComplianceGraphWindow.jsx';
import windowCollectionModel from './windowCollectionModel.js';
import PathfindingWindow from './PathfindingWindow.jsx';
import PathfindingViewModel from './PathfindingViewModel.js';
import appEvents from '../service/appEvents.js';

// 将组件类型映射到一个对象中，方便查找
const windowContentMap = {
  'degree': NodeListView,
  'pathfinder-window': PathfindingWindow,
  // --- 核心修复：添加下面这一行 ---
  'degree-results-window': NodeListView,
  'search-results-window': NodeListView, 
  'compliance-graph': ComplianceGraphWindow,
  'license-distribution': LicenseListView,
  'license-report-global': LicenseReportWindow,
  'compliance-stats': ComplianceStatsWindow,
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
    // 确保一次只显示一个
    appEvents.hideNodeListWindow.fire('pathfinder');
    appEvents.showNodeListWindow.fire(new PathfindingViewModel(), 'pathfinder');
  }
  function toWindowView(viewModel, idx) {
    // 逻辑修正：优先使用 className 进行查找
    const ContentComponent = windowContentMap[viewModel.className] || windowContentMap[viewModel.id];

    if (!ContentComponent) {
      console.error('No content component found for viewModel:', viewModel); // 添加错误日志
      return null; 
    }

    // 所有窗口都由 DraggableWindow 包裹
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