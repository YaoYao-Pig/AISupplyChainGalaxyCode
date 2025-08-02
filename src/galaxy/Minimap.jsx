// src/galaxy/Minimap.jsx

import React from 'react';
import minimapStore from './store/minimapStore.js';

const maco = require('maco');

const Minimap = maco((x) => {
    const LABEL_VISIBILITY_THRESHOLD = 1500; 

    x.state = {
        camera: null,
        nodes: [],
        viewRadius: 4000
    };

    x.componentDidMount = function() {
        minimapStore.on('changed', x.updateMinimapData);
    };

    x.componentWillUnmount = function() {
        minimapStore.off('changed', x.updateMinimapData);
    };

    x.updateMinimapData = function() {
        x.setState(minimapStore.getData());
    };

    x.handleWheel = function(e) {
        e.preventDefault(); 
        minimapStore.zoom(e.deltaY * 5); 
    };

    x.render = function() {
        const { camera, nodes, viewRadius } = x.state;
        if (!camera) {
            return <div className="minimap-container"></div>;
        }

        const width = 200;
        const height = 200;
        const viewBox = `${-width / 2} ${-height / 2} ${width} ${height}`;
        const cameraPath = "M 0,-8 L 6,8 L 0,5 L -6,8 Z";
        const showLabels = viewRadius < LABEL_VISIBILITY_THRESHOLD;

        return (
            <div className="minimap-container" onWheel={x.handleWheel}>
                <svg width={width} height={height} viewBox={viewBox}>
                    {nodes.map(node => (
                        <g key={node.id}>
                            <circle
                                cx={node.x}
                                cy={node.y}
                                r={node.isCenter ? 3 : 1.5}
                                fill={node.isCenter ? "#FF0000" : "#FFFFFF"}
                                opacity="0.7"
                            />
                            {showLabels && (
                                <text
                                    x={node.x + 4}
                                    y={node.y + 2} // 微调y轴，让文字更居中
                                    fill="#FFFFFF"
                                    // --- 核心修改：增大字号 ---
                                    fontSize="12" // 从 6 增加到 8
                                    style={{ pointerEvents: 'none' }}
                                >
                                    {node.license}
                                </text>
                            )}
                        </g>
                    ))}
                    <g transform={`rotate(${camera.angle})`}>
                        <path d={cameraPath} fill="#00FF00" stroke="white" strokeWidth="0.5"/>
                    </g>
                </svg>
            </div>
        );
    };
}, React);

export default Minimap;