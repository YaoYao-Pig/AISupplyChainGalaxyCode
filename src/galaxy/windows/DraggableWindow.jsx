// src/galaxy/windows/DraggableWindow.jsx

import React from 'react';
import { findDOMNode } from 'react-dom';
import appEvents from '../service/appEvents.js';
import i18n from '../utils/i18n.js';

module.exports = require('maco')((x) => {
    x.state = {
        isDragging: false,
        position: null,
        relative: null
    };

    const onMouseDown = (e) => {
        if (e.button !== 0) return;

        const domNode = findDOMNode(x);
        const rect = domNode.getBoundingClientRect();

        x.setState({
            isDragging: true,
            position: {
                top: rect.top,
                left: rect.left
            },
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
        const viewModel = x.props.viewModel;
        appEvents.hideNodeListWindow.fire(viewModel.windowId || viewModel.id);
    };

    x.componentDidMount = function() {
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        i18n.onChange(forceRender);
    };

    x.componentWillUnmount = function() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        i18n.offChange(forceRender);
    };

    function forceRender() {
        x.forceUpdate();
    }

    x.render = function() {
        const viewModel = x.props.viewModel;
        const children = x.props.children;
        const position = x.state.position;
        const windowClassName = viewModel.class || viewModel.className || '';

        let style = {};
        if (position) {
            style = {
                top: position.top + 'px',
                left: position.left + 'px',
                transform: 'none'
            };
        }

        return (
            <div className={'window-container window-surface ' + windowClassName} style={style}>
                <div className='window-header' onMouseDown={onMouseDown}>
                    <h4>{viewModel.title}</h4>
                    <button onClick={handleClose} className='window-close-btn' title={i18n.t('common.close')}>&times;</button>
                </div>
                <div className='window-body'>
                    {children}
                </div>
            </div>
        );
    };
}, React);
