import React from 'react';
// 引入之前的 ViewModel 和 Window 管理器 (如果你还想保留“点击查看完整链路”的功能)
import InheritanceRiskViewModel from '../../windows/InheritanceRiskViewModel.js';
import windowCollection from '../../windows/windowCollectionModel.js';

export default require('maco').template(template, React);

function template(props) {
  var model = props.model;
  var graph = props.graph;

  // 1. 获取合规详情
  let compliance = { isCompliant: true, reasons: [], risks: [] };
  
  if (graph && typeof graph.getComplianceDetails === 'function') {
    compliance = graph.getComplianceDetails(model.id);
  } else {
    // 如果 graph 还没加载好或者方法不存在，做个防御
    // console.warn("Graph or getComplianceDetails missing");
  }

  // 2. 定义打开完整链路窗口的函数 (可选)
  function openChainWindow() {
    if (!graph) return;
    var vm = new InheritanceRiskViewModel(graph, model.id);
    windowCollection.add(vm);
  }

  return (
    <div className='container-fluid row'>
      <div className='hidden-xs'>
        {/* 顶部：名字 */}
        <div className='col-xs-12'>
          <h4 title={model.name} style={{marginBottom: '5px', wordWrap: 'break-word'}}>{model.name}</h4>
        </div>

        {/* --- 新增：合规性状态展示区域 --- */}
        <div className='col-xs-12' style={{marginBottom: '15px'}}>
           {compliance.isCompliant ? (
             // --- 合规显示 (绿色) ---
             <div style={styles.compliantBox}>
               <span style={{fontSize: '14px'}}>✅ <strong>Compliant</strong></span>
               <div style={{fontSize: '10px', marginTop: '2px', color: '#a0dcb5'}}>
                 License: {compliance.fixed_license || 'None'}
               </div>
             </div>
           ) : (
             // --- 违规显示 (红色) ---
             <div style={styles.riskBox}>
               <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <span style={{fontSize: '14px'}}>⚠️ <strong>Non-Compliant</strong></span>
                  {/* 查看详情按钮 */}
                  <button onClick={openChainWindow} style={styles.traceButton}>
                    Trace Chain
                  </button>
               </div>
               
               <div style={{fontSize: '11px', marginTop: '4px', color: '#ffcccb'}}>
                 Detected Risks: {compliance.risks.join(', ')}
               </div>

               {/* 原因列表 */}
               {compliance.reasons && compliance.reasons.length > 0 && (
                 <ul style={styles.reasonList}>
                   {compliance.reasons.map((r, i) => (
                     <li key={i} style={styles.reasonItem}>
                       {/* 显示简短的原因，太长截断 */}
                       - {r.reason}
                     </li>
                   ))}
                 </ul>
               )}
             </div>
           )}
        </div>
        {/* ------------------------------- */}

        {/* 原有的入度/出度统计 */}
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

      {/* 移动端视图 (Mobile) */}
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

// 简单的内联样式
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
    color: '#ddd', // 浅灰色文字，避免全红太刺眼
    marginBottom: '3px',
    lineHeight: '1.2'
  }
};