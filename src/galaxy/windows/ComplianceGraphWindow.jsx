// src/galaxy/windows/ComplianceGraphWindow.jsx

import React from 'react';
import ReactDOM from 'react-dom';
import appEvents from '../service/appEvents.js';

module.exports = require('maco')((x) => {
    let sigmaInstance = null;
    let tooltip = null; 

    const updateTooltip = (newTooltip) => {
        tooltip = newTooltip;
        x.forceUpdate();
    };

    function createSigmaGraph(graphData) {
        const sGraph = { nodes: [], edges: [] };

        graphData.nodes.forEach(node => {
            sGraph.nodes.push({
                id: node.id,
                label: node.label,
                x: Math.random(),
                y: Math.random(),
                size: 10,
                color: node.color || '#3498db'
            });
        });

        graphData.edges.forEach((edge, i) => {
            sGraph.edges.push({
                id: edge.id || `e${i}`,
                source: edge.source,
                target: edge.target,
                color: '#ccc',
                size: 1,
                type: edge.type || 'curve',
                fromLicense: edge.fromLicense,
                toLicense: edge.toLicense,
                isValue: edge.isValue
            });
        });

        return sGraph;
    }

    x.componentDidMount = function() {
        const sigmaConstructor = window.sigma;
        if (!sigmaConstructor) {
            console.error('Sigma.js is not available on the window object.');
            return;
        }

        const container = ReactDOM.findDOMNode(x.refs.sigmaContainer);
        const graphData = createSigmaGraph(x.props.viewModel.graph);

        try {
            sigmaInstance = new sigmaConstructor({
                graph: graphData,
                renderer: { container: container, type: 'canvas' },
                settings: {
                    enableEdgeHovering: true,
                    edgeHoverPrecision: 5,
                    defaultNodeColor: '#ec5148',
                    edgeColor: 'default',
                    defaultEdgeColor: '#ccc',
                    labelThreshold: 8,
                    minEdgeSize: 0.5,
                    maxEdgeSize: 5
                }
            });

            const handleOverEdge = (e) => {
                const edge = e.data.edge;
                const captor = e.data.captor;
                if (edge.fromLicense === undefined || edge.toLicense === undefined) return;

                updateTooltip({
                    from: edge.fromLicense,
                    to: edge.toLicense,
                    isCompatible: edge.isValue,
                    x: captor.clientX,
                    y: captor.clientY
                });
            };

            const handleOutEdge = (e) => {
                updateTooltip(null);
            };

            sigmaInstance.bind('overEdge', handleOverEdge);
            sigmaInstance.bind('outEdge', handleOutEdge);

            if (typeof sigmaInstance.startForceAtlas2 === 'function') {
                sigmaInstance.startForceAtlas2({
                    worker: true,
                    barnesHutOptimize: true,
                    strongGravityMode: true,
                    gravity: 0.05,
                    scalingRatio: 10,
                    edgeWeightInfluence: 1,
                    linLogMode: true
                });
                setTimeout(() => {
                    if (sigmaInstance && typeof sigmaInstance.stopForceAtlas2 === 'function') {
                        sigmaInstance.stopForceAtlas2();
                    }
                }, 5000);
            } else {
                console.warn('ForceAtlas2 plugin method not found on sigma instance. Layout will not be applied.');
                sigmaInstance.refresh();
            }

        } catch (e) {
            console.error("Sigma initialization failed:", e);
        }
    };

    x.componentWillUnmount = function() {
        if (sigmaInstance) {
            sigmaInstance.unbind('overEdge');
            sigmaInstance.unbind('outEdge');
            if (typeof sigmaInstance.stopForceAtlas2 === 'function') sigmaInstance.stopForceAtlas2();
            sigmaInstance.kill();
        }
        sigmaInstance = null;
    };

    x.render = function() {
        // --- 核心修改：只返回渲染图形所需的内容 ---
        const tooltipStyle = tooltip ? {
            position: 'fixed',
            left: tooltip.x + 10,
            top: tooltip.y + 10,
            padding: '5px 10px',
            background: 'rgba(0, 0, 0, 0.85)',
            color: 'white',
            border: '1px solid #555',
            borderRadius: '4px',
            fontSize: '13px',
            fontFamily: "'Roboto', 'PT Sans', sans-serif",
            pointerEvents: 'none',
            zIndex: 999,
            transition: 'opacity 0.2s'
        } : { display: 'none' };
        
        // 返回一个根<div>，其中包含图形容器和tooltip
        return (
            <div>
                <div ref="sigmaContainer" className="graph-content" style={{ width: "100%", height: "480px" }}></div>
                {tooltip && (
                    <div style={tooltipStyle}>
                        <div><strong>From:</strong> {tooltip.from}</div>
                        <div><strong>To:</strong> {tooltip.to}</div>
                        <hr style={{margin: '4px 0', borderColor: 'rgba(255,255,255,0.2)'}}/>
                        <div><strong>Compatible:</strong> {tooltip.isCompatible ? '✅ Yes' : '❌ No'}</div>
                    </div>
                )}
            </div>
        );
    }
}, React);