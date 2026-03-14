// src/galaxy/nodeDetails/nodeDetailsView.jsx

import React from 'react';
import detailModel from './nodeDetailsStore.js';
import specialNodeDetails from './templates/all.js';
import scene from '../store/sceneStore.js';
import i18n from '../utils/i18n.js';
import complianceStore from '../store/licenseComplianceStore.js';
import appEvents from '../service/appEvents.js';

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
    var groupedRisks = getGroupedRisks(selectedNode, risks);

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
              {renderRiskGroup('Error', groupedRisks.Error, styles.Error)}
              {renderRiskGroup('Warning', groupedRisks.Warning, styles.Warning)}
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

    function renderRiskGroup(level, items, style) {
      if (!items || items.length === 0) return null;
      return (
        <div className='compliance-alert-group' key={level}>
          <div className={'compliance-alert-group-title ' + level.toLowerCase()}>
            {level === 'Error' ? i18n.t('nodeDetails.risks.errorGroup') : i18n.t('nodeDetails.risks.warningGroup')}
            <span className='compliance-alert-group-count'>{items.length}</span>
          </div>
          {items.map((item, idx) => (
            <div key={level + idx} style={style} className='compliance-alert-item'>
              <div className='compliance-alert-text'>
                <strong>[{item.level}] {item.type}: </strong> {item.reason}
              </div>
              {item.relatedNodeId !== undefined && (
                <button
                  type='button'
                  className='compliance-alert-jump'
                  onClick={() => focusNode(item.relatedNodeId)}
                >
                  {i18n.t('nodeDetails.risks.focusParent')}
                </button>
              )}
            </div>
          ))}
        </div>
      );
    }
  };

  x.componentDidMount = function() {
    detailModel.on('changed', updateView);
    i18n.onChange(updateView);
    complianceStore.on('changed', updateView);
  };

  x.componentWillUnmount = function () {
    detailModel.off('changed', updateView);
    i18n.offChange(updateView);
    complianceStore.off('changed', updateView);
  };

  function getNodeDetails(viewModel) {
    var Template = specialNodeDetails[scene.getGraphName()] || specialNodeDetails.default;
    return Template;
  }

  function getGroupedRisks(selectedNode, risks) {
    var visibleRisks = x.state.showAllRisks ? risks : risks.slice(0, 3);
    var conflictMatches = complianceStore.getConflictList().filter(function (conflict) {
      return conflict.nodeId === selectedNode.id;
    });

    return visibleRisks.reduce(function (acc, risk) {
      var item = {
        level: risk.level || 'Warning',
        type: risk.type || 'Risk',
        reason: risk.reason || ''
      };

      var relatedConflict = findMatchingConflict(conflictMatches, risk);
      if (relatedConflict) {
        item.relatedNodeId = scene.getNodeIdByModelId(relatedConflict.parentModel);
      }

      if (item.level === 'Error') {
        acc.Error.push(item);
      } else {
        acc.Warning.push(item);
      }
      return acc;
    }, { Error: [], Warning: [] });
  }

  function findMatchingConflict(conflicts, risk) {
    if (!conflicts || conflicts.length === 0) return null;
    return conflicts.find(function (conflict) {
      return typeof risk.reason === 'string' && risk.reason.indexOf(conflict.parentModel) >= 0;
    }) || conflicts[0];
  }

  function focusNode(nodeId) {
    if (nodeId === undefined || nodeId === null) return;
    appEvents.selectNode.fire(nodeId);
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