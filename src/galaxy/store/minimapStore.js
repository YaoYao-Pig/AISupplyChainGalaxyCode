// src/galaxy/store/minimapStore.js

import eventify from 'ngraph.events';
import appEvents from '../service/appEvents.js';
import scene from './sceneStore.js';
import nodeDetailsStore from '../nodeDetails/nodeDetailsStore.js';

function createMinimapStore() {
    const store = {};
    eventify(store);

    let lastCamera = null;
    let minimapData = {
        camera: null,
        nodes: [],
        viewRadius: 4000 
    };
    // --- 核心修改：增加抽样数量 ---
    const sampleSize = 400; // 从 200 增加到 400
    const scaleFactor = 100;
    const MAX_ZOOM_IN_RADIUS = 500; 
    const MAX_ZOOM_OUT_RADIUS = 10000; 

    appEvents.cameraMoved.on(camera => {
      lastCamera = camera;
      updateCameraData();
    });

    function updateCameraData() {
        if (!lastCamera) return;

        const position = lastCamera.position;
        const direction = lastCamera.getWorldDirection(new window.THREE.Vector3());
        
        minimapData.camera = {
            x: position.x,
            y: position.z, 
            angle: Math.atan2(direction.x, direction.z) * (180 / Math.PI)
        };

        const graph = scene.getGraph();
        if (graph && graph.getRawData) {
            const positions = graph.getRawData().positions;
            const nodes = [];
            const selectedNode = nodeDetailsStore.getSelectedNode();
            const selectedNodeId = selectedNode ? selectedNode.id : -1;
            const step = Math.max(1, Math.floor((positions.length / 3) / sampleSize));

            for (let i = 0; i < positions.length / 3; i += step) {
                const x = positions[i * 3];
                const y = positions[i * 3 + 2];
                const dx = x - position.x;
                const dz = y - position.z;

                if (dx * dx + dz * dz < minimapData.viewRadius * minimapData.viewRadius) {
                    const nodeData = graph.getNodeData(i);
                    const license = (nodeData && nodeData.license) ? nodeData.license : 'N/A';

                    nodes.push({
                        id: i,
                        x: dx / (minimapData.viewRadius / scaleFactor),
                        y: dz / (minimapData.viewRadius / scaleFactor),
                        isCenter: i === selectedNodeId,
                        license: license
                    });
                }
            }
            minimapData.nodes = nodes;
        }

        store.fire('changed');
    }

    store.zoom = function(delta) {
        minimapData.viewRadius += delta;
        if (minimapData.viewRadius < MAX_ZOOM_IN_RADIUS) minimapData.viewRadius = MAX_ZOOM_IN_RADIUS;
        if (minimapData.viewRadius > MAX_ZOOM_OUT_RADIUS) minimapData.viewRadius = MAX_ZOOM_OUT_RADIUS;
        
        updateCameraData();
    };

    store.getData = function() {
        return minimapData;
    };

    return store;
}

export default createMinimapStore();