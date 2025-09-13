// src/galaxy/native/renderer.js (最终修复版)

import unrender from 'unrender';
window.THREE = unrender.THREE;

import eventify from 'ngraph.events';
import appEvents from '../service/appEvents.js';
import scene from '../store/sceneStore.js';
import getNearestIndex from './getNearestIndex.js';
import createTouchControl from './touchControl.js';
import createLineView from './lineView.js';
import appConfig from './appConfig.js';

export default sceneRenderer;
var pathLine = null;
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

// --- 模块作用域变量 ---
let licenseLabels = [];
let chainLine = null;
let originalNodeSizes = new Map();

let clusterLabels = []; 
let clusterLabelsVisible = true;

function sceneRenderer(container) {
  var renderer, positions, graphModel, touchControl;
  var hitTest, lastHighlight, lastHighlightSize, cameraPosition;
  var lineView, links, lineViewNeedsUpdate;
  var queryUpdateId = setInterval(updateQuery, 200);

  let highlightedNeighbors = new Set();

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

  var api = {
    destroy: destroy
  };

  eventify(api);
  return api;
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

        // --- 核心修复：使用旧版的 API 来创建线条 ---
        const geometry = new THREE.Geometry();
        geometry.vertices = points; // 直接将点赋值给 vertices 属性

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

function showLicenseContaminationHandler(startModelName) {
  if (!renderer) return;

  const startNodeId = scene.getNodeIdByModelId(startModelName);
  if (startNodeId === undefined) return;
  
  cls(); // 清除之前的所有高亮

  const view = renderer.getParticleView();
  const colors = view.colors();
  const contaminatedSet = new Set();
  const queue = [startNodeId];
  
  contaminatedSet.add(startNodeId);

  // 使用广度优先搜索 (BFS) 遍历所有下游节点
  while (queue.length > 0) {
    const currentNodeId = queue.shift();
    const neighbors = scene.getConnected(currentNodeId, 'out'); // 获取所有出度邻居

    neighbors.forEach(neighbor => {
      if (!contaminatedSet.has(neighbor.id)) {
        contaminatedSet.add(neighbor.id);
        queue.push(neighbor.id);
      }
    });
  }

  // 为所有受影响的节点上色
  contaminatedSet.forEach(nodeId => {
    // 中心节点用更亮的颜色突出
    const color = (nodeId === startNodeId) ? highlightNodeColor : contaminatedNodeColor;
    colorNode(nodeId * 3, colors, color);
  });

  view.colors(colors);
}

function clearPathHighlight() {
    cls(); // cls会重置颜色和大小
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
    lineView.render(links, positions);
    lineViewNeedsUpdate = false;
  }

  function toggleLinks() {
    if (lineView) {
      if (lineViewNeedsUpdate) renderLineViewIfNeeded();
      lineView.toggleLinks();
    } else {
      renderLineViewIfNeeded();
    }
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
    if (lastHighlight !== undefined) {
        const lastHighlightId = lastHighlight / 3;
        const colorToRestore = highlightedNeighbors.has(lastHighlightId) ? neighborHighlightColor : defaultNodeColor;
        colorNode(lastHighlight, colors, colorToRestore);
        sizes[lastHighlightId] = lastHighlightSize;
    }
    lastHighlight = nodeIndex;
    if (lastHighlight !== undefined) {
      colorNode(lastHighlight, colors, highlightNodeColor);
      lastHighlightSize = sizes[lastHighlight/3];
      sizes[lastHighlight/3] *= 1.5;
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

  // --- 修复: 恢复创建许可证标签的逻辑 ---
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

      // --- 核心修复：从 originalNodeSizes Map 中获取或存储真实的原始尺寸 ---
      if (!originalNodeSizes.has(nodeInfo.id)) {
        originalNodeSizes.set(nodeInfo.id, sizes[nodeInfo.id] || baseSize);
      }
      const trueOriginalSize = originalNodeSizes.get(nodeInfo.id);
      // --- 修复结束 ---

      sizes[nodeInfo.id] = trueOriginalSize * 3.5; // 基于真实原始尺寸放大
      setTimeout(() => {
        sizes[nodeInfo.id] = trueOriginalSize * 1.8; // 基于真实原始尺寸恢复
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
    const minDistance = 8000;
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

  function destroy() {
    var input = renderer.input();
    if (input) input.off('move', clearHover);
    if (renderer) renderer.destroy();
    appEvents.positionsDownloaded.off(setPositions);
    appEvents.linksDownloaded.off(setLinks);
    appEvents.graphDownloaded.off(createClusterLabels);
    if (touchControl) touchControl.destroy();
    renderer = null;
    clearInterval(queryUpdateId);
    appConfig.off('camera', moveCamera);
    appConfig.off('showLinks', toggleLinks);
  }
}