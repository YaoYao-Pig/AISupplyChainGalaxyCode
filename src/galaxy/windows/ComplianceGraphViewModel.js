// src/galaxy/windows/ComplianceGraphViewModel.js

function ComplianceGraphViewModel(graphData) {
    this.id = 'compliance-graph'; // 这是用于区分窗口类型的唯一ID
    this.graph = graphData;        // 这是图表数据
    this.title = 'License Compliance Graph';
    this.class = 'compliance-graph-window';
  }
  
  module.exports = ComplianceGraphViewModel;