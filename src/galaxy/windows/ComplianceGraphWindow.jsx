import React from 'react';
import ReactDOM from 'react-dom';
import appEvents from '../service/appEvents.js';

module.exports = require('maco')((x) => {
    let sigmaInstance = null;
    let tooltip = null; // 用一个变量来存储 tooltip 的状态

    // 一个辅助函数，用来更新 tooltip 状态并强制组件重新渲染
    const updateTooltip = (newTooltip) => {
        tooltip = newTooltip;
        x.forceUpdate();
    };

    const handleClose = () => {
        // 复用现有的 hideNodeListWindow 事件，并传递当前窗口的唯一ID
        appEvents.hideNodeListWindow.fire('compliance-graph');
    };

    function createSigmaGraph(graphData) {
        const sGraph = { nodes: [], edges: [] };

        // 正确处理节点数据
        graphData.nodes.forEach(node => {
            sGraph.nodes.push({
                id: node.id,
                label: node.label,
                x: Math.random(),
                y: Math.random(),
                size: 10, // 给一个默认尺寸
                color: node.color || '#3498db' // 使用我们动态传入的颜色
            });
        });

        // 正确处理边数据，并附加额外信息
        graphData.edges.forEach((edge, i) => {
            sGraph.edges.push({
                id: edge.id || `e${i}`,
                source: edge.source,
                target: edge.target,
                color: '#ccc',
                size: 1,
                type: edge.type || 'curve',
                // 将我们准备好的额外数据也传递给 sigma 的边对象
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
                    // --- 新增: 启用边的悬停事件 ---
                    enableEdgeHovering: true,
                    edgeHoverPrecision: 5, // 悬停的感应范围
                    // --- 保留其他设置 ---
                    defaultNodeColor: '#ec5148',
                    edgeColor: 'default',
                    defaultEdgeColor: '#ccc',
                    labelThreshold: 8,
                    minEdgeSize: 0.5,
                    maxEdgeSize: 5
                }
            });

            // --- 新增：绑定事件处理器 ---
            const handleOverEdge = (e) => {
                const edge = e.data.edge;
                const captor = e.data.captor;
                if (edge.fromLicense === undefined || edge.toLicense === undefined) return;

                updateTooltip({
                    from: edge.fromLicense,
                    to: edge.toLicense,
                    isCompatible: edge.isValue,
                    x: captor.clientX, // 使用事件的屏幕坐标
                    y: captor.clientY
                });
            };

            const handleOutEdge = (e) => {
                updateTooltip(null); // 鼠标移开时清除 tooltip
            };

            sigmaInstance.bind('overEdge', handleOverEdge);
            sigmaInstance.bind('outEdge', handleOutEdge);

            // --- 保留布局算法相关的代码 ---
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
                }, 5000); // 运行5秒，让布局更稳定
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
            // --- 新增：解绑事件 ---
            sigmaInstance.unbind('overEdge');
            sigmaInstance.unbind('outEdge');
            if (typeof sigmaInstance.stopForceAtlas2 === 'function') sigmaInstance.stopForceAtlas2();
            sigmaInstance.kill();
        }
        sigmaInstance = null;
    };

    x.render = function() {
        const { viewModel } = x.props;

        // 动态计算 tooltip 的样式
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

        return (
            // 用一个 div 包裹，因为不能返回多个顶级元素
            <div>
                <div className={'window-container ' + viewModel.class}>
                    <div className="window-header">
                        <h4>{viewModel.title}</h4>
                        <button onClick={handleClose} className="window-close-btn" title="Close">&times;</button>
                    </div>
                    <div ref="sigmaContainer" className="graph-content" style={{ height: "480px" }}></div>
                </div>

                {/* --- 新增：渲染 tooltip --- */}
                {tooltip && (
                    <div style={tooltipStyle}>
                        <div><strong style={{color: '#aaa'}}>From:</strong> {tooltip.from}</div>
                        <div><strong style={{color: '#aaa'}}>To:</strong> {tooltip.to}</div>
                        <div><strong style={{color: '#aaa'}}>Compatible:</strong> {tooltip.isCompatible ? '✅' : '❌'}</div>
                    </div>
                )}
            </div>
        );
    }
}, React);
