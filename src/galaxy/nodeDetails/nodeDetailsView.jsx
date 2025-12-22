// src/galaxy/nodeDetails/nodeDetailsView.jsx

import React from 'react';
import detailModel from './nodeDetailsStore.js';
import specialNodeDetails from './templates/all.js';
import scene from '../store/sceneStore.js';

module.exports = require('maco')(detailedNodeView, React);

function detailedNodeView(x) {
  x.render = function () {
    var selectedNode = detailModel.getSelectedNode();
    if (!selectedNode) return null;

    var NodeDetails = getNodeDetails(selectedNode);
    var graph = scene.getGraph();
    
    // 获取合规性风险列表，如果存在则获取，否则为空数组
    var risks = selectedNode.compliance && selectedNode.compliance.risks ? selectedNode.compliance.risks : [];

    // 定义风险提示的样式
    const alertStyle = {
      padding: '8px 12px',
      marginBottom: '8px',
      borderRadius: '4px',
      fontSize: '12px',
      lineHeight: '1.4',
      borderWidth: '1px',
      borderStyle: 'solid'
    };

    const styles = {
      // 错误 (Error)：红色背景
      Error: { 
        ...alertStyle, 
        backgroundColor: '#fdeded', 
        color: '#5f2120', 
        borderColor: '#f5c6cb' 
      },
      // 警告 (Warning)：黄色背景
      Warning: { 
        ...alertStyle, 
        backgroundColor: '#fff3cd', 
        color: '#856404', 
        borderColor: '#ffeeba' 
      }
    };

    return (
      <div className='node-details-container'>
        
        {/* 新增：合规性风险列表展示区域 - 位于详情上方 */}
        {risks.length > 0 && (
          <div className='compliance-alerts-section' style={{ margin: '10px 10px 0 10px' }}>
            {risks.map((risk, idx) => (
              <div key={idx} style={risk.level === 'Error' ? styles.Error : styles.Warning}>
                <strong>[{risk.level}] {risk.type}: </strong> {risk.reason}
              </div>
            ))}
          </div>
        )}

        {/* 原有的节点详情组件 */}
        <div className='node-details'>
          <NodeDetails model={selectedNode} graph={graph} />
        </div>
        
        {/* 底部提示 */}
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