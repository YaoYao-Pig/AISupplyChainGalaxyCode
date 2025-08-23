// src/galaxy/LeftSidebarView.jsx

import React from 'react';
import appEvents from './service/appEvents.js';

module.exports = require('maco')((x) => {
    // 使用组件的 state 来控制侧边栏的显示和隐藏
    x.state = {
        isOpen: false
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

    x.render = function() {
        const { isOpen } = x.state;
        // 根据 isOpen 状态切换 CSS 类名，以觸发动画
        const containerClass = isOpen ? "left-sidebar-container open" : "left-sidebar-container";

        return (
            <div 
                className={containerClass} 
                onMouseEnter={handleMouseEnter} 
                onMouseLeave={handleMouseLeave}
            >
                <div className="left-sidebar-content">
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
                </div>
            </div>
        );
    };
}, React);