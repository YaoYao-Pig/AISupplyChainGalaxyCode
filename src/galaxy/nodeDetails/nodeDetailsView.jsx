// src/galaxy/nodeDetails/nodeDetailsView.jsx

import React from 'react';
import detailModel from './nodeDetailsStore.js';
import specialNodeDetails from './templates/all.js';
import scene from '../store/scene.js';

module.exports = require('maco')(detailedNodeView, React);

function detailedNodeView(x) {
  x.render = function () {
    var selectedNode = detailModel.getSelectedNode();
    if (!selectedNode) return null;
    var NodeDetails = getNodeDetails(selectedNode);

    return (
      // 使用一个容器来包裹详情和新的提示信息
      <div className='node-details-container'>
        <div className='node-details'>
          <NodeDetails model={selectedNode} />
        </div>
        {/* 新增的提示信息 */}
        <div className='node-actions-help'>
          Press <kbd>G</kbd> for more details
        </div>
      </div>
    );
  };

  x.componentDidMount = function() {
    detailModel.on('changed', updateView);
  };

  x.componentWillUnmount = function () {
    detailModel.off('changed', updateView);
  };

  function getNodeDetails(viewModel) {
    var Template = specialNodeDetails[scene.getGraphName()] || specialNodeDetails.default;
    return Template;
  }

  function updateView() {
    x.forceUpdate();
  }
}