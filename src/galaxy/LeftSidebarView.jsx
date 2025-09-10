// src/galaxy/LeftSidebarView.jsx

import React from 'react';
// --- 核心修正：修复 appEvents 和 complianceStore 的导入路径 ---
import appEvents from './service/appEvents.js';
import complianceStore from './store/licenseComplianceStore.js';

module.exports = require('maco')((x) => {
    x.state = {
        isOpen: false,
        conflictCount: 0
    };

    x.componentDidMount = function() {
        complianceStore.on('changed', updateConflictCount);
        updateConflictCount();
    };

    x.componentWillUnmount = function() {
        complianceStore.off('changed', updateConflictCount);
    };
    
    const updateConflictCount = () => {
        x.setState({
            conflictCount: complianceStore.getConflictList().length
        });
    };

    const handlePathfinder = () => {
        appEvents.showPathfindingWindow.fire(); // <--- 触发新事件
    };

    const handleMouseEnter = () => {
        x.setState({ isOpen: true });
    };

    const handleMouseLeave = () => {
        x.setState({ isOpen: false });
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

    const handleHighlightClick = () => {
        const conflictNodeIds = complianceStore.getConflictList().map(c => c.nodeId);
        appEvents.highlightLicenseConflicts.fire(conflictNodeIds);
    };

    x.render = function() {
        const { isOpen, conflictCount } = x.state;
        const containerClass = isOpen ? "left-sidebar-container open" : "left-sidebar-container";

        return (
            <div 
                className={containerClass} 
                onMouseEnter={handleMouseEnter} 
                onMouseLeave={handleMouseLeave}
            >
                <div className="left-sidebar-content">
                    <h4>Global Analysis</h4>
                    <button onClick={handlePathfinder} className="analysis-btn">
                        Connection Explorer
                    </button>
                    <h4>Global Analysis</h4>
                    <button onClick={handleGlobalStats} className="analysis-btn">
                        License Stats
                    </button>
                    <button onClick={handleGlobalReport} className="analysis-btn">
                        Compliance Report
                    </button>
                    <button onClick={handleGlobalComplianceStats} className="analysis-btn">
                        Compliance Stats
                    </button>
                    <button 
                        onClick={handleHighlightClick} 
                        className="analysis-btn highlight" 
                        disabled={conflictCount === 0}
                    >
                        Highlight Conflicts ({conflictCount})
                    </button>
                </div>
            </div>
        );
    };
}, React);