// src/galaxy/windows/InheritanceRiskWindow.jsx
import React from 'react';
// 引入你的 i18n 或其他工具
// const t = require('../utils/i18n.js');

export default class InheritanceRiskWindow extends React.Component {
  constructor(props) {
    super(props);
    // 默认选中当前节点 (也就是链条的最后一个)
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
      <div className="inheritance-window-container" style={styles.container}>
        
        {/* 左侧/顶部：可视化链路图 */}
        <div className="chain-visual" style={styles.visualSection}>
            <h4 style={styles.sectionTitle}>Model Lineage (Ancestry)</h4>
            <div style={styles.chainList}>
                {chainData.map((node, index) => {
                    const isLast = index === chainData.length - 1;
                    const isSelected = selectedNode && selectedNode.id === node.id;
                    
                    return (
                        <div key={node.id} className="chain-step" style={styles.chainStep}>
                            {/* 连线 (除了第一个节点) */}
                            {index > 0 && <div style={styles.line}></div>}
                            
                            {/* 节点圆圈 */}
                            <div 
                                onClick={() => this.handleNodeClick(node)}
                                style={{
                                    ...styles.nodeCircle,
                                    backgroundColor: node.isCompliant ? '#2ecc71' : '#e74c3c', // 绿/红
                                    border: isSelected ? '2px solid white' : '2px solid transparent',
                                    boxShadow: isSelected ? '0 0 8px rgba(255,255,255,0.6)' : 'none',
                                    cursor: 'pointer'
                                }}
                                title={node.name}
                            >
                                {/* 如果有风险显示 ! 号 */}
                                {!node.isCompliant && <span style={styles.alertIcon}>!</span>}
                            </div>

                            {/* 节点名字简写 */}
                            <div style={styles.nodeLabel} onClick={() => this.handleNodeClick(node)}>
                                {node.name}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* 右侧/底部：详细原因面板 */}
        <div className="compliance-details" style={styles.detailsSection}>
            {selectedNode ? (
                <div>
                    <h4 style={{...styles.sectionTitle, color: selectedNode.isCompliant ? '#2ecc71' : '#e74c3c'}}>
                        {selectedNode.isCompliant ? '✅ Compliant Node' : '⚠️ Risk Detected'}
                    </h4>
                    <div style={styles.detailRow}>
                        <strong>Model:</strong> {selectedNode.name}
                    </div>
                    <div style={styles.detailRow}>
                        <strong>License:</strong> {selectedNode.fixedLicense || 'None'}
                    </div>

                    {!selectedNode.isCompliant && (
                        <div style={styles.reasonsBox}>
                            <div style={styles.reasonHeader}>Non-Compliance Reasons:</div>
                            <ul style={styles.reasonList}>
                                {selectedNode.reasons.map((r, i) => (
                                    <li key={i} style={styles.reasonItem}>
                                        <span style={styles.tag}>[{r.type}]</span> {r.reason}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            ) : (
                <div style={{color: '#888'}}>Select a node to view details.</div>
            )}
        </div>
      </div>
    );
  }
}

// 简单的内联样式 (建议放入 inheritance.less)
const styles = {
    container: {
        padding: '10px',
        color: '#eee',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
    },
    visualSection: {
        marginBottom: '20px',
        paddingBottom: '10px',
        borderBottom: '1px solid #444'
    },
    sectionTitle: {
        margin: '0 0 10px 0',
        fontSize: '14px',
        textTransform: 'uppercase',
        color: '#aaa',
        letterSpacing: '1px'
    },
    chainList: {
        display: 'flex',       // 横向排列 (也可以改为 column 做纵向)
        flexDirection: 'column', // 这里做成纵向列表比较适合侧边栏
        alignItems: 'flex-start',
        gap: '0px'
    },
    chainStep: {
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        paddingBottom: '15px' // 节点间距
    },
    line: {
        position: 'absolute',
        left: '14px', // 圆心位置
        top: '-15px',
        width: '2px',
        height: '30px', // 连线长度
        backgroundColor: '#555',
        zIndex: 0
    },
    nodeCircle: {
        width: '30px',
        height: '30px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
        marginRight: '10px',
        fontWeight: 'bold',
        fontSize: '16px',
        color: 'white'
    },
    alertIcon: {
        fontWeight: 'bold'
    },
    nodeLabel: {
        fontSize: '13px',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '220px'
    },
    detailsSection: {
        flex: 1,
        overflowY: 'auto'
    },
    detailRow: {
        marginBottom: '5px',
        fontSize: '13px',
        color: '#ccc'
    },
    reasonsBox: {
        marginTop: '10px',
        backgroundColor: 'rgba(231, 76, 60, 0.1)',
        padding: '10px',
        borderRadius: '4px'
    },
    reasonHeader: {
        fontWeight: 'bold',
        color: '#e74c3c',
        marginBottom: '5px',
        fontSize: '12px'
    },
    reasonList: {
        paddingLeft: '0',
        listStyle: 'none',
        margin: 0
    },
    reasonItem: {
        fontSize: '12px',
        marginBottom: '8px',
        lineHeight: '1.4',
        color: '#bbb'
    },
    tag: {
        color: '#e74c3c',
        fontWeight: 'bold'
    }
};