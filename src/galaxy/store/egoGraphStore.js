import eventify from 'ngraph.events';
import appEvents from '../service/appEvents.js';
import scene from './scene.js';

// 创建并导出一个单例的数据模型
const egoGraphStore = createEgoGraphStore();
export default egoGraphStore;

function createEgoGraphStore() {
  let egoGraphData = null;
  const api = {
    getGraphData: () => egoGraphData
  };
  eventify(api);

  // 监听全局的节点选择事件
  appEvents.selectNode.on(handleSelectNode);

  function handleSelectNode(nodeId) {
    if (nodeId === undefined || nodeId === null) {
      // 如果取消选择，则清空数据
      if (egoGraphData) {
        egoGraphData = null;
        api.fire('changed');
      }
      return;
    }

    // 准备小图的数据
    const nodes = new Map();
    const links = [];

    // 1. 添加中心节点
    const centerNode = scene.getNodeInfo(nodeId);
    if (!centerNode) return;
    nodes.set(centerNode.id, {
      id: centerNode.id,
      name: centerNode.name,
      isCenter: true // 特殊标记，用于在图中高亮
    });

    // 2. 添加出度邻居和连接
    const outLinks = scene.getConnected(nodeId, 'out');
    outLinks.forEach(neighbor => {
      if (!nodes.has(neighbor.id)) {
        nodes.set(neighbor.id, { id: neighbor.id, name: neighbor.name });
      }
      links.push({ source: centerNode.id, target: neighbor.id });
    });

    // 3. 添加出度邻居和连接
    const inLinks = scene.getConnected(nodeId, 'in');
    inLinks.forEach(neighbor => {
      if (!nodes.has(neighbor.id)) {
        nodes.set(neighbor.id, { id: neighbor.id, name: neighbor.name });
      }
      // 注意：边的方向是从邻居指向中心节点
      links.push({ source: neighbor.id, target: centerNode.id });
    });
    
    // 格式化为 react-force-graph-2d 所需的格式
    egoGraphData = {
        nodes: Array.from(nodes.values()),
        links: links
    };

    // 触发 'changed' 事件，通知UI更新
    api.fire('changed');
  }

  return api;
}