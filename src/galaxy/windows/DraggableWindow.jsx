// src/galaxy/windows/DraggableWindow.jsx

import React from 'react';
import { findDOMNode } from 'react-dom';
import appEvents from '../service/appEvents.js';

module.exports = require('maco')((x) => {
    x.state = {
        isDragging: false,
        // position: null 表示位置由 CSS 控制
        position: null, 
        relative: null
    };

    const onMouseDown = (e) => {
        if (e.button !== 0) return;
        
        const domNode = findDOMNode(x);
        // 获取当前由 CSS 定位的窗口的实际屏幕位置
        const rect = domNode.getBoundingClientRect();

        x.setState({
            isDragging: true,
            // 将 CSS 的定位结果 "固化" 到 state 中
            position: {
                top: rect.top,
                left: rect.left
            },
            // 计算鼠标在标题栏内的相对位置，以确保拖拽平滑
            relative: {
                top: e.pageY - rect.top,
                left: e.pageX - rect.left
            }
        });
        e.stopPropagation();
        e.preventDefault();
    };

    const onMouseUp = (e) => {
        x.setState({ isDragging: false });
        e.stopPropagation();
        e.preventDefault();
    };

    const onMouseMove = (e) => {
        if (!x.state.isDragging) return;

        x.setState({
            position: {
                top: e.pageY - x.state.relative.top,
                left: e.pageX - x.state.relative.left
            }
        });
        e.stopPropagation();
        e.preventDefault();
    };

    const handleClose = () => {
        const { viewModel } = x.props;
        appEvents.hideNodeListWindow.fire(viewModel.id);
    };

    x.componentDidMount = function() {
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    x.componentWillUnmount = function() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    };

    x.render = function() {
        const { viewModel, children } = x.props;
        const { position } = x.state;

        let style = {}; // 默认无内联样式

        // 仅当 state.position 有值时（即拖拽开始后），才用 JS 控制位置
        if (position) {
            style = {
                top: position.top + 'px',
                left: position.left + 'px',
                // 关键：禁用 CSS 的 transform，将定位权完全交给 top/left
                transform: 'none' 
            };
        }

        return (
            <div className={'window-container ' + (viewModel.class || '')} style={style}>
                <div className="window-header" onMouseDown={onMouseDown}>
                    <h4>{viewModel.title}</h4>
                    <button onClick={handleClose} className="window-close-btn" title="Close">&times;</button>
                </div>
                {children}
            </div>
        );
    };
}, React);