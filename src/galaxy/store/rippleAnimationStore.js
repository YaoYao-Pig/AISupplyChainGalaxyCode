// src/galaxy/store/rippleAnimationStore.js

import appEvents from '../service/appEvents.js';
import scene from './sceneStore.js';

function createRippleAnimationStore() {
  let animationTimer = null;

  appEvents.showRippleAnimation.on(startAnimation);

  function startAnimation(startNodeId) {
    if (animationTimer) {
      clearTimeout(animationTimer);
      animationTimer = null;
    }
    
    // 清理之前的任何高亮
    appEvents.cls.fire();

    const graph = scene.getGraph();
    if (!graph) return;

    // --- BFS 逻辑 ---
    const levels = [];
    const queue = [{ id: startNodeId, level: 0 }];
    const visited = new Set([startNodeId]);

    while (queue.length > 0) {
      const { id, level } = queue.shift();

      if (!levels[level]) {
        levels[level] = [];
      }

      const outgoingConnections = scene.getConnected(id, 'out');
      const isBranch = outgoingConnections.length > 1;

      levels[level].push({
        id: id,
        isRoot: level === 0,
        isBranch: isBranch
      });

      outgoingConnections.forEach(neighbor => {
        if (!visited.has(neighbor.id)) {
          visited.add(neighbor.id);
          queue.push({ id: neighbor.id, level: level + 1 });
        }
      });
    }
    // --- BFS 结束 ---

    // 标记最后一层的所有节点为叶子节点
    if (levels.length > 0) {
      const lastLevel = levels[levels.length - 1];
      lastLevel.forEach(node => node.isLeaf = true);
    }
    
    // --- 动画时序控制 ---
    let currentLevel = 0;
    function animateNextLevel() {
      if (currentLevel >= levels.length) {
        animationTimer = null;
        return;
      }
      
      appEvents.highlightRippleLevel.fire(levels[currentLevel]);
      currentLevel++;
      
      // 设置下一波涟漪的延迟
      animationTimer = setTimeout(animateNextLevel, 700); // 700ms 延迟
    }

    animateNextLevel();
  }
}

// 初始化并导出单例
createRippleAnimationStore();