// src/galaxy/SidebarView.jsx

import React from 'react';
import appEvents from './service/appEvents.js';

const maco = require('maco');

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
                {
                    chain.reduce((acc, item, index) => {
                        const isNewBranch = index > 0 && item.level === 1;
                        if (isNewBranch) {
                            acc.push(<li key={`sep-${index}`} className="branch-separator"></li>);
                        }

                        let itemClass = "chain-item";
                        if (item.level === 0) itemClass += " current";
                        if (item.isRoot) itemClass += " root";

                        acc.push(
                            <li key={`item-${index}`} className={itemClass}>
                                {item.level > 0 ? 
                                    <span className="level-indicator" style={{ paddingLeft: `${(item.level - 1) * 15}px` }}>L{item.level}</span> :
                                    <span className="level-indicator self">Current</span>
                                }
                                <span className="model-name">{item.model}</span>
                                <div className="license-and-status">
                                    {item.level > 0 && (
                                        <span className={`status-icon ${item.isCompatible ? 'compatible' : 'incompatible'}`}>
                                            {item.isCompatible ? '✅' : '❌'}
                                        </span>
                                    )}
                                    <span className="license-badge">{item.license}</span>
                                </div>
                            </li>
                        );
                        return acc;
                    }, [])
                }
            </ul>
        </div>
    );
}
function renderAnalysisSection() {
    const handleShowReport = () => {
        appEvents.showLicenseReport.fire();
    };

    const handleGlobalStats = () => {
        appEvents.showGlobalLicenseStats.fire();
    };

    const handleGlobalReport = () => {
        appEvents.showGlobalLicenseReport.fire();
    };

    const handleGlobalComplianceStats = () => {
        appEvents.showGlobalComplianceStats.fire();
    };

    return (
        <div className="sidebar-list-section">
            <h4>Analysis</h4>
            <button onClick={handleShowReport} className="analysis-btn">Show Local Compliance Graph</button>
            <button onClick={handleGlobalStats} className="analysis-btn" style={{marginTop: '10px'}}>Show Global License Stats</button>
            <button onClick={handleGlobalReport} className="analysis-btn" style={{marginTop: '10px'}}>Show Global Compliance Report</button>
            <button onClick={handleGlobalComplianceStats} className="analysis-btn" style={{marginTop: '10px'}}>Show Global Compliance Stats</button>
        </div>
    );
}


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

        const handleHighlightChain = () => {
            if (selectedNode && selectedNode.inheritanceChain) {
                appEvents.highlightChain.fire(selectedNode.inheritanceChain);
            }
        };

        const handleNextClick = () => {
            appEvents.focusNextInChain.fire();
        };

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
                    
                    {renderInheritanceChain(selectedNode.inheritanceChain, handleHighlightChain, handleNextClick)}
                    
                    {renderInfoList("Region", selectedNode.regions)}
                    {renderInfoList("ArXiv", selectedNode.arxivs)}
                    
                    {renderTagList(selectedNode.tags, activeTag)}
                    <hr />
                    
                    {renderNodeList("Incoming Connections", incoming)}
                    {renderNodeList("Outgoing Connections", outgoing)}
                    <hr />
                    {renderAnalysisSection()}
                </div>
            </div>
        );
    };
}, React);