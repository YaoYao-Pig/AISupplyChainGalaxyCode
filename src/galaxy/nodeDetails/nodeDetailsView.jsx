// src/galaxy/nodeDetails/nodeDetailsView.jsx

import React from 'react';
import detailModel from './nodeDetailsStore.js';
import specialNodeDetails from './templates/all.js';
import scene from '../store/sceneStore.js';
import i18n from '../utils/i18n.js';

module.exports = require('maco')(detailedNodeView, React);

function detailedNodeView(x) {
  x.state = {
    showAllRisks: false
  };

  x.render = function () {
    var selectedNode = detailModel.getSelectedNode();
    if (!selectedNode) return null;

    var NodeDetails = getNodeDetails(selectedNode);
    var graph = scene.getGraph();
    var risks = selectedNode.compliance && selectedNode.compliance.risks ? selectedNode.compliance.risks : [];
    var visibleRisks = x.state.showAllRisks ? risks : risks.slice(0, 3);

    const alertStyle = {
      padding: '8px 12px',
      marginBottom: '8px',
      borderRadius: '8px',
      fontSize: '12px',
      lineHeight: '1.45',
      borderWidth: '1px',
      borderStyle: 'solid'
    };

    const styles = {
      Error: {
        ...alertStyle,
        backgroundColor: '#fdeded',
        color: '#5f2120',
        borderColor: '#f5c6cb'
      },
      Warning: {
        ...alertStyle,
        backgroundColor: '#fff3cd',
        color: '#856404',
        borderColor: '#ffeeba'
      }
    };

    return (
      <div className='node-details-container'>
        {risks.length > 0 && (
          <div className='compliance-alerts-section'>
            <div className='compliance-alerts-header'>
              <div>
                <strong>{i18n.t('nodeDetails.risks.title')}</strong>
                <span className='compliance-alerts-summary'>{i18n.t('nodeDetails.risks.summary', { count: risks.length })}</span>
              </div>
              {risks.length > 3 && (
                <button type='button' className='compliance-alerts-toggle' onClick={toggleRiskList}>
                  {x.state.showAllRisks ? i18n.t('nodeDetails.risks.hide') : i18n.t('nodeDetails.risks.show')}
                </button>
              )}
            </div>
            <div className={'compliance-alerts-list' + (x.state.showAllRisks ? ' expanded' : '')}>
              {visibleRisks.map((risk, idx) => (
                <div key={idx} style={risk.level === 'Error' ? styles.Error : styles.Warning}>
                  <strong>[{risk.level}] {risk.type}: </strong> {risk.reason}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className='node-details'>
          <NodeDetails model={selectedNode} graph={graph} />
        </div>

        <div className='node-actions-help'>
          Press <kbd>G</kbd> for more details
        </div>
      </div>
    );
  };

  x.componentDidMount = function() {
    detailModel.on('changed', updateView);
    i18n.onChange(updateView);
  };

  x.componentWillUnmount = function () {
    detailModel.off('changed', updateView);
    i18n.offChange(updateView);
  };

  function getNodeDetails(viewModel) {
    var Template = specialNodeDetails[scene.getGraphName()] || specialNodeDetails.default;
    return Template;
  }

  function toggleRiskList() {
    x.setState({ showAllRisks: !x.state.showAllRisks });
  }

  function updateView() {
    var selectedNode = detailModel.getSelectedNode();
    var risks = selectedNode && selectedNode.compliance && selectedNode.compliance.risks ? selectedNode.compliance.risks : [];
    x.setState({ showAllRisks: risks.length > 0 && risks.length <= 3 });
  }
}