// src/galaxy/windows/windowCollectionView.jsx

import React from 'react';
import NodeListView from './nodeListView.jsx';
// --- 新增：引入我们新的图表窗口组件 ---
import ComplianceGraphWindow from './ComplianceGraphWindow.jsx';
import windowCollectionModel from './windowCollectionModel.js';
import LicenseListView from './LicenseListView.jsx';
import LicenseReportWindow from './LicenseReportWindow.jsx';
module.exports = require('maco')(windowCollectionView, React);

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

  // --- 核心修改：在这里进行“调度”，根据ID渲染不同的组件 ---
  function toWindowView(windowViewModel, idx) {
    // 如果窗口ID是 'compliance-graph'，就渲染我们的图表窗口
    if (windowViewModel.id === 'compliance-graph') {
      return <ComplianceGraphWindow viewModel={windowViewModel} key={idx} />;
    }
    if (windowViewModel.id === 'license-distribution') {
      return <LicenseListView viewModel={windowViewModel} key={idx} />;
    }

    if (windowViewModel.id === 'license-report-global') {
      return <LicenseReportWindow viewModel={windowViewModel} key={idx} />;
    }
    // 否则，渲染默认的列表窗口
    return <NodeListView viewModel={windowViewModel} key={idx} />;
  }

  function update() {
    x.forceUpdate();
  }
}