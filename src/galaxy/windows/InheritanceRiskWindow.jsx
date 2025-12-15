// src/galaxy/windows/InheritanceRiskWindow.jsx
import React from 'react';
import { findDOMNode } from 'react-dom';
import appEvents from '../service/appEvents.js';

// 引入 i18n 工具 (假设项目里有)
const t = require('../utils/i18n.js'); 
const maco = require('maco');

// --- 新增：合规信息组件 ---
const ComplianceStatus = ({ isCompliant, fixedLicense, risks, reasons }) => {
    // 1. 合规状态 (绿色)
    if (isCompliant) {
        return (
            <div className="compliance-box safe" style={styles.boxSafe}>
                <div style={styles.header}>
                    <span style={{fontSize: '20px'}}>✅</span> 
                    <span style={{fontWeight: 'bold', color: '#2ecc71'}}>Model is Compliant</span>
                </div>
                <div style={{marginTop: '5px', color: '#a0a0a0', fontSize: '13px'}}>
                    Detected License: <span style={{color: '#fff'}}>{fixedLicense || 'None'}</span>
                </div>
                <div style={{marginTop: '5px', color: '#888', fontSize: '12px'}}>
                    No known inheritance conflicts detected.
                </div>
            </div>
        );
    }

    // 2. 违规状态 (红色)
    return (
        <div className="compliance-box risk" style={styles.boxRisk}>
            <div style={styles.header}>
                <span style={{fontSize: '20px'}}>⚠️</span> 
                <span style={{fontWeight: 'bold', color: '#e74c3c'}}>Compliance Risks Detected</span>
            </div>
            
            {/* 许可证信息 */}
            <div style={{marginTop: '8px', color: '#ccc', fontSize: '13px'}}>
                Fixed License: <strong style={{color: '#fff'}}>{fixedLicense}</strong>
            </div>

            {/* 风险标签 (Tags) */}
            <div style={{marginTop: '8px'}}>
                {risks.map(r => (
                    <span key={r} style={styles.tag}>{r}</span>
                ))}
            </div>

            {/* 详细原因列表 */}
            <div style={{marginTop: '10px', borderTop: '1px solid rgba(231, 76, 60, 0.3)', paddingTop: '8px'}}>
                <div style={{fontSize: '12px', fontWeight: 'bold', color: '#e74c3c', marginBottom: '4px'}}>
                    Risk Analysis / Violation Reasons:
                </div>
                <ul style={{paddingLeft: '15px', margin: 0}}>
                    {reasons.map((item, idx) => (
                        <li key={idx} style={{fontSize: '12px', color: '#bbb', marginBottom: '4px', lineHeight: '1.4'}}>
                            <span style={{color: '#e74c3c'}}>[{item.type}]</span> {item.reason}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

// --- 内联样式 (为了快速生效，你也可以写在 .less 文件里) ---
const styles = {
    boxSafe: {
        background: 'rgba(46, 204, 113, 0.1)',
        border: '1px solid #2ecc71',
        borderRadius: '4px',
        padding: '12px',
        marginBottom: '15px'
    },
    boxRisk: {
        background: 'rgba(231, 76, 60, 0.1)',
        border: '1px solid #e74c3c',
        borderRadius: '4px',
        padding: '12px',
        marginBottom: '15px'
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    },
    tag: {
        display: 'inline-block',
        background: '#e74c3c',
        color: 'white',
        padding: '2px 6px',
        borderRadius: '3px',
        fontSize: '11px',
        marginRight: '5px',
        fontWeight: 'bold'
    }
};


// --- 主视图组件 ---
export default React.createClass({
    render() {
        // 从 ViewModel 获取数据
        const model = this.props.viewModel;
        
        // 确保 model 存在
        if (!model) return <div className='window-loading'>Loading...</div>;

        return (
            <div className='inheritance-risk-content' style={{padding: '10px'}}>
                
                {/* 1. 插入新开发的合规信息面板 */}
                <ComplianceStatus 
                    isCompliant={model.isCompliant}
                    fixedLicense={model.fixedLicense}
                    risks={model.riskLabels}
                    reasons={model.complianceReasons}
                />

                {/* 2. 保留原来的图表或其他内容 (如果还需要的话) */}
                {/* 如果原来的代码里有 <svg> 或者图表逻辑，可以放在这里继续渲染。
                   例如:
                */}
                <div className="original-chart-section">
                    {/* 这里放你原来的图表代码，或者如果 model.data 存在才渲染图表 */}
                    { model.data ? (
                        <div style={{opacity: 0.5, marginTop: '20px'}}>
                           {/* 原有图表逻辑... */}
                           <p style={{textAlign:'center', fontSize:'12px'}}>Inheritance Depth Visualization (Legacy)</p>
                        </div>
                    ) : null }
                </div>
            </div>
        );
    }
});