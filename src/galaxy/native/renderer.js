// src/galaxy/native/renderer.js

import unrender from 'unrender';
window.THREE = unrender.THREE;

import eventify from 'ngraph.events';
import appEvents from '../service/appEvents.js';
import scene from '../store/sceneStore.js';
import getNearestIndex from './getNearestIndex.js';
import createTouchControl from './touchControl.js';
import createLineView from './lineView.js';
import appConfig from './appConfig.js';
import { canBeUsedBy } from '../store/licenseUtils.js';
import edgeFilterStore from '../store/edgeFilterStore.js'; // <--- 导入 store
import taskFilterStore from '../store/taskFilterStore.js'; // <--- 导入任务类型过滤器 store
export default sceneRenderer;
var pathLine = null;
var incompatibleNodeColor = 0x80808033; // 半透明灰色

var pathHighlightColor = 0xffd700ff; // 金色
var pathStartColor = 0x00ff00ff; // 绿色
var pathEndColor = 0xff0000ff; // 红色
// --- 定义颜色 ---
var defaultNodeColor = 0xffffffff;
var highlightNodeColor = 0xff0000ff;
var neighborHighlightColor = 0x00a1ffff;
var chainHighlightColor = 0xffff00ff;
var chainEndNodeColor = 0xffaa00ff;
var chainRootNodeColor = 0x00ff00ff;

var rippleRootColor = 0xffffed;     // 紫色 (根)
var rippleBranchColor = 0xffffed;   // 橙色 (分支)
var rippleLeafColor = 0xffffed;     // 纯黄色
var rippleDefaultColor = 0xffffed ;  // 纯黄色

var specialStartColor = 0xff0000; // 红色 (Start)
var specialBranchColor = 0xffa500; // 橙色 (Branch)
var specialFarthestColor = 0xffff00; // 黄色 (Farthest)
var specialClosestColor = 0x00ffff; // 青色 (Closest)

var contaminatedNodeColor = 0xff4500ff; 

var coreModelColor = 0x00ff00ff;

// --- 模块作用域变量 ---
let licenseLabels = [];
let chainLine = null;
let originalNodeSizes = new Map();
let preHoverColors = new Map(); 

let clusterLabels = []; 
let clusterLabelsVisible = true;
let isTaskTypeViewActive = false; 

