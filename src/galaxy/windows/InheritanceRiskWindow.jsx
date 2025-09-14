// src/galaxy/windows/InheritanceRiskWindow.jsx
import React from 'react';
import { findDOMNode } from 'react-dom';
import appEvents from '../service/appEvents.js';

const maco = require('maco');

function scaleLinear(value, domain, range) {
    const [d0, d1] = domain;
    const [r0, r1] = range;
    if (d1 === d0) return r0;
    const ratio = (value - d0) / (d1 - d0);
    return r0 + ratio * (r1 - r0);
}

function generateTicks(domain, count = 5) {
    const [min, max] = domain;
    const ticks = [];
    const span = max - min;
    if (span <= 0) return [Math.round(min)];
    for (let i = 0; i <= count; i++) {
        ticks.push(min + (span * i) / count);
    }
    return [...new Set(ticks.map(t => Math.round(t)))];
}

const Tooltip = maco(function(x) {
    x.render = function() {
        const { node, x: mouseX, y: mouseY } = x.props;
        if (!node) return null;
        const style = {
            position: 'fixed',
            left: mouseX + 15,
            top: mouseY + 15,
            background: 'rgba(0, 0, 0, 0.85)',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '4px',
            pointerEvents: 'none',
            fontSize: '13px',
            fontFamily: "'Roboto', 'PT Sans', sans-serif",
            zIndex: 1001,
            border: '1px solid #555'
        };
        return (
            <div style={style}>
                <div><strong>Model:</strong> {node.name}</div>
                <div><strong>Depth:</strong> {node.depth}</div>
                <div><strong>Conflict:</strong> {node.hasConflict ? 'Yes' : 'No'}</div>
            </div>
        );
    };
}, React);

