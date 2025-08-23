// src/galaxy/windows/windowCollectionView.jsx

import React from 'react';
import NodeListView from './nodeListView.jsx';
import LicenseListView from './LicenseListView.jsx';
import LicenseReportWindow from './LicenseReportWindow.jsx';
import ComplianceStatsWindow from './ComplianceStatsWindow.jsx';
import ComplianceGraphWindow from './ComplianceGraphWindow.jsx';
import windowCollectionModel from './windowCollectionModel.js';

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

  function toWindowView(windowViewModel, idx) {
    if (windowViewModel.id === 'compliance-graph') {
      return <ComplianceGraphWindow viewModel={windowViewModel} key={idx} />;
    }

    if (windowViewModel.id === 'license-distribution') {
      return <LicenseListView viewModel={windowViewModel} key={idx} />;
    }

    if (windowViewModel.id === 'license-report-global') {
      return <LicenseReportWindow viewModel={windowViewModel} key={idx} />;
    }

    if (windowViewModel.id === 'compliance-stats') {
      return <ComplianceStatsWindow viewModel={windowViewModel} key={idx} />;
    }

    return <NodeListView viewModel={windowViewModel} key={idx} />;
  }

  function update() {
    x.forceUpdate();
  }
}