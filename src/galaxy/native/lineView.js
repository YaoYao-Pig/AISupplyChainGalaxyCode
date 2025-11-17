// src/galaxy/native/lineView.js

import appConfig from './appConfig.js';
import sceneStore from '../store/sceneStore.js';
import edgeFilterStore from '../store/edgeFilterStore.js'; // 导入 store

export default renderLinks;

function renderLinks(scene, THREE) {
  var linksVisible = true;
  var linkMesh;

  const edgeTypeColors = {
    'BASE_MODEL': [0.2, 0.5, 1.0], // 示例：蓝色
    'ADAPTER': [1.0, 0.5, 0.2],       // <--- 修正为 ADAPTER
    'FINETUNE': [0.2, 1.0, 0.5],      // <--- 修正为 FINETUNE
    'MERGE': [0.8, 0.8, 0.8],      // <--- 修正为 MERGE
    'QUANTIZED': [1.0, 1.0, 0.0],       // <--- 修正为 QUANTIZED
    'UNKNOWN': [0.5, 0.5, 0.5],     // 未知或默认类型的颜色
  };
  const defaultEdgeColor = [0.5, 0.5, 0.5]; // 默认颜色

  var api = {
    render: render,
    toggleLinks: toggleLinks,
    linksVisible: setOrGetLinksVisible
    // 注意：我们将不在 lineView 内部进行订阅，以避免内存泄漏
    // 主 renderer 将负责在过滤器更改时调用 render
  };

  return api;

  function setOrGetLinksVisible(newValue) {
    if (newValue === undefined) {
      return linksVisible;
    }

    if (linkMesh) { // 只有在 linkMesh 存在时才操作
        if (newValue) {
          scene.add(linkMesh);
        } else {
          scene.remove(linkMesh);
        }
    }

    linksVisible = newValue;
    return linksVisible;
  }

function render(links, idxToPos, isTaskView, nodeColors) { // links 参数现在实际未使用
  if (!idxToPos) {
    console.warn("Positions data (idxToPos) is not available for rendering lines.");
    // 清除可能存在的旧边
    if (linkMesh) {
      scene.remove(linkMesh);
      if (linkMesh.geometry) linkMesh.geometry.dispose();
      if (linkMesh.material) linkMesh.material.dispose();
      linkMesh = null;
    }
    return;
  }
    var jsPos = [];
    var jsColors = [];
    var r = 16000;
    var maxVisibleDistance = appConfig.getMaxVisibleEdgeLength();

    // --- 获取边的类型数据 ---
    const graphRawData = sceneStore.getGraph().getRawData();
    const linkData = graphRawData.linkData; // Int32Array [fromId, toId, typeId, ...]
    const linkTypes = graphRawData.linkTypes; // Array ['BASE_MODEL', 'PEFT', ...]

    // --- 关键修改 1: 获取当前启用的类型 ---
    const enabledTypes = edgeFilterStore.getEnabledTypes();

    if (!linkData || !linkTypes) {
      // 如果数据还没加载好，则不渲染边
      console.warn("Link data or types not available for rendering.");
      // 清除可能存在的旧边
      if (linkMesh) {
        scene.remove(linkMesh);
        linkMesh.geometry.dispose();
        linkMesh.material.dispose();
        linkMesh = null;
      }
      return;
    }
    // --- 数据获取结束 ---
    const alphas = nodeColors;
    // --- 新的循环逻辑：遍历 linkData ---
    for (let i = 0; i < linkData.length; i += 3) {
      const fromId = linkData[i];
      const toId = linkData[i + 1];
      const typeId = linkData[i + 2];
      
      // --- 关键修改 2: 执行过滤 ---
      const typeName = linkTypes[typeId] || 'UNKNOWN';
      // 检查 enabledTypes 是否已初始化，以及该类型是否为 true
      if (enabledTypes.size > 0 && !enabledTypes.get(typeName)) {
          continue; // 如果该类型未启用，则跳过此边
      }
      // --- 过滤结束 ---

      if (!alphas || alphas[fromId * 4 + 3] === 0 || alphas[toId * 4 + 3] === 0) {
        continue; // 如果任一节点不可见，则跳过这条边
     }

      // 检查节点 ID 是否有效 (可能因为过滤等原因不存在于 positions 中)
      if (fromId * 3 + 2 >= idxToPos.length || toId * 3 + 2 >= idxToPos.length) {
          // console.warn(`Skipping link with invalid node ID: from ${fromId}, to ${toId}`);
          continue;
      }


      const fromX = idxToPos[fromId * 3];
      const fromY = idxToPos[fromId * 3 + 1];
      const fromZ = idxToPos[fromId * 3 + 2];
      const toX = idxToPos[toId * 3];
      const toY = idxToPos[toId * 3 + 1];
      const toZ = idxToPos[toId * 3 + 2];

      const dist = distance(fromX, fromY, fromZ, toX, toY, toZ);
      if (maxVisibleDistance < dist) continue;

      jsPos.push(fromX, fromY, fromZ, toX, toY, toZ);

      // --- 根据 isTaskView 和边的类型决定颜色 ---
      if (isTaskView) {
        // const typeName = linkTypes[typeId] || 'UNKNOWN'; // 已在前面获取
        const color = edgeTypeColors[typeName] || defaultEdgeColor;
        jsColors.push(color[0], color[1], color[2], color[0], color[1], color[2]);
      } else {
        // 保持原来的颜色逻辑（基于位置）
        jsColors.push(fromX / r + 0.5, fromY / r + 0.5, fromZ / r + 0.5, toX / r + 0.5, toY / r + 0.5, toZ / r + 0.5);
      }
      // --- 颜色逻辑结束 ---
    }
    // --- 循环结束 ---


    // --- 后续的 Buffer 创建和渲染逻辑保持不变 ---
    var positions = new Float32Array(jsPos);
    var colors = new Float32Array(jsColors);

    var geometry = new THREE.BufferGeometry();
    var material = new THREE.LineBasicMaterial({
      vertexColors: THREE.VertexColors,
      blending: THREE.AdditiveBlending,
      opacity: 0.5, // 可以根据需要调整不透明度
      transparent: true
    });

    geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3));

    geometry.computeBoundingSphere();
    if (linkMesh) {
      scene.remove(linkMesh);
      // 确保释放旧的几何体和材质资源
      linkMesh.geometry.dispose();
      linkMesh.material.dispose();
    }

    linkMesh = new THREE.Line(geometry, material, THREE.LinePieces);// 使用 LineSegments 效率更高
    if (linksVisible) {
        scene.add(linkMesh);
    }
    // --- Buffer 创建和渲染逻辑结束 ---
  }
  function toggleLinks() {
    setOrGetLinksVisible(!linksVisible);
  }
}

function distance(x1, y1, z1, x2, y2, z2) {
  return (x1 - x2) * (x1 - x2) +
        (y1 - y2) * (y1 - y2) +
        (z1 - z2) * (z1 - z2);
}