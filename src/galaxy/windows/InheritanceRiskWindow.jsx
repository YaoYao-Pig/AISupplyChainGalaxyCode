// src/galaxy/windows/InheritanceRiskWindow.jsx
import React from 'react';

export default class InheritanceRiskWindow extends React.Component {
  constructor(props) {
    super(props);
    const chain = this.props.viewModel.chainData;
    this.state = {
      selectedNode: chain[chain.length - 1]
    };
  }

  handleNodeClick(nodeData) {
    this.setState({ selectedNode: nodeData });
  }

  render() {
    const { chainData } = this.props.viewModel;
    const { selectedNode } = this.state;

    return (
      <div className='inheritance-window-container'>
        <div className='inheritance-chain-panel'>
          <h4 className='inheritance-section-title'>Model Lineage (Ancestry)</h4>
          <div className='inheritance-chain-list'>
            {chainData.map((node, index) => {
              const isSelected = selectedNode && selectedNode.id === node.id;
              const circleClassName = node.isCompliant
                ? 'inheritance-node-circle is-compliant'
                : 'inheritance-node-circle is-risk';
              const selectedClassName = isSelected ? ' is-selected' : '';

              return (
                <div key={node.id} className='inheritance-chain-step'>
                  {index > 0 && <div className='inheritance-chain-line'></div>}
                  <div
                    onClick={() => this.handleNodeClick(node)}
                    className={circleClassName + selectedClassName}
                    title={node.name}
                  >
                    {!node.isCompliant && <span className='inheritance-alert-icon'>!</span>}
                  </div>
                  <div className='inheritance-node-label' onClick={() => this.handleNodeClick(node)}>
                    {node.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className='inheritance-details-panel'>
          {selectedNode ? (
            <div>
              <h4 className={'inheritance-section-title inheritance-status-title' + (selectedNode.isCompliant ? ' is-compliant' : ' is-risk')}>
                {selectedNode.isCompliant ? 'Compliant Node' : 'Risk Detected'}
              </h4>
              <div className='inheritance-detail-row'>
                <strong>Model:</strong> {selectedNode.name}
              </div>
              <div className='inheritance-detail-row'>
                <strong>License:</strong> {selectedNode.fixedLicense || 'None'}
              </div>

              {!selectedNode.isCompliant && (
                <div className='inheritance-reasons-box'>
                  <div className='inheritance-reason-header'>Non-Compliance Reasons:</div>
                  <ul className='inheritance-reason-list'>
                    {selectedNode.reasons.map((r, i) => (
                      <li key={i} className='inheritance-reason-item'>
                        <span className='inheritance-reason-tag'>[{r.type}]</span> {r.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className='inheritance-empty-state'>Select a node to view details.</div>
          )}
        </div>
      </div>
    );
  }
}
