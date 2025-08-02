// src/galaxy/native/renderer.js (最终修正版 - 修复作用域问题)

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

// --- 定义颜色 ---
var defaultNodeColor = 0xffffffff;
var highlightNodeColor = 0xff0000ff;
var neighborHighlightColor = 0x00a1ffff;
var chainHighlightColor = 0xffff00ff;
var chainEndNodeColor = 0xffaa00ff;   // <--- 新增: 继承链末端节点 (橙色)
var chainRootNodeColor = 0x00ff00ff; // <--- 新增: 继承链根节点 (绿色)

// --- 核心修正: 将这些变量定义在模块作用域 ---
let licenseLabels = [];
let chainLine = null;
let originalNodeSizes = new Map(); // <--- 新增: 用于存储节点的原始大小
// --- 修正结束 ---

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
  appEvents.focusOnNode.on(focusOnNode);
  appEvents.around.on(around);
  appEvents.highlightQuery.on(highlightQuery);
  appEvents.highlightChainWithData.on(highlightChainHandler);
  appEvents.highlightLinks.on(highlightLinks);
  appEvents.highlightNeighbors.on(highlightNeighborsHandler);
  appEvents.accelerateNavigation.on(accelarate);
  appEvents.focusScene.on(focusScene);
  appEvents.cls.on(cls);
  appConfig.on('camera', moveCamera);
  appConfig.on('showLinks', toggleLinks);

  var api = {
    destroy: destroy
  };

  eventify(api);
  return api;

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

    // 这个回调函数现在只在需要时才会被使用
    function highlightFocused() {
      appEvents.selectNode.fire(nodeId);
    }

    // 根据 shouldSelectAfterFocus 的值，决定是否在动画后触发选择事件
    renderer.lookAt(nodeId * 3, shouldSelectAfterFocus ? highlightFocused : null);
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
    originalNodeSizes.clear(); // 清空上次记录的大小

    // 1. 高亮节点，并突出显示首尾
    nodesToHighlight.forEach((node, index) => {
      const nodeId = node.id;
      
      // 存储原始大小以便恢复
      originalNodeSizes.set(nodeId, sizes[nodeId]);
      
      let color = chainHighlightColor; // 默认为黄色
      let sizeMultiplier = 1.5; // 中间节点放大倍数

      if (index === 0) { // 继承链的终点 (离当前节点最近的父模型)
        color = chainEndNodeColor;
        sizeMultiplier = 2.0; // 放大更多
      }
      if (index === nodesToHighlight.length - 1) { // 继承链的起点 (根模型)
        color = chainRootNodeColor;
        sizeMultiplier = 2.0; // 放大更多
      }
      
      colorNode(nodeId * 3, colors, color);
      sizes[nodeId] = (sizes[nodeId] || 30) * sizeMultiplier; // 改变大小
    });
    view.colors(colors);
    view.sizes(sizes); // 应用大小变化
    nodesToHighlight.forEach(node => {
      if (node.license && node.license !== 'N/A' && node.license !== 'Unknown') {
        const labelSprite = createTextSprite(node.license);
        const pos = positions[node.id * 3];
        const posY = positions[node.id * 3 + 1];
        const posZ = positions[node.id * 3 + 2];
        labelSprite.position.set(pos, posY + 20, posZ);
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

  function createTextSprite(message) {
      const fontface = "Arial";
      const fontsize = 24;
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      context.font = "Bold " + fontsize + "px " + fontface;
      const metrics = context.measureText(message);
      const textWidth = metrics.width;
      context.fillStyle = "rgba(255, 255, 255, 0.95)";
      context.strokeStyle = "rgba(0, 0, 0, 0.95)";
      context.lineWidth = 4;
      roundRect(context, 2, 2, textWidth + 12, fontsize * 1.4 + 12, 6);
      context.fillStyle = "rgba(0, 0, 0, 1.0)";
      context.fillText(message, 8, fontsize + 8);
      const texture = new THREE.Texture(canvas);
      texture.needsUpdate = true;
      texture.minFilter = THREE.LinearFilter;
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(100, 50, 1.0);
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
    for (var i = 0; i < colors.length/4; i++) {
      colorNode(i * 3, colors, 0xffffffff);
    }
    view.colors(colors);

    // 清理继承链相关的3D对象
    licenseLabels.forEach(label => renderer.scene().remove(label));
    licenseLabels = [];
    if (chainLine) {
        renderer.scene().remove(chainLine);
        chainLine.geometry.dispose();
        chainLine.material.dispose();
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
    if (touchControl) touchControl.destroy();
    renderer = null;
    clearInterval(queryUpdateId);
    appConfig.off('camera', moveCamera);
    appConfig.off('showLinks', toggleLinks);
  }
}