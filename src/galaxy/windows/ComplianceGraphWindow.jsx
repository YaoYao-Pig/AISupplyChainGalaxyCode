import React from 'react';

import ReactDOM from 'react-dom';

import appEvents from '../service/appEvents.js';

module.exports = require('maco')((x) => {

    let sigmaInstance = null;



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

    // 正确处理边数据
    graphData.edges.forEach((edge, i) => {
        sGraph.edges.push({
            id: edge.id || `e${i}`,
            source: edge.source, // 修复: 从 edge.from 改为 edge.source
            target: edge.target, // 修复: 从 edge.to 改为 edge.target
            color: '#ccc',       // 统一设置边的颜色
            size: 1,
            type: edge.type || 'curve' // 使用我们动态传入的类型（'arrow'）
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

                    defaultNodeColor: '#ec5148',

                    edgeColor: 'default',

                    defaultEdgeColor: '#ccc',

                    labelThreshold: 8,

                    minEdgeSize: 0.5,

                    maxEdgeSize: 5

                }

            });



            // --- 核心修改：恢复到正确的函数调用方式，并传入优化后的参数 ---

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

            if (typeof sigmaInstance.stopForceAtlas2 === 'function') sigmaInstance.stopForceAtlas2();

            sigmaInstance.kill();

        }

        sigmaInstance = null;

    };



    x.render = function() {

        const { viewModel } = x.props;

        return (

            <div className={'window-container ' + viewModel.class}>

                <div className="window-header">

                    <h4>{viewModel.title}</h4>

                    {/* --- 新增：关闭按钮 --- */}

                    <button onClick={handleClose} className="window-close-btn" title="Close">&times;</button>

                </div>

                <div ref="sigmaContainer" className="graph-content" style={{ height: "480px" }}></div>

            </div>

        );

    }

}, React);