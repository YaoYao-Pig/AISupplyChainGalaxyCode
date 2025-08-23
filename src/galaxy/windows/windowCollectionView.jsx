// src/galaxy/windows/windowCollectionView.jsx

import React from 'react';
import DraggableWindow from './DraggableWindow.jsx'; // 引入拖拽外壳
import NodeListView from './nodeListView.jsx';
import LicenseListView from './LicenseListView.jsx';
import LicenseReportWindow from './LicenseReportWindow.jsx';
import ComplianceStatsWindow from './ComplianceStatsWindow.jsx';
import ComplianceGraphWindow from './ComplianceGraphWindow.jsx';
import windowCollectionModel from './windowCollectionModel.js';

// 将组件类型映射到一个对象中，方便查找
const windowContentMap = {
  'degree': NodeListView,
  'search-results': NodeListView,
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
  };

  x.componentWillUnmount = function() {
    windowCollectionModel.off('changed', update);
  };

  function toWindowView(viewModel, idx) {
    // 从映射中找到对应的 内容组件
    const ContentComponent = windowContentMap[viewModel.id] || windowContentMap[viewModel.className];

    if (!ContentComponent) {
      return null; // 如果找不到对应的组件，则不渲染
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