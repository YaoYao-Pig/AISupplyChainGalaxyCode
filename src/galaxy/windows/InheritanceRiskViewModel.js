// src/galaxy/windows/InheritanceRiskViewModel.js

export default class InheritanceRiskViewModel {
  constructor(graph, nodeId) {
    this.graph = graph;
    this.nodeId = nodeId;
    
    this.title = 'Inheritance Compliance Chain';
    this.id = 'inheritance-risk';
    
    // 1. 计算继承链路 (Ancestry Chain)
    // 我们需要找到当前节点的所有祖先，形成一条或多条路径。
    // 为了简化视图，这里我们采用 BFS 查找最深的一条主链路，或者显示所有上游。
    this.chain = this._calculateAncestryChain(nodeId);
  }

  /**
   * 内部方法：计算向上的继承链路
   * 返回数组: [{id, compliance, level}, ...]，按层级排序 (Root -> ... -> Current)
   */
  _calculateAncestryChain(startNodeId) {
    const chain = [];
    const visited = new Set();
    
    // 简单的 BFS/DFS 向上寻找父节点 (inLinks)
    // 这里我们做一个简化的逻辑：优先追踪“有风险”的父节点，或者直接追踪第一个父节点
    // 真实的继承关系可能是树状的，为了侧边栏显示，我们将“主要影响路径”线性化
    
    let currentId = startNodeId;
    let level = 0;

    // 收集当前节点
    chain.push(this._createNodeData(currentId, level));
    visited.add(currentId);

    // 循环向上查找 (Limit depth to 10 to prevent infinite loops)
    for (let i = 0; i < 10; i++) {
      const parents = this.graph.getConnected(currentId, 'in'); // 获取入边 (父节点)
      if (!parents || parents.length === 0) break;

      // 策略：如果有多个父节点，优先选择“不合规”的父节点进行展示 (Trace the blame)
      // 如果都合规，就选第一个
      let selectedParent = parents[0];
      
      for (let pid of parents) {
        const pInfo = this.graph.getComplianceDetails(pid);
        if (!pInfo.isCompliant) {
          selectedParent = pid;
          break; 
        }
      }

      if (visited.has(selectedParent)) break; // 防止环
      
      level--; // 向上层级递减
      chain.push(this._createNodeData(selectedParent, level));
      visited.add(selectedParent);
      currentId = selectedParent;
    }

    // 翻转数组，让它从 Root (最上层) -> Current (最下层)
    return chain.reverse();
  }

  _createNodeData(id, level) {
    const nodeInfo = this.graph.getNodeInfo(id); // 获取节点基础信息(名字等)
    const compliance = this.graph.getComplianceDetails(id); // 获取合规信息

    return {
      id: id,
      name: nodeInfo.name || 'Unknown Model',
      level: level,
      isCompliant: compliance.isCompliant,
      fixedLicense: compliance.fixed_license,
      risks: compliance.risks,
      reasons: compliance.reasons
    };
  }

  get chainData() {
    return this.chain;
  }
}