function sceneRenderer(container) {
  var renderer, positions, graphModel, touchControl;
  var hitTest, lastHighlight, lastHighlightSize, cameraPosition;
  var lineView, links, lineViewNeedsUpdate;
  var queryUpdateId = setInterval(updateQuery, 200);

  let highlightedNeighbors = new Set();
  let cameraHistory = [];
  const MAX_HISTORY_LENGTH = 10;
  // --- 事件监听区 ---
  appEvents.positionsDownloaded.on(setPositions);
  appEvents.linksDownloaded.on(setLinks);
  appEvents.toggleSteering.on(toggleSteering);
  appEvents.toggleClusterLabels.on(toggleClusterLabels);
  appEvents.focusOnNode.on(focusOnNode);
  appEvents.around.on(around);
  appEvents.highlightQuery.on(highlightQuery);
  appEvents.highlightChainWithData.on(highlightChainHandler);
  appEvents.highlightRippleLevel.on(highlightRippleLevelHandler);
  appEvents.highlightLinks.on(highlightLinks);
  appEvents.highlightNeighbors.on(highlightNeighborsHandler);
  appEvents.accelerateNavigation.on(accelarate);
  appEvents.focusScene.on(focusScene);
  appEvents.cls.on(cls);
  appConfig.on('camera', moveCamera);
  appConfig.on('showLinks', toggleLinks);
  appEvents.highlightLicenseConflicts.on(highlightConflictNodes);
  appEvents.graphDownloaded.on(createClusterLabels);

  appEvents.pathFound.on(highlightPath);
  appEvents.clearPath.on(clearPathHighlight);

  appEvents.showLicenseContamination.on(showLicenseContaminationHandler);
  appEvents.runLicenseSimulation.on(runLicenseSimulationHandler);
  appEvents.timelineChanged.on(handleTimelineChange);
  appEvents.highlightCoreModels.on(highlightCoreModelsHandler);
  appEvents.showCommunities.on(showCommunitiesHandler); 
  appEvents.showTaskTypeView.on(showTaskTypeView);
  appEvents.navigateBack.on(handleNavigateBack);

  // --- 新增：监听 edgeFilterStore ---
  edgeFilterStore.on('changed', onFilterChanged);
  taskFilterStore.on('changed', () => {
      // 只有当前处于 Task View 模式时才刷新
      if (isTaskTypeViewActive) {
          showTaskTypeView();
      }
  });

  var api = {
    destroy: destroy
  };

  eventify(api);
  return api;

  // --- 新增：过滤器变化处理函数 ---
  function onFilterChanged() {
    // 如果 lineView 存在并且链接是可见的，标记为需要更新并重新渲染
    if (lineView && lineView.linksVisible()) {
      console.log('Edge filter changed, re-rendering lines...');
      lineViewNeedsUpdate = true;
      renderLineViewIfNeeded();
    }
  }

function showTaskTypeView() {
    if (!renderer) return;

    const graph = scene.getGraph();
    if (!graph) return;

    const view = renderer.getParticleView();
    const colors = view.colors();
    const sizes = view.sizes(); // 获取尺寸数组
    const nodeData = graph.getRawData().nodeData;

    const taskCategories = {
        'Multimodal': ['Any-to-Any', 'Audio-Text-to-Text', 'Document Question Answering', 'Visual Document Retrieval', 'Image-Text-to-Text', 'Video-Text-to-Text', 'Visual Question Answering'],
        'Natural Language Processing': ['Feature Extraction', 'Fill-Mask', 'Question Answering', 'Sentence Similarity', 'Summarization', 'Table Question Answering', 'Text Classification', 'Text Generation', 'Text Ranking', 'Token Classification', 'Translation', 'Zero-Shot Classification'],
        'Computer Vision': ['Depth Estimation', 'Image Classification', 'Image Feature Extraction', 'Image Segmentation', 'Image-to-Image', 'Image-to-Text', 'Image-to-Video', 'Keypoint Detection', 'Mask Generation', 'Object Detection', 'Video Classification', 'Text-to-Image', 'Text-to-Video', 'Unconditional Image Generation', 'Zero-Shot Image Classification', 'Zero-Shot Object Detection', 'Text-to-3D', 'Image-to-3D'],
        'Audio': ['Audio Classification', 'Audio-to-Audio', 'Automatic Speech Recognition', 'Text-to-Speech'],
        'Tabular': ['Tabular Classification', 'Tabular Regression', 'Reinforcement Learning']
    };

    const categoryColors = {
        'Multimodal': [255, 0, 0], 
        'Natural Language Processing': [0, 255, 0], 
        'Computer Vision': [0, 0, 255], 
        'Audio': [255, 255, 0], 
        'Tabular': [255, 0, 255]  
    };

    const normalize = (str) => str.replace(/-/g, '').replace(/ /g, '').toUpperCase();

    const normalizedTaskCategories = {};
    for (const category in taskCategories) {
        normalizedTaskCategories[category] = taskCategories[category].map(normalize);
    }

    for (let i = 0; i < nodeData.length; i++) {
        const node = nodeData[i];
        
        // 默认设置为不可见/灰色
        let finalColor = 0x808080ff; 
        let isVisible = false;

        if (node && node.tags) {
            const matchedCategories = [];
            const normalizedTags = node.tags.map(normalize);

            // 检查每个分类是否匹配且启用
            for (const category in normalizedTaskCategories) {
                // *** 核心修改：检查 taskFilterStore ***
                if (!taskFilterStore.isEnabled(category)) continue;

                const tasks = normalizedTaskCategories[category];
                if (normalizedTags.some(tag => tasks.includes(tag))) {
                    matchedCategories.push(categoryColors[category]);
                }
            }

            if (matchedCategories.length > 0) {
                isVisible = true;
                const mixedColor = [0, 0, 0];
                matchedCategories.forEach(color => {
                    mixedColor[0] += color[0];
                    mixedColor[1] += color[1];
                    mixedColor[2] += color[2];
                });

                const r = Math.floor(mixedColor[0] / matchedCategories.length);
                const g = Math.floor(mixedColor[1] / matchedCategories.length);
                const b = Math.floor(mixedColor[2] / matchedCategories.length);
                
                // 将颜色数组转换为整数
                finalColor = (r << 24) | (g << 16) | (b << 8) | 0xff;
            } else {
                // 检查是否应该归类为 "Other"
                // 逻辑：如果它有 tags 但没有匹配任何主要分类，且 "Other" 是启用的
                const hasAnyMainCategory = Object.values(normalizedTaskCategories).flat().some(t => normalizedTags.includes(t));
                if (!hasAnyMainCategory && taskFilterStore.isEnabled('Other')) {
                     isVisible = true; // Other 显示为灰色但可见
                     finalColor = 0x808080ff;
                }
            }
        }

        // 应用颜色
        colorNode(i * 3, colors, finalColor);
        
        // *** 交互优化：将隐藏的节点缩小，使其不干扰视线 ***
        // 注意：需要保存原始大小以便恢复，这里简化处理，假设不可见则大小设为 0
        if (!originalNodeSizes.has(i)) {
             originalNodeSizes.set(i, sizes[i] || 30);
        }
        sizes[i] = isVisible ? originalNodeSizes.get(i) : 0; 
    }
    
    view.colors(colors);
    view.sizes(sizes); // 更新尺寸
    isTaskTypeViewActive = true;
    lineViewNeedsUpdate = true; // 确保连接线也可能需要更新
  }

  function recordCameraState() {
      if (!renderer) return;
      const camera = renderer.camera();
      
      const state = {
          pos: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
          // 保存四元数以保持旋转角度
          quat: { x: camera.quaternion.x, y: camera.quaternion.y, z: camera.quaternion.z, w: camera.quaternion.w }
      };

      cameraHistory.push(state);
      if (cameraHistory.length > MAX_HISTORY_LENGTH) {
          cameraHistory.shift(); // 移除最旧的记录
      }
  }

    function handleNavigateBack() {
      if (!renderer || cameraHistory.length === 0) {
          console.log("No camera history to go back to.");
          return;
      }

      const prevState = cameraHistory.pop();
      const camera = renderer.camera();

      // 使用动画移动回上一个位置
      // 注意：这里我们使用 appConfig 来触发移动，或者直接调用 renderer
      // 推荐更新 appConfig 以保持 URL 同步，但这可能会有点慢。
      // 直接操作 camera 并同步 appConfig 是更好的体验。
      
      // 停止当前任何可能的动画
      if (renderer.isAnimated) renderer.isAnimated = false; 

      // 简单起见，直接飞回去（需要引入 simple-tween 或复用 unrender 的动画能力，这里我们直接设置位置，或者使用 appEvents.focusScene 类似的逻辑）
      // 这里我们复用 focusOnNode 的 lookAt 逻辑的变体，或者直接设置。
      // 为了平滑体验，我们使用 appConfig.setCameraConfig 会比较安全，因为它被监听并触发动画(如果配置了)。
      
      // 但是 renderer.js 内部通常直接操作。
      // 让我们直接设置目标，unrender 库会自动处理平滑过渡吗？unrender 的 camera.goTo 是平滑的。
      
      // 计算目标位置对应的 "lookAt" 并不是简单的坐标，unrender 的 camera 模型比较特殊。
      // 这里最稳妥的方式是恢复 position 和 quaternion。
      
      const cameraObj = renderer.camera();
      
      // 使用 unrender 的 goTo 接口 (如果有) 或者手动插值。
      // 查看代码，camera.goTo 存在于 camera.js 中。
      
      // 注意：scene.jsx 中传入的 renderer 是 unrender 的实例。
      // unrender 的 camera.goTo 接受 {x, y, ratio, angle}。
      // 但这里我们保存的是 3D 坐标。
      
      // 既然我们之前 focusOnNode 是让相机飞到某个点，
      // 这里的 navigateBack 最简单的实现是：
      cameraObj.position.set(prevState.pos.x, prevState.pos.y, prevState.pos.z);
      cameraObj.quaternion.set(prevState.quat.x, prevState.quat.y, prevState.quat.z, prevState.quat.w);
      
      // 更新 URL hash，这样如果用户刷新页面，会停留在返回后的位置
      appConfig.setCameraConfig(prevState.pos, prevState.quat);
      
      // 触发重绘
      updateQuery(); 
  }
  function highlightPath(nodeIds) {
    if (!renderer || !nodeIds || nodeIds.length === 0) return;
    cls();

    const view = renderer.getParticleView();
    const colors = view.colors();
    const sizes = view.sizes();

    for (let i = 0; i < colors.length / 4; i++) {
        colors[i * 4 + 3] = 50;
    }

    nodeIds.forEach((nodeId, index) => {
        let color = pathHighlightColor;
        if (index === 0) color = pathStartColor;
        if (index === nodeIds.length - 1) color = pathEndColor;
        
        colorNode(nodeId * 3, colors, color);
        sizes[nodeId] *= 1.5;
    });
    
    view.colors(colors);
    view.sizes(sizes);

    const points = nodeIds.map(id => new THREE.Vector3(
        positions[id * 3],
        positions[id * 3 + 1],
        positions[id * 3 + 2]
    ));

    if (points.length > 1) {
        clearPathHighlight();

        const geometry = new THREE.Geometry();
        geometry.vertices = points; 

        const material = new THREE.LineBasicMaterial({
            color: pathHighlightColor,
            linewidth: 3,
            transparent: true,
            opacity: 0.9
        });
        pathLine = new THREE.Line(geometry, material);
        renderer.scene().add(pathLine);
    }

    appEvents.focusOnArea.fire(nodeIds);
}

function handleTimelineChange(selectedDate) {
  if (selectedDate) {
    console.log(`[Renderer] Event 'timelineChanged' received. Filtering nodes up to date: ${selectedDate.toISOString()}`);
  } else {
    console.log(`[Renderer] Event 'timelineChanged' received with null. Resetting all nodes to be visible.`);
  }

  const graph = scene.getGraph(); 
  if (!renderer || !graph) {
    console.warn('[Renderer] Timeline update stopped: Renderer or graph not ready.');
    return;
  }

  const view = renderer.getParticleView();
  const colors = view.colors();
  const sizes = view.sizes();
  const nodeData = graph.getRawData().nodeData;

  if (!nodeData) {
      console.error('[Renderer] Node data is not available on the graph object.');
      return;
  }

  let visibleCount = 0;
  for (let i = 0; i < nodeData.length; i++) {
      const isVisible = !selectedDate || (
          nodeData[i] && nodeData[i].createdAt && new Date(nodeData[i].createdAt) <= selectedDate
      );

      if (isVisible) visibleCount++;

      const colorOffset = i * 4;
      colors[colorOffset + 3] = isVisible ? 255 : 0; 
    
      if (!originalNodeSizes.has(i)) {
          originalNodeSizes.set(i, sizes[i] || 30);
      }
      sizes[i] = isVisible ? originalNodeSizes.get(i) : 0;
  }

  console.log(`[Renderer] Update complete. Total visible nodes: ${visibleCount}`);

  view.colors(colors);
  view.sizes(sizes);
  
  if (lineView && lineView.linksVisible()) {
      lineView.render(links, positions);
  }
}
function runLicenseSimulationHandler(targetLicense) {
  if (!renderer) return;
  
  appEvents.simulationStatusUpdate.fire({ running: true, progress: 0 });

  const graph = scene.getGraph();
  if (!graph || !targetLicense) {
    if (!targetLicense) {
      console.log('[Renderer] Resetting view because targetLicense is null.');
      cls();
    }
    appEvents.simulationStatusUpdate.fire({ running: false, progress: 100 });
    return;
  }

  const view = renderer.getParticleView();
  const colors = view.colors();
  const nodeCount = graph.getRawData().labels.length;
  const compatibilityCache = new Map();
  const chunkSize = 500;
  let currentIndex = 0;

  console.log(`[Renderer] Starting simulation for ${nodeCount} nodes with target license: ${targetLicense}`);

  function processChunk() {
    const start = currentIndex;
    const end = Math.min(currentIndex + chunkSize, nodeCount);

    for (let i = start; i < end; i++) {
      const isCompatible = isChainCompatible(i, targetLicense, graph, compatibilityCache, new Set());
      const color = isCompatible ? defaultNodeColor : incompatibleNodeColor;
      colorNode(i * 3, colors, color);
    }

    currentIndex = end;
    const progress = (currentIndex / nodeCount) * 100;

    appEvents.simulationStatusUpdate.fire({ running: true, progress: progress });

    if (currentIndex < nodeCount) {
      requestAnimationFrame(processChunk);
    } else {
      console.log(`[Renderer] Simulation finished.`);
      view.colors(colors);
      appEvents.simulationStatusUpdate.fire({ running: false, progress: 100 });
    }
  }

  requestAnimationFrame(processChunk);
}

function isChainCompatible(nodeId, targetLicense, graph, cache, path) {
  if (cache.has(nodeId)) {
    return cache.get(nodeId);
  }

  if (path.has(nodeId)) {
    cache.set(nodeId, false);
    return false;
  }
  path.add(nodeId);

  const nodeData = graph.getNodeData(nodeId);
  if (!nodeData) {
    path.delete(nodeId); 
    cache.set(nodeId, true); 
    return true;
  }
  
  const licenseTag = (nodeData.tags || []).find(t => typeof t === 'string' && t.startsWith('license:'));
  const currentLicense = licenseTag ? licenseTag.substring(8) : (nodeData.license || 'N/A');

  if (!canBeUsedBy(currentLicense, targetLicense)) {
    path.delete(nodeId);
    cache.set(nodeId, false);
    return false;
  }

  const baseModelTags = (nodeData.tags || []).filter(t => t.startsWith('base_model:'));
  if (baseModelTags.length === 0) {
    path.delete(nodeId);
    cache.set(nodeId, true); 
    return true;
  }

  for (const tag of baseModelTags) {
    const baseModelId = tag.substring(11);
    const parentNodeId = scene.getNodeIdByModelId(baseModelId);
    
    if (parentNodeId === undefined) {
      path.delete(nodeId);
      cache.set(nodeId, false);
      return false;
    }

    if (!isChainCompatible(parentNodeId, targetLicense, graph, cache, path)) {
      path.delete(nodeId);
      cache.set(nodeId, false);
      return false;
    }
  }
  
  path.delete(nodeId);
  cache.set(nodeId, true);
  return true;
}
function showLicenseContaminationHandler(startModelName) {
  if (!renderer) return;

  const startNodeId = scene.getNodeIdByModelId(startModelName);
  if (startNodeId === undefined) return;
  
  cls();

  const view = renderer.getParticleView();
  const colors = view.colors();
  const contaminatedSet = new Set();
  const queue = [startNodeId];
  
  contaminatedSet.add(startNodeId);

  while (queue.length > 0) {
    const currentNodeId = queue.shift();
    const neighbors = scene.getConnected(currentNodeId, 'out'); 

    neighbors.forEach(neighbor => {
      if (!contaminatedSet.has(neighbor.id)) {
        contaminatedSet.add(neighbor.id);
        queue.push(neighbor.id);
      }
    });
  }

  contaminatedSet.forEach(nodeId => {
    const color = (nodeId === startNodeId) ? highlightNodeColor : contaminatedNodeColor;
    colorNode(nodeId * 3, colors, color);
  });

  view.colors(colors);
}

function clearPathHighlight() {
    cls();
    if (pathLine) {
        renderer.scene().remove(pathLine);
        if (pathLine.geometry) pathLine.geometry.dispose();
        if (pathLine.material) pathLine.material.dispose();
        pathLine = null;
    }
}
  function highlightConflictNodes(nodeIds) {
    if (!renderer || !nodeIds) return;
    const view = renderer.getParticleView();
    const colors = view.colors();
    cls(); 
    nodeIds.forEach(nodeId => {
        colorNode(nodeId * 3, colors, highlightNodeColor); 
    });
    view.colors(colors);
  }

  function accelarate(isPrecise) {
    var input = renderer.input();
    if (isPrecise) {
      input.movementSpeed *= 4;
      input.rollSpeed *= 4;
    } else {
      input.movementSpeed /= 4;
      input.rollSpeed /= 4;
    }
  }

  function updateQuery() {
    if (!renderer) return;
    var camera = renderer.camera();
    appConfig.setCameraConfig(camera.position, camera.quaternion);
    appEvents.cameraMoved.fire(camera);
  }

  function toggleSteering() {
    if (!renderer) return;
    var input = renderer.input();
    var isDragToLookEnabled = input.toggleDragToLook();
    var isSteering = !isDragToLookEnabled;
    appEvents.showSteeringMode.fire(isSteering);
  }

  function clearHover() {
    appEvents.nodeHover.fire({
      nodeIndex: undefined,
      mouseInfo: undefined
    });
  }

  function focusOnNode(nodeId, shouldSelectAfterFocus = true) {
    if (!renderer) return;
    recordCameraState();

    function highlightFocused() {
      appEvents.selectNode.fire(nodeId);
    }
    renderer.lookAt(nodeId * 3, shouldSelectAfterFocus ? highlightFocused : null);
  }

  function toggleClusterLabels() {
    clusterLabelsVisible = !clusterLabelsVisible;
    if (!clusterLabelsVisible) {
      clusterLabels.forEach(labelInfo => {
        labelInfo.sprite.visible = false;
      });
    }
  }

  function around(r, x, y, z) {
    renderer.around(r, x, y, z);
  }

  function setPositions(_positions) {
    destroyHitTest();
    positions = _positions;
    focusScene();
    if (!renderer) {
      renderer = unrender(container);
      renderer.onFrame(updateLabelsInRenderLoop);
      touchControl = createTouchControl(renderer);
      moveCameraInternal();
      var input = renderer.input();
      input.on('move', clearHover);
    }
    renderer.particles(positions);
    hitTest = renderer.hitTest();
    hitTest.on('over', handleOver);
    hitTest.on('click', handleClick);
    hitTest.on('dblclick', handleDblClick);
    hitTest.on('hitTestReady', adjustMovementSpeed);
  }

  function adjustMovementSpeed(tree) {
    var input = renderer.input();
    if (tree) {
      var root = tree.getRoot();
      input.movementSpeed = root.bounds.half * 0.02;
    } else {
      input.movementSpeed *= 2;
    }
  }

  function focusScene() {
    setTimeout(function() {
      container.focus();
    }, 30);
  }

  function setLinks(outLinks, inLinks) {
    links = outLinks;
    lineViewNeedsUpdate = true;
    updateSizes(outLinks, inLinks);
    renderLineViewIfNeeded();
  }

  function updateSizes(outLinks, inLinks) {
    var maxInDegree = getMaxSize(inLinks);
    var view = renderer.getParticleView();
    var sizes = view.sizes();
    for (var i = 0; i < sizes.length; ++i) {
      var degree = inLinks[i];
      if (degree) {
        sizes[i] = ((200 / maxInDegree) * degree.length + 15);
      } else {
        sizes[i] = 30;
      }
    }
    view.sizes(sizes);
  }

  function getMaxSize(sparseArray) {
    var maxSize = 0;
    for (var i = 0; i < sparseArray.length; ++i) {
      var item = sparseArray[i];
      if (item && item.length > maxSize) maxSize = item.length;
    }
    return maxSize;
  }

  function renderLineViewIfNeeded() {
    if (!appConfig.getShowLinks()) return;
    if (!lineView) {
      lineView = createLineView(renderer.scene(), unrender.THREE);
    }
    // 不再需要传递 links 和 positions，lineView 会自己获取
    // 确保 isTaskTypeViewActive 被传递
    const graph = scene.getGraph();
    const rawData = graph ? graph.getRawData() : null;
    const positions = rawData ? rawData.positions : null;
    // 传递 isTaskViewActive，即使 positions 为 null，lineView 内部也会处理
    lineView.render(null, positions, isTaskTypeViewActive, renderer.getParticleView().colors());
    lineViewNeedsUpdate = false;
  }

  function toggleLinks() {
    if (!lineView) {
        renderLineViewIfNeeded();
        return;
    }

    if (lineViewNeedsUpdate || !lineView.linksVisible()) {
        renderLineViewIfNeeded();
    }
    
    lineView.toggleLinks();
  }

  function moveCamera() {
    moveCameraInternal();
  }

  function moveCameraInternal() {
    if (!renderer) return;
    var camera = renderer.camera();
    var pos = appConfig.getCameraPosition();
    if (pos) {
      camera.position.set(pos.x, pos.y, pos.z);
    }
    var lookAt = appConfig.getCameraLookAt();
    if (lookAt) {
      camera.quaternion.set(lookAt.x, lookAt.y, lookAt.z, lookAt.w);
    }
  }

  function destroyHitTest() {
    if (!hitTest) return;
    hitTest.off('over', handleOver);
    hitTest.off('click', handleClick);
    hitTest.off('dblclick', handleDblClick);
    hitTest.off('hitTestReady', adjustMovementSpeed);
  }

  function handleClick(e) {
    var nearestIndex = getNearestIndex(positions, e.indexes, e.ray, 30);
    appEvents.selectNode.fire(getModelIndex(nearestIndex));
  }

  function handleDblClick(e) {
    var nearestIndex = getNearestIndex(positions, e.indexes, e.ray, 30);
    if (nearestIndex !== undefined) {
      focusOnNode(nearestIndex/3);
    }
  }

  function handleOver(e) {
    var nearestIndex = getNearestIndex(positions, e.indexes, e.ray, 30);
    highlightNode(nearestIndex);
    appEvents.nodeHover.fire({
      nodeIndex: getModelIndex(nearestIndex),
      mouseInfo: e
    });
  }

  function highlightNeighborsHandler(nodeId, isHighlight) {
    const view = renderer.getParticleView();
    if (!view) return;
    const colors = view.colors();
    highlightedNeighbors.forEach(neighborId => {
        if (neighborId * 3 !== lastHighlight) {
            colorNode(neighborId * 3, colors, defaultNodeColor);
        }
    });
    highlightedNeighbors.clear();
    if (isHighlight) {
        const inNeighbors = scene.getConnected(nodeId, 'in');
        const outNeighbors = scene.getConnected(nodeId, 'out');
        const allNeighbors = [...inNeighbors, ...outNeighbors];
        const neighborIds = new Set(allNeighbors.map(n => n.id));
        neighborIds.forEach(neighborId => {
            colorNode(neighborId * 3, colors, neighborHighlightColor);
            highlightedNeighbors.add(neighborId);
        });
    }
    view.colors(colors);
  }

  function highlightNode(nodeIndex) {
    if (!renderer) return;

    const view = renderer.getParticleView();
    const colors = view.colors();
    const sizes = view.sizes();
    const nodeId = nodeIndex / 3;

    if (lastHighlight !== undefined) {
      const lastNodeId = lastHighlight / 3;
      const previousColor = preHoverColors.get(lastNodeId);
      if (previousColor) {
        const colorOffset = lastNodeId * 4;
        colors[colorOffset + 0] = previousColor.r;
        colors[colorOffset + 1] = previousColor.g;
        colors[colorOffset + 2] = previousColor.b;
        colors[colorOffset + 3] = previousColor.a;
        preHoverColors.delete(lastNodeId);
      }
      sizes[lastNodeId] = lastHighlightSize;
    }

    lastHighlight = nodeIndex;

    if (lastHighlight !== undefined) {
      const colorOffset = nodeId * 4;
      preHoverColors.set(nodeId, {
        r: colors[colorOffset + 0],
        g: colors[colorOffset + 1],
        b: colors[colorOffset + 2],
        a: colors[colorOffset + 3]
      });

      colorNode(lastHighlight, colors, highlightNodeColor);
      lastHighlightSize = sizes[nodeId];
      sizes[nodeId] *= 1.5;
    }

    view.colors(colors);
    view.sizes(sizes);
  }

  function highlightChainHandler(nodesToHighlight) {
    if (!renderer || !nodesToHighlight || nodesToHighlight.length === 0) return;
    
    const view = renderer.getParticleView();
    const colors = view.colors();
    const sizes = view.sizes();
    originalNodeSizes.clear();

    nodesToHighlight.forEach((node, index) => {
      const nodeId = node.id;
      
      originalNodeSizes.set(nodeId, sizes[nodeId]);
      
      let color = chainHighlightColor;
      let sizeMultiplier = 1.5;

      if (index === 0) {
        color = chainEndNodeColor;
        sizeMultiplier = 2.0;
      }
      if (index === nodesToHighlight.length - 1) {
        color = chainRootNodeColor;
        sizeMultiplier = 2.0;
      }
      
      colorNode(nodeId * 3, colors, color);
      sizes[nodeId] = (sizes[nodeId] || 30) * sizeMultiplier;
    });
    view.colors(colors);
    view.sizes(sizes);
    
    licenseLabels.forEach(label => renderer.scene().remove(label));
    licenseLabels = [];

    nodesToHighlight.forEach(node => {
      if (node.license && node.license !== 'N/A' && node.license !== 'Unknown') {
        const labelSprite = createTextSprite(node.license, false);
        const pos = positions[node.id * 3];
        const posY = positions[node.id * 3 + 1];
        const posZ = positions[node.id * 3 + 2];
        labelSprite.position.set(pos, posY + (sizes[node.id] || 30) * 1.5, posZ);
        renderer.scene().add(labelSprite);
        licenseLabels.push(labelSprite);
      }
    });

    const points = [];
    nodesToHighlight.forEach(node => {
      points.push(new THREE.Vector3(
        positions[node.id * 3],
        positions[node.id * 3 + 1],
        positions[node.id * 3 + 2]
      ));
    });
    if (points.length > 1) {
      if (chainLine) renderer.scene().remove(chainLine);
      const geometry = new THREE.Geometry();
      geometry.vertices = points;
      const material = new THREE.LineBasicMaterial({
            color: chainHighlightColor,
            linewidth: 2,
            transparent: true,
            opacity: 0.8
        });
      chainLine = new THREE.Line(geometry, material);
      renderer.scene().add(chainLine);
    }
  }

  function highlightRippleLevelHandler(nodes) {
    if (!renderer || !nodes || nodes.length === 0) return;

    const view = renderer.getParticleView();
    const colors = view.colors();
    const sizes = view.sizes();
    const baseSize = 30;

    nodes.forEach(nodeInfo => {
      let color = rippleDefaultColor;
      if (nodeInfo.isRoot) color = rippleRootColor;
      else if (nodeInfo.isLeaf) color = rippleLeafColor;
      else if (nodeInfo.isBranch) color = rippleBranchColor;

      colorNode(nodeInfo.id * 3, colors, color);

      if (!originalNodeSizes.has(nodeInfo.id)) {
        originalNodeSizes.set(nodeInfo.id, sizes[nodeInfo.id] || baseSize);
      }
      const trueOriginalSize = originalNodeSizes.get(nodeInfo.id);

      sizes[nodeInfo.id] = trueOriginalSize * 3.5;
      setTimeout(() => {
        sizes[nodeInfo.id] = trueOriginalSize * 1.8;
        view.sizes(sizes);
      }, 350);
    });

    view.colors(colors);
    view.sizes(sizes);
  }

  function createTextSprite(message, isClusterLabel = false) {
      const fontface = "Arial";
      const fontsize = isClusterLabel ? 48 : 24;
      const padding = isClusterLabel ? 20 : 10;
      const borderRadius = isClusterLabel ? 12 : 6;
      const maxTextWidth = isClusterLabel ? 1000 : 500;
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      context.font = "Bold " + fontsize + "px " + fontface;
      
      let textWidth = context.measureText(message).width;
      if (textWidth > maxTextWidth) {
          textWidth = maxTextWidth;
      }

      canvas.width = textWidth + padding * 2;
      canvas.height = fontsize * 1.4 + padding * 2;

      context.font = "Bold " + fontsize + "px " + fontface;
      context.textAlign = "center";
      context.textBaseline = "middle";

      context.fillStyle = isClusterLabel ? "rgba(0, 50, 100, 0.85)" : "rgba(255, 255, 255, 0.95)";
      context.strokeStyle = isClusterLabel ? "rgba(100, 200, 255, 1.0)" : "rgba(0, 0, 0, 0.95)";
      context.lineWidth = isClusterLabel ? 6 : 4;
      
      roundRect(context, 0, 0, canvas.width, canvas.height, borderRadius);

      context.fillStyle = isClusterLabel ? "rgba(255, 255, 255, 1.0)" : "rgba(0, 0, 0, 1.0)";
      
      if (context.measureText(message).width > maxTextWidth) {
          let truncatedMessage = message;
          while (context.measureText(truncatedMessage + '...').width > maxTextWidth && truncatedMessage.length > 0) {
              truncatedMessage = truncatedMessage.slice(0, -1);
          }
          message = truncatedMessage + '...';
      }
      context.fillText(message, canvas.width / 2, canvas.height / 2);

      const texture = new THREE.Texture(canvas);
      texture.needsUpdate = true;
      texture.minFilter = THREE.LinearFilter;
      const spriteMaterial = new THREE.SpriteMaterial({ 
          map: texture,
          transparent: true,
          depthTest: false 
      });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(canvas.width, canvas.height, 1.0); 
      return sprite;
  }

  function roundRect(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
  }

  function createClusterLabels() {
    if (!renderer || !positions) return;

    clusterLabels.forEach(label => renderer.scene().remove(label.sprite));
    clusterLabels = [];

    const coreNodes = scene.getTopNModelsByInDegree(20); 
    
    coreNodes.forEach(node => {
      const sprite = createTextSprite(node.name, true); 
      sprite.visible = false; 

      const x = positions[node.id * 3];
      const y = positions[node.id * 3 + 1];
      const z = positions[node.id * 3 + 2];
      sprite.position.set(x, y, z);
      
      renderer.scene().add(sprite);

      clusterLabels.push({
        nodeId: node.id,
        sprite: sprite,
        baseWidth: sprite.scale.x, 
        baseHeight: sprite.scale.y
      });
    });
  }

  function updateLabelsInRenderLoop() {
    if (!renderer || clusterLabels.length === 0 || !positions || !clusterLabelsVisible) {
      return; 
    }

    const camera = renderer.camera();
    const minDistance = 4000;
    const maxDistance = 200000;
    
    const maxScaleMultiplier = 4.0; 

    clusterLabels.forEach(labelInfo => {
      const nodePosition = new THREE.Vector3(
        positions[labelInfo.nodeId * 3],
        positions[labelInfo.nodeId * 3 + 1],
        positions[labelInfo.nodeId * 3 + 2]
      );

      const distance = camera.position.distanceTo(nodePosition);
      
      if (distance > minDistance && distance < maxDistance) {
        labelInfo.sprite.visible = true;

        let scale = (distance / minDistance);
        scale = Math.log2(scale + 1);
        scale = Math.min(scale, maxScaleMultiplier);

        labelInfo.sprite.scale.set(
            labelInfo.baseWidth * scale, 
            labelInfo.baseHeight * scale, 
            1.0
        );
        
        let opacity = 1.0;
        const fadeRange = 5000;
        if (distance < minDistance + fadeRange) { 
           opacity = (distance - minDistance) / fadeRange;
        } else if (distance > maxDistance - fadeRange) {
           opacity = 1.0 - (distance - (maxDistance - fadeRange)) / fadeRange;
        }
        labelInfo.sprite.material.opacity = Math.max(0, Math.min(1, opacity));

      } else {
        labelInfo.sprite.visible = false;
      }
    });
  }

  function highlightQuery(query, color, scale) {
    if (!renderer) return;
    var nodeIds = query.results.map(toNativeIndex);
    var view = renderer.getParticleView();
    var colors = view.colors();
    for (var i = 0; i < nodeIds.length; ++i) {
      colorNode(nodeIds[i], colors, color);
    }
    view.colors(colors);
    appEvents.queryHighlighted.fire(query, color);
  }

  function colorNode(nodeId, colors, color) {
    var colorOffset = (nodeId/3) * 4;
    colors[colorOffset + 0] = (color >> 24) & 0xff;
    colors[colorOffset + 1] = (color >> 16) & 0xff;
    colors[colorOffset + 2] = (color >> 8) & 0xff;
    colors[colorOffset + 3] = (color & 0xff);
  }

  function highlightLinks(links, color) {
    if (!renderer) return;
    var lines = new Float32Array(links.length * 3);
    for (var i = 0; i < links.length; ++i) {
      var i3 = links[i] * 3;
      lines[i * 3] = positions[i3];
      lines[i * 3 + 1] = positions[i3 + 1];
      lines[i * 3 + 2] = positions[i3 + 2];
    }
    renderer.lines(lines, color);
  }

  function cls() {
    if (!renderer) return;
    var view = renderer.getParticleView();
    var colors = view.colors();
    var sizes = view.sizes(); 
    isTaskTypeViewActive = false;
    lineViewNeedsUpdate = true;
    for (var i = 0; i < colors.length/4; i++) {
      colorNode(i * 3, colors, defaultNodeColor);
      if (originalNodeSizes.has(i)) {
          sizes[i] = originalNodeSizes.get(i);
      }
    }
    view.colors(colors);
    view.sizes(sizes);
    originalNodeSizes.clear();

    licenseLabels.forEach(label => renderer.scene().remove(label));
    licenseLabels = [];
    if (chainLine) {
        renderer.scene().remove(chainLine);
        if (chainLine.geometry) chainLine.geometry.dispose();
        if (chainLine.material) chainLine.material.dispose();
        chainLine = null;
    }
  }

  function toNativeIndex(i) {
    return i.id * 3;
  }

  function getModelIndex(nearestIndex) {
    if (nearestIndex !== undefined) {
      return nearestIndex/3;
    }
  }

  function highlightCoreModelsHandler(topN) {
    if (!renderer) return;
    
    cls();

    const coreModels = scene.getTopNModelsByCentrality(topN);
    const coreModelIds = new Set(coreModels.map(m => m.id));

    const view = renderer.getParticleView();
    const colors = view.colors();
    const sizes = view.sizes();
    const totalNodes = colors.length / 4;

    for (let i = 0; i < totalNodes; i++) {
      if (coreModelIds.has(i)) {
        colorNode(i * 3, colors, coreModelColor);
        if (!originalNodeSizes.has(i)) {
          originalNodeSizes.set(i, sizes[i] || 30);
        }
        sizes[i] = originalNodeSizes.get(i) * 3;
      } else {
        const colorOffset = i * 4;
        colors[colorOffset + 3] = 40;
      }
    }

    view.colors(colors);
    view.sizes(sizes);
  }
function getCommunityColor(communityId) {
  const goldenRatioConjugate = 0.61803398875;
  let hue = (communityId * goldenRatioConjugate) % 1;
  
  let h = hue * 6;
  let i = Math.floor(h);
  let f = h - i;
  let q = 1 - f;
  let r, g, b;

  switch (i % 6) {
      case 0: r = 1; g = f; b = 0; break;
      case 1: r = q; g = 1; b = 0; break;
      case 2: r = 0; g = 1; b = f; break;
      case 3: r = 0; g = q; b = 1; break;
      case 4: r = f; g = 0; b = 1; break;
      case 5: r = 1; g = 0; b = q; break;
  }
  
  const red = Math.floor(r * 255);
  const green = Math.floor(g * 255);
  const blue = Math.floor(b * 255);

  return (red << 24) | (green << 16) | (blue << 8) | 0xff;
}

function showCommunitiesHandler(communityData) {
  if (!renderer) return;
  
  if (!communityData || !communityData.result || !communityData.nodeIds) {
      console.warn('Communities data is not available or has incorrect format.');
      return;
  }

  const { result: communities, nodeIds: visibleNodeIds } = communityData;

  cls(); 

  const view = renderer.getParticleView();
  const colors = view.colors();
  const totalNodes = colors.length / 4;

  for (let i = 0; i < totalNodes; i++) {
      if (visibleNodeIds.has(i)) {
          const communityId = communities.getClass(i);
          if (communityId !== undefined) {
              const communityColor = getCommunityColor(communityId);
              colorNode(i * 3, colors, communityColor);
          }
      } else {
          const colorOffset = i * 4;
          colors[colorOffset + 3] = 0;
      }
  }

  view.colors(colors);
}
  function destroy() {
    var input = renderer.input();
    if (input) input.off('move', clearHover);
    if (renderer) renderer.destroy();
    appEvents.positionsDownloaded.off(setPositions);
    appEvents.linksDownloaded.off(setLinks);
    appEvents.graphDownloaded.off(createClusterLabels);
    if (touchControl) touchControl.destroy();

    // --- 新增：取消订阅 ---
    edgeFilterStore.off('changed', onFilterChanged);
    // --- 结束 ---

    renderer = null;
    clearInterval(queryUpdateId);
    appConfig.off('camera', moveCamera);
    appConfig.off('showLinks', toggleLinks);
  }
}