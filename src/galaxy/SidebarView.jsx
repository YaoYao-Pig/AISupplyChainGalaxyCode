// src/galaxy/SidebarView.jsx (最终修正版 - 修复 handleHighlightChain 引用错误)

import React from 'react';
import appEvents from './service/appEvents.js';

const maco = require('maco');

// --- 辅助渲染函数定义 ---

function renderMetaDataItem(label, value) {
    if (value === null || value === undefined || value === '') return null;
    return (
        <div key={label} className="meta-item">
            <span>{label}</span>
            <strong>{String(value)}</strong>
        </div>
    );
}

function renderInfoList(title, items) {
    if (!Array.isArray(items) || items.length === 0) return null;
    return (
        <div key={title} className="sidebar-list-section">
            <h4>{title}</h4>
            <div className="sidebar-list simple">
                <ul>
                    {items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
                </ul>
            </div>
        </div>
    );
}

function renderTagList(tags, activeTag) {
    const handleTagClick = (tag) => {
        if (typeof tag === 'string' && tag) {
            appEvents.searchByTag.fire(tag);
        }
    };
    const validTags = Array.isArray(tags) ? tags.filter(tag => typeof tag === 'string' && tag) : [];

    return (
        <div className="sidebar-list-section">
            <h4>Tags ({validTags.length})</h4>
            {validTags.length > 0 ? (
                <div className="tag-list">
                    {validTags.map((tag, index) => {
                        const className = (tag === activeTag) ? "tag-item active" : "tag-item";
                        return (
                            <span key={`${tag}-${index}`} className={className} onClick={() => handleTagClick(tag)}>
                                {tag}
                            </span>
                        );
                    })}
                </div>
            ) : ( <p className="no-connections">None</p> )}
        </div>
    );
}

function renderNodeList(title, nodes) {
    const nodeList = Array.isArray(nodes) ? nodes : [];
    return (
        <div className="sidebar-list-section">
            <h4>{title} ({nodeList.length})</h4>
            <div className="sidebar-list">
                {nodeList.length > 0 ? (
                    <ul>
                        {nodeList.map(node => {
                            if (!node || node.id === undefined) return null;
                            const displayName = node.name || `Node #${node.id}`;
                            return (
                                <li key={node.id}>
                                    <a href="#" className="node-focus" id={node.id} title={`Focus on ${displayName}`}>
                                        {displayName}
                                    </a>
                                </li>
                            );
                        })}
                    </ul>
                ) : ( <p className="no-connections">None</p> )}
            </div>
        </div>
    );
}

// --- 核心修正: 在 renderInheritanceChain 中接收 onHighlightClick ---
function renderInheritanceChain(chain, onHighlightClick, onNextClick) {
    if (!Array.isArray(chain) || chain.length === 0) {
        return null;
    }
    return (
        <div className="sidebar-list-section">
            <div className="section-header">
                <h4>Inheritance Chain</h4>
                <div className="button-group">
                    <button onClick={onHighlightClick} className="highlight-btn" title="Highlight chain in 3D view">Highlight</button>
                    {chain.length > 1 && <button onClick={onNextClick} className="next-btn" title="Focus on next node in chain">Next</button>}
                </div>
            </div>
            <ul className="inheritance-list">
                {chain.map((item, index) => {
                    let itemClass = "chain-item";
                    if (item.level === 0) itemClass += " current";
                    if (item.isRoot) itemClass += " root";

                    return (
                        <li key={index} className={itemClass}>
                            {item.level > 0 ? 
                                <span className="level-indicator" style={{ paddingLeft: `${(item.level - 1) * 15}px` }}>L{item.level}</span> :
                                <span className="level-indicator self">Current</span>
                            }
                            <span className="model-name">{item.model}</span>
                            <span className="license-badge">{item.license}</span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

// --- 主侧边栏组件 ---
module.exports = require('maco')((x) => {
    const handleClose = () => {
        appEvents.selectNode.fire(undefined);
    };

    x.render = function () {
        const { data, isOpen, activeTag } = x.props;
        const containerClass = isOpen ? "sidebar-container open" : "sidebar-container";

        if (!data || !data.selectedNode) {
            return <div className={containerClass}></div>;
        }

        const { selectedNode, incoming, outgoing } = data;

        // --- 核心修正: 在这里定义 handleHighlightChain 和 handleNextClick ---
        const handleHighlightChain = () => {
            if (selectedNode && selectedNode.inheritanceChain) {
                appEvents.highlightChain.fire(selectedNode.inheritanceChain);
            }
        };

        const handleNextClick = () => {
            appEvents.focusNextInChain.fire();
        };
        // --- 修正结束 ---

        return (
            <div className={containerClass}>
                <div className="sidebar-header">
                    <h3 title={selectedNode.name}>{selectedNode.name}</h3>
                    <button onClick={handleClose} className="close-btn" title="Close">&times;</button>
                </div>
                <div className="sidebar-content">
                    <div className="sidebar-metadata detailed">
                        {renderMetaDataItem("Author", selectedNode.author)}
                        {renderMetaDataItem("Downloads", selectedNode.downloads)}
                        {renderMetaDataItem("Likes", selectedNode.likes)}
                        {renderMetaDataItem("License", selectedNode.license)}
                    </div>
                    <hr />
                    
                    {/* 调用时传入 handleHighlightChain 和 handleNextClick */}
                    {renderInheritanceChain(selectedNode.inheritanceChain, handleHighlightChain, handleNextClick)}
                    
                    {renderInfoList("Region", selectedNode.regions)}
                    {renderInfoList("ArXiv", selectedNode.arxivs)}
                    
                    {renderTagList(selectedNode.tags, activeTag)}
                    <hr />
                    
                    {renderNodeList("Incoming Connections", incoming)}
                    {renderNodeList("Outgoing Connections", outgoing)}
                </div>
            </div>
        );
    };
}, React);