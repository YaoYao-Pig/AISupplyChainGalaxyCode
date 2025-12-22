// src/galaxy/windows/InheritanceRiskViewModel.js

export default class InheritanceRiskViewModel {
  constructor(graph, nodeId) {
    this.graph = graph;
    this.nodeId = nodeId;
    
    this.title = 'Inheritance Compliance Chain';
    this.id = 'inheritance-risk';
    
    // 1. 计算继承链路 (Ancestry Chain)
    this.chain = this._calculateAncestryChain(nodeId);
  }

  /**
   * 内部方法：计算向上的继承链路
   * 返回数组: [{id, compliance, level}, ...]，按层级排序 (Root -> ... -> Current)
   */
  _calculateAncestryChain(startNodeId) {
    const chain = [];
    const visited = new Set();
    
    let currentId = startNodeId;
    let level = 0;

    // 收集当前节点
    chain.push(this._createNodeData(currentId, level));
    visited.add(currentId);

    // 循环向上查找 (Limit depth to 10)
    for (let i = 0; i < 10; i++) {
      // getConnected 返回的是对象数组 [{id: 1, name: "xx"}, ...]，不是 ID 数组
      const parents = this.graph.getConnected(currentId, 'in'); 
      if (!parents || parents.length === 0) break;

      // 策略：优先追踪“有风险”的父节点，否则选第一个
      let selectedParentId = parents[0].id;
      
      for (let pNode of parents) {
        const pInfo = this.graph.getComplianceDetails(pNode.id); // 注意这里用 pNode.id
        if (!pInfo.isCompliant) {
          selectedParentId = pNode.id;
          break; 
        }
      }

      if (visited.has(selectedParentId)) break; // 防止环
      
      level--; // 向上层级递减
      chain.push(this._createNodeData(selectedParentId, level));
      visited.add(selectedParentId);
      currentId = selectedParentId; // 更新 currentId 为 ID，而不是对象
    }

    // 翻转数组，让它从 Root (最上层) -> Current (最下层)
    return chain.reverse();
  }

  _createNodeData(id, level) {
    const nodeInfo = this.graph.getNodeInfo(id); // 获取节点基础信息
    const compliance = this.graph.getComplianceDetails(id); // 获取合规信息

    return {
      id: id,
      name: nodeInfo.name || 'Unknown Model',
      level: level,
      isCompliant: compliance.isCompliant,
      fixedLicense: compliance.fixed_license,
      risks: compliance.risks,
      reasons: compliance.reasons // 这里的 reasons 将由 graph.js 正确填充
    };
  }

  get chainData() {
    return this.chain;
  }
}