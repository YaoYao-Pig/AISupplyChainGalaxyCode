// src/galaxy/windows/InheritanceRiskViewModel.js

export default class InheritanceRiskViewModel {
    /**
     * @param {Object} graph - graph.js 实例
     * @param {number} nodeId - 当前选中节点的 ID
     * @param {Object} existingData - (可选) 原有的图表数据，如果还要保留原来的散点图逻辑的话
     */
    constructor(graph, nodeId, existingData) {
        this.id = 'inheritance-risk';
        this.title = 'Compliance & Inheritance Analysis'; // 稍微改个标题
        this.class = 'inheritance-risk-window';
        
        // 保存引用
        this.graph = graph;
        this.nodeId = nodeId;
        this.data = existingData; // 保留原有的图表数据引用

        // 1. 获取合规详情 (核心逻辑)
        // 注意：这里调用的是我们在 graph.js 里新加的方法
        this.complianceInfo = this.graph.getComplianceDetails(this.nodeId);
    }

    /**
     * 判断是否合规
     */
    get isCompliant() {
        return this.complianceInfo.isCompliant;
    }

    /**
     * 获取节点被修复后的许可证 (例如 "llama3", "apache-2.0")
     */
    get fixedLicense() {
        return this.complianceInfo.fixed_license;
    }

    /**
     * 获取风险标签列表 (例如 ["b_Conflict_La2E"])
     */
    get riskLabels() {
        return this.complianceInfo.risks || [];
    }

    /**
     * 获取详细原因列表
     * 结构: [{ type: '...', reason: '...' }]
     */
    get complianceReasons() {
        return this.complianceInfo.reasons || [];
    }
}