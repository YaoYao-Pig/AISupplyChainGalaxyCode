/**
 * Renders collection of windows
 */
import React from 'react';
import NodeListView from './nodeListView.jsx';
import windowCollectionModel from './windowCollectionModel.js';
import LicenseReportWindow from './LicenseReportWindow.jsx'; // <--- 新增

module.exports = require('maco')(windowCollectionView, React);
function toWindowView(windowViewModel, idx) {
  // --- 新增：根据ID渲染报告窗口 ---
  if (windowViewModel.id === 'license-report') {
      return <LicenseReportWindow key={idx} />;
  }
  // 默认渲染节点列表
  return <NodeListView viewModel={windowViewModel} key={idx} />;
}
function windowCollectionView(x) {
  x.render = function () {
    var windows = windowCollectionModel.getWindows();
    if (windows.length === 0) return null;

    return <div>{windows.map(toWindowView)}</div>;
  };

  x.componentDidMount = function () {
    windowCollectionModel.on('changed', update);
  };

  x.componentWillUnmount = function() {
    windowCollectionModel.off('changed', update);
  };

  function toWindowView(windowViewModel, idx) {
    return <NodeListView viewModel={windowViewModel} key={idx} />;
  }

  function update() {
    x.forceUpdate();
  }
}
