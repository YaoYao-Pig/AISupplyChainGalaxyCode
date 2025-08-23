// src/galaxy/windows/DraggableWindow.jsx

import React from 'react';
import appEvents from '../service/appEvents.js';

module.exports = require('maco')((x) => {
    // --- 核心修正：将初始位置的计算逻辑移到这里 ---
    // 这样每次创建新窗口实例时，都会重新计算位置
    const windowWidth = 450; // 窗口的大致宽度
    const initialTop = 60 + Math.random() * 150;
    
    // 计算一个安全的左侧位置，确保窗口不会超出屏幕边界
    let initialLeft = (window.innerWidth / 2) - (windowWidth / 2) + (Math.random() * 200 - 100);
    if (initialLeft < 0) initialLeft = 10; // 防止窗口移出左侧屏幕
    if (initialLeft + windowWidth > window.innerWidth) initialLeft = window.innerWidth - windowWidth - 10; // 防止窗口移出右侧屏幕

    x.state = {
        isDragging: false,
        position: { top: initialTop, left: initialLeft },
        relative: null 
    };

    const onMouseDown = (e) => {
        if (e.button !== 0) return;
        var pos = { top: e.pageY, left: e.pageX };
        x.setState({
            isDragging: true,
            relative: {
                top: pos.top - x.state.position.top,
                left: pos.left - x.state.position.left
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

        const style = {
            position: 'absolute',
            top: position.top + 'px',
            left: position.left + 'px',
            // 移除 transform, 因为它会干扰拖拽的位置计算
        };

        // 从 viewModel 中移除 transform 样式
        const containerClass = (viewModel.class || '').replace('license-report-window', '');

        return (
            <div className={'window-container ' + containerClass} style={style}>
                <div className="window-header" onMouseDown={onMouseDown}>
                    <h4>{viewModel.title}</h4>
                    <button onClick={handleClose} className="window-close-btn" title="Close">&times;</button>
                </div>
                {children}
            </div>
        );
    };
}, React);