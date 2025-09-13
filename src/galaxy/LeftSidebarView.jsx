// src/galaxy/LeftSidebarView.jsx

import React from 'react';
import appEvents from './service/appEvents.js';
import complianceStore from './store/licenseComplianceStore.js';
// licenseSimulatorStore 的导入路径需要根据您的项目结构确认，这里假设它在 store 目录下
// 如果您未创建该文件，请告诉我，我会提供它的代码
import licenseSimulatorStore from './store/licenseSimulatorStore.js'; 

module.exports = require('maco')((x) => {
    x.state = {
        isOpen: false,
        conflictCount: 0,
        selectedLicense: 'none' // 初始化 state
    };

    x.componentDidMount = function() {
        complianceStore.on('changed', updateConflictCount);
        updateConflictCount();
        appEvents.simulationStatusUpdate.on(updateSimulationStatus);
    };

    x.componentWillUnmount = function() {
        complianceStore.off('changed', updateConflictCount);
        appEvents.simulationStatusUpdate.off(updateSimulationStatus);
    };
    
    const updateSimulationStatus = (status) => {
        x.setState({
            isSimulating: status.running,
            simulationProgress: status.progress || 0
        });
    };

    const updateConflictCount = () => {
        x.setState({
            conflictCount: complianceStore.getConflictList().length
        });
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

    const handleSimulate = () => {
        const { selectedLicense } = x.state;
        console.log(`[LeftSidebarView] Simulate button clicked. Selected license: ${selectedLicense}`);
        if (selectedLicense === 'none') {
            appEvents.runLicenseSimulation.fire(null);
        } else {
            appEvents.runLicenseSimulation.fire(selectedLicense);
        }
    };
    
    const handleLicenseChange = (e) => {
        x.setState({ selectedLicense: e.target.value });
    };

    x.render = function() {
        // --- 这是修复问题的关键一行 ---
        const { isOpen, conflictCount, selectedLicense, isSimulating, simulationProgress } = x.state;
        const containerClass = isOpen ? "left-sidebar-container open" : "left-sidebar-container";
        const licenses = ['MIT', 'Apache-2.0', 'GPL-3.0', 'AGPL-3.0'];

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
                    <button 
                        onClick={handleHighlightClick} 
                        className="analysis-btn highlight" 
                        disabled={conflictCount === 0}
                    >
                        Highlight Conflicts ({conflictCount})
                    </button>

                    {/* 许可证模拟器 */}
                    <div className="simulator-controls">
                        <h4>License Simulator</h4>
                        <p>If my project uses...</p>
                        <select value={selectedLicense} onChange={handleLicenseChange} disabled={isSimulating}>
                            <option value="none">-- Select a License --</option>
                            {licenses.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                        
                        {/* 根据 isSimulating 状态显示不同内容 */}
                        {isSimulating ? (
                            <div className="progress-bar-container">
                                <div className="progress-bar" style={{ width: `${simulationProgress}%` }}></div>
                                <span className="progress-label">{Math.round(simulationProgress)}%</span>
                            </div>
                        ) : (
                            <button onClick={handleSimulate} className="analysis-btn" disabled={isSimulating}>
                                {selectedLicense === 'none' ? 'Reset View' : 'Simulate'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };
}, React);