module.exports = require('maco')((x) => {
    let svgNode = null;
    x.fullDomain = null;

    x.state = {
        hoveredNode: null, mouseX: 0, mouseY: 0,
        points: [], xDomain: null, isDragging: false, panStart: null
    };

    x.componentDidMount = function() {
        const { viewModel } = x.props;
        let data = viewModel.data;
        if (!data || data.length === 0) return;

        const MAX_POINTS_TO_RENDER = 2000;
        if (data.length > MAX_POINTS_TO_RENDER) {
            const sampledData = [], usedIndices = new Set(), dataLength = data.length;
            const pointsToRender = Math.min(MAX_POINTS_TO_RENDER, dataLength);
            while (sampledData.length < pointsToRender) {
                const randomIndex = Math.floor(Math.random() * dataLength);
                if (!usedIndices.has(randomIndex)) { usedIndices.add(randomIndex); sampledData.push(data[randomIndex]); }
            }
            data = sampledData;
        }

        const pointsWithJitter = data.map(d => ({ ...d, xJitter: (Math.random() - 0.5) * 4, yJitterRatio: (Math.random() - 0.5) * 0.2 }));
        const maxDepth = Math.max(...data.map(d => d.depth), 0);
        x.fullDomain = [-0.5, maxDepth + 0.5];
        x.setState({ points: pointsWithJitter, xDomain: x.fullDomain });
    };

    x.componentDidUpdate = function(prevProps, prevState) {
        if (prevState.points.length === 0 && x.state.points.length > 0 && !svgNode) {
            svgNode = findDOMNode(x.refs.svgContainer);
            if (svgNode) {
                svgNode.addEventListener('wheel', handleWheelZoom, { passive: false });
                svgNode.addEventListener('mousedown', handlePanStart);
                document.addEventListener('mousemove', handlePanMove);
                document.addEventListener('mouseup', handlePanEnd);
                document.addEventListener('mouseleave', handlePanEnd);
            }
        }
    };
    
    x.componentWillUnmount = function() {
        if (svgNode) {
            svgNode.removeEventListener('wheel', handleWheelZoom);
            svgNode.removeEventListener('mousedown', handlePanStart);
        }
        document.removeEventListener('mousemove', handlePanMove);
        document.removeEventListener('mouseup', handlePanEnd);
        document.removeEventListener('mouseleave', handlePanEnd);
    };

    const handleWheelZoom = (e) => {
        e.preventDefault();
        const { xDomain } = x.state;
        if (!xDomain) return;
        const zoomFactor = e.deltaY < 0 ? 1.4 : 1 / 1.4;
        const [min, max] = xDomain;
        const svgRect = e.currentTarget.getBoundingClientRect();
        const mouseX = e.clientX - svgRect.left;
        const mouseXInDataCoords = scaleLinear(mouseX, [50, 580 - 20], [min, max]);
        let newMin = mouseXInDataCoords - (mouseXInDataCoords - min) / zoomFactor;
        let newMax = mouseXInDataCoords + (max - mouseXInDataCoords) / zoomFactor;
        if (newMin < x.fullDomain[0]) newMin = x.fullDomain[0];
        if (newMax > x.fullDomain[1]) newMax = x.fullDomain[1];
        if (newMax - newMin < 1) return;
        x.setState({ xDomain: [newMin, newMax] });
    };

    const handlePanStart = (e) => {
        e.preventDefault();
        x.setState({ isDragging: true, panStart: { x: e.clientX, domain: x.state.xDomain } });
    };

    const handlePanMove = (e) => {
        if (!x.state.isDragging) return;
        e.preventDefault();
        const { panStart } = x.state;
        const pixelDelta = e.clientX - panStart.x;
        const [startMin, startMax] = panStart.domain;
        const domainWidth = startMax - startMin;
        const pixelWidth = 580 - 70;
        const domainDelta = (pixelDelta / pixelWidth) * domainWidth;
        let newMin = startMin - domainDelta;
        let newMax = startMax - domainDelta;
        if (newMin < x.fullDomain[0]) {
            newMin = x.fullDomain[0];
            newMax = newMin + domainWidth;
        }
        if (newMax > x.fullDomain[1]) {
            newMax = x.fullDomain[1];
            newMin = newMax - domainWidth;
        }
        x.setState({ xDomain: [newMin, newMax] });
    };

    const handlePanEnd = () => { if (x.state.isDragging) { x.setState({ isDragging: false, panStart: null }); } };
    const handlePointClick = (nodeId) => { appEvents.focusOnNode.fire(nodeId); appEvents.hideNodeListWindow.fire('inheritance-risk'); };
    const handleMouseOver = (node, e) => { x.setState({ hoveredNode: node, mouseX: e.clientX, mouseY: e.clientY }); };
    const handleMouseOut = () => { x.setState({ hoveredNode: null }); };

    x.render = function() {
        const { points, hoveredNode, mouseX, mouseY, xDomain, isDragging } = x.state;
        if (!xDomain) { return <div className="loading-message">Preparing chart...</div>; }

        const width = 580, height = 420, margin = { top: 20, right: 20, bottom: 40, left: 50 };
        const getX = (value) => scaleLinear(value, xDomain, [margin.left, width - margin.right]);
        const svgStyle = { cursor: isDragging ? 'grabbing' : 'grab' };
        const xTicks = generateTicks(xDomain, 5);

        return (
            <div className="risk-chart-wrapper">
                <div className="risk-chart-container">
                    <svg ref="svgContainer" width={width} height={height} style={svgStyle}>
                        <defs>
                            <clipPath id="plotAreaClip">
                                <rect x={margin.left} y={margin.top} width={width - margin.left - margin.right} height={height - margin.top - margin.bottom} />
                            </clipPath>
                        </defs>
                        <g className="axes">
                            <line x1={margin.left} y1={margin.top} x2={margin.left} y2={height - margin.bottom} stroke="#555" />
                            <text x={margin.left - 15} y={margin.top + (height - margin.top - margin.bottom) * 0.25} textAnchor="end" fill="#e74c3c" fontSize="12">Risk</text>
                            <text x={margin.left - 15} y={margin.top + (height - margin.top - margin.bottom) * 0.75} textAnchor="end" fill="#3498db" fontSize="12">No Risk</text>
                            <line x1={margin.left} y1={height - margin.bottom} x2={width - margin.right} y2={height - margin.bottom} stroke="#555" />
                            <text x={width / 2} y={height + 5} textAnchor="middle" fill="#ccc" fontSize="12">Inheritance Depth</text>
                            {xTicks.map((tick, i) => (
                                <g key={i} transform={`translate(${getX(tick)}, ${height - margin.bottom})`}>
                                    <line y2="5" stroke="#888"></line>
                                    <text y="20" textAnchor="middle" fill="#888" fontSize="10">{tick}</text>
                                </g>
                            ))}
                        </g>
                        <g clipPath="url(#plotAreaClip)">
                            {points.map(d => {
                                const cx = getX(d.depth) + d.xJitter;
                                const cy = d.hasConflict
                                    ? margin.top + (height - margin.top - margin.bottom) * (0.25 + d.yJitterRatio)
                                    : margin.top + (height - margin.top - margin.bottom) * (0.75 + d.yJitterRatio);
                                return (
                                    <circle
                                        key={d.nodeId} cx={cx} cy={cy} r={3.5}
                                        fill={d.hasConflict ? '#e74c3c' : '#3498db'}
                                        fillOpacity={0.7} style={{ cursor: 'pointer' }}
                                        onClick={() => handlePointClick(d.nodeId)}
                                        onMouseOver={(e) => handleMouseOver(d, e)}
                                        onMouseOut={handleMouseOut}
                                    />
                                );
                            })}
                        </g>
                    </svg>
                    <Tooltip node={hoveredNode} x={mouseX} y={mouseY} />
                </div>
                <div className="chart-explanation">
                    <h4>图表解读</h4>
                    <ul>
                        <li><strong>横轴 (X轴):</strong> 模型继承深度。深度越高，说明其衍生的层级越多。</li>
                        <li><strong>纵轴 (Y轴):</strong> 上半部分 (<span style={{color: '#e74c3c'}}>红色</span>) 代表存在许可证冲突风险的模型，下半部分 (<span style={{color: '#3498db'}}>蓝色</span>) 代表无风险的模型。</li>
                        <li><strong>交互:</strong>
                            <ul>
                                <li>使用鼠标滚轮进行缩放。</li>
                                <li>按住并拖拽鼠标来平移。</li>
                                <li>点击数据点可在3D视图中定位。</li>
                            </ul>
                        </li>
                    </ul>
                </div>
            </div>
        );
    }
}, React);