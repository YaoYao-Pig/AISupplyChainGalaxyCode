// src/galaxy/native/lineView.js

import appConfig from './appConfig.js';

export default renderLinks;

function renderLinks(scene, THREE) {
  var linksVisible = true;
  var linkMesh;

  var api = {
    render: render,
    toggleLinks: toggleLinks,
    linksVisible: setOrGetLinksVisible
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

  function render(links, idxToPos, isTaskView, nodeColors) {
    var jsPos = [];
    var jsColors = [];
    var r = 16000;
    var i = 0;
    var maxVisibleDistance = appConfig.getMaxVisibleEdgeLength();

    for (i = 0; i < links.length; ++i) {
      var to = links[i];
      if (to === undefined) continue; 

      var fromX = idxToPos[i * 3];
      var fromY = idxToPos[i * 3 + 1];
      var fromZ = idxToPos[i * 3 + 2];

      for (var j = 0; j < to.length; j++) {
        var toIdx = to[j];

        var toX = idxToPos[toIdx * 3];
        var toY = idxToPos[toIdx * 3 + 1];
        var toZ = idxToPos[toIdx * 3 + 2];

        var dist = distance(fromX, fromY, fromZ, toX, toY, toZ);
        if (maxVisibleDistance < dist) continue;
        jsPos.push(fromX, fromY, fromZ, toX, toY, toZ);
        
        if (isTaskView && nodeColors) {
            const fromNodeId = i;
            const colorOffset = fromNodeId * 4;
            const r = nodeColors[colorOffset] / 255;
            const g = nodeColors[colorOffset + 1] / 255;
            const b = nodeColors[colorOffset + 2] / 255;
            jsColors.push(r, g, b, r, g, b); // 使用源节点的颜色
        } else {
            jsColors.push(fromX / r + 0.5, fromY / r + 0.5, fromZ / r + 0.5, toX / r + 0.5, toY / r + 0.5, toZ / r + 0.5);
        }
      }
    }

    var positions = new Float32Array(jsPos);
    var colors = new Float32Array(jsColors);

    var geometry = new THREE.BufferGeometry();
    var material = new THREE.LineBasicMaterial({
      vertexColors: THREE.VertexColors,
      blending: THREE.AdditiveBlending,
      opacity:0.5,
      transparent: true
    });

    geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3));

    geometry.computeBoundingSphere();
    if (linkMesh) {
      scene.remove(linkMesh);
    }

    linkMesh = new THREE.Line(geometry, material, THREE.LinePieces);
    if (linksVisible) {
        scene.add(linkMesh);
    }
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