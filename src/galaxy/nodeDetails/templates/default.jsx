import React from 'react';
import InheritanceRiskViewModel from '../../windows/InheritanceRiskViewModel.js';
import windowCollection from '../../windows/windowCollectionModel.js';

export default require('maco').template(template, React);

function template(props) {
  var model = props.model;
  var graph = props.graph;

  // 双重保险：优先从 model (ViewModel) 获取，没有的话再尝试从 graph 直接获取
  let compliance = model.compliance;
  if (!compliance && graph && typeof graph.getComplianceDetails === 'function') {
    compliance = graph.getComplianceDetails(model.id);
  }
  // 默认值
  if (!compliance) {
      compliance = { isCompliant: true, reasons: [], risks: [] };
  }

  function openChainWindow() {
    if (!graph) return;
    var vm = new InheritanceRiskViewModel(graph, model.id);
    windowCollection.add(vm);
  }

  // 标题样式：有风险时显示红色
  const titleStyle = {
      marginBottom: '5px', 
      wordWrap: 'break-word',
      color: compliance.isCompliant ? 'inherit' : '#e74c3c' // 红色警告色
  };

  return (
    <div className='container-fluid row'>
      <div className='hidden-xs'>
        {/* 顶部：名字 (现在有颜色了) */}
        <div className='col-xs-12'>
          <h4 title={model.name} style={titleStyle}>
            {model.name} {compliance.isCompliant ? '' : '⚠️'}
          </h4>
        </div>

        {/* 合规性状态展示区域 */}
        <div className='col-xs-12' style={{marginBottom: '15px'}}>
           {compliance.isCompliant ? (
             <div style={styles.compliantBox}>
               <span style={{fontSize: '14px'}}>✅ <strong>Compliant</strong></span>
               <div style={{fontSize: '10px', marginTop: '2px', color: '#a0dcb5'}}>
                 License: {compliance.fixed_license || 'None'}
               </div>
             </div>
           ) : (
             <div style={styles.riskBox}>
               <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <span style={{fontSize: '14px'}}>⚠️ <strong>Non-Compliant</strong></span>
                  <button onClick={openChainWindow} style={styles.traceButton}>
                    Trace Chain
                  </button>
               </div>
               
               <div style={{fontSize: '11px', marginTop: '4px', color: '#ffcccb'}}>
                 Detected Risks: {compliance.risks && compliance.risks.length > 0 ? compliance.risks.map(r => r.type).join(', ') : 'Unknown'}
               </div>

               {compliance.reasons && compliance.reasons.length > 0 && (
                 <ul style={styles.reasonList}>
                   {compliance.reasons.map((r, i) => (
                     <li key={i} style={styles.reasonItem}>
                       - {typeof r === 'string' ? r : r.reason}
                     </li>
                   ))}
                 </ul>
               )}
             </div>
           )}
        </div>

        <div className="col-xs-6">
          <div className="row">
            <h2 id={model.id} className='in-degree'>{model.inDegree}</h2>
          </div>
          <div className="row small">{model.inDegreeLabel}</div>
        </div>
        <div className="col-xs-6">
          <div className="row">
            <h2 id={model.id} className='out-degree'>{model.outDegree}</h2>
          </div>
          <div className="row small">{model.outDegreeLabel}</div>
        </div>
      </div>

      <div className='visible-xs-block'>
        <div className='row info-block'>
          <div className='col-xs-6 no-overflow'>
             <h5 style={{color: compliance.isCompliant ? 'inherit' : '#e74c3c'}}>
               {model.name} {compliance.isCompliant ? '' : '(Risk)'}
             </h5>
          </div>
          <div id={model.id} className='in-degree col-xs-3'>{model.inDegree}</div>
          <div id={model.id} className='out-degree col-xs-3'>{model.outDegree}</div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  compliantBox: {
    backgroundColor: 'rgba(46, 204, 113, 0.15)',
    border: '1px solid #2ecc71',
    borderRadius: '4px',
    padding: '8px',
    color: '#2ecc71'
  },
  riskBox: {
    backgroundColor: 'rgba(231, 76, 60, 0.15)',
    border: '1px solid #e74c3c',
    borderRadius: '4px',
    padding: '8px',
    color: '#e74c3c'
  },
  traceButton: {
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    fontSize: '10px',
    padding: '2px 6px',
    cursor: 'pointer'
  },
  reasonList: {
    margin: '8px 0 0 0',
    paddingLeft: '0',
    listStyle: 'none'
  },
  reasonItem: {
    fontSize: '11px',
    color: '#ddd',
    marginBottom: '3px',
    lineHeight: '1.2'
  }
};