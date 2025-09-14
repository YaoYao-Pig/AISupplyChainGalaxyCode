// src/galaxy/LeftSidebarView.jsx

import React from 'react';
import appEvents from './service/appEvents.js';
import complianceStore from './store/licenseComplianceStore.js';
import licenseSimulatorStore from './store/licenseSimulatorStore.js'; 
const inheritanceRiskStore = require('./store/inheritanceRiskStore.js');
const InheritanceRiskViewModel = require('./windows/InheritanceRiskViewModel.js');
import timelineStore from './store/timelineStore.js';
const scene = require('./store/sceneStore.js');
module.exports = require('maco')((x) => {
    x.state = {
        isOpen: false,
        conflictCount: 0,
        selectedLicense: 'none',
        isSimulating: false,
        simulationProgress: 0,
        isCoreHighlighted: false,
        isCommunityView: false
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
    
    const handleShowRiskChart = () => {
        appEvents.hideNodeListWindow.fire('inheritance-risk');
        const riskData = inheritanceRiskStore.getRiskData();
        if (riskData) {
            const viewModel = new InheritanceRiskViewModel(riskData);
            appEvents.showNodeListWindow.fire(viewModel, 'inheritance-risk');
        } else {
            console.warn('Inheritance risk data is not ready yet.');
        }
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

    const handleMouseEnter = () => x.setState({ isOpen: true });
    const handleMouseLeave = () => x.setState({ isOpen: false });
    const handleGlobalStats = () => appEvents.showGlobalLicenseStats.fire();
    const handleGlobalReport = () => appEvents.showGlobalLicenseReport.fire();
    const handleGlobalComplianceStats = () => appEvents.showGlobalComplianceStats.fire();

    const handleHighlightClick = () => {
        const conflictNodeIds = complianceStore.getConflictList().map(c => c.nodeId);
        appEvents.highlightLicenseConflicts.fire(conflictNodeIds);
    };

    const handleSimulate = () => {
        const { selectedLicense } = x.state;
        if (selectedLicense === 'none') {
            appEvents.runLicenseSimulation.fire(null);
        } else {
            appEvents.runLicenseSimulation.fire(selectedLicense);
        }
    };
    
    const handleHighlightCore = () => {
        const currentlyHighlighted = x.state.isCoreHighlighted;
        if (currentlyHighlighted) {
            appEvents.cls.fire(); 
        } else {
            const topN = 50; 
            appEvents.highlightCoreModels.fire(topN);
        }
        x.setState({ isCoreHighlighted: !currentlyHighlighted });
    };

    const handleShowCommunities = () => {
        const currentlyShowing = x.state.isCommunityView;
        if (currentlyShowing) {
            appEvents.cls.fire();
            x.setState({ isCommunityView: false });
            return;
        }

        // --- 核心逻辑：检查 Timeline 状态 ---
        const timelineState = timelineStore.getState();
        let communitiesToRender;

        if (timelineState.enabled) {
            // 如果 Timeline 开启，则根据当前日期动态计算社区
            const currentDate = timelineState.allDates[timelineState.currentIndex];
            communitiesToRender = scene.calculateCommunitiesForDate(currentDate);
        } else {
            // 如果 Timeline 关闭，则使用全局的、预先计算好的社区
            communitiesToRender = scene.getCommunities();
        }
        
        // 将计算好的社区数据传递给渲染器
        appEvents.showCommunities.fire(communitiesToRender);
        x.setState({ isCommunityView: true });
    };

    const handleLicenseChange = (e) => x.setState({ selectedLicense: e.target.value });
    const handleToggleTimeline = () => appEvents.toggleTimeline.fire();

    x.render = function() {
        const { isOpen, conflictCount, selectedLicense, isSimulating, simulationProgress, isCoreHighlighted,isCommunityView } = x.state;
        const containerClass = isOpen ? "left-sidebar-container open" : "left-sidebar-container";
        const licenses = ['MIT', 'Apache-2.0', 'GPL-3.0', 'AGPL-3.0'];
        const coreButtonText = isCoreHighlighted ? "Show All Models" : "Highlight Core Models";
        const communityButtonText = isCommunityView ? "Show Default View" : "Show Communities"; // 根据状态改变按钮文字
        return (
            <div 
                className={containerClass} 
                onMouseEnter={handleMouseEnter} 
                onMouseLeave={handleMouseLeave}
            >
                <div className="left-sidebar-content">
                    {/* --- 分类 1: 数据洞察 --- */}
                    <h4>Data Insight</h4>
                    <button onClick={handleGlobalStats} className="analysis-btn">License Stats</button>
                    <button onClick={handleGlobalReport} className="analysis-btn">Compliance Report</button>
                    <button onClick={handleGlobalComplianceStats} className="analysis-btn">Compliance Stats</button>
                    {/* <button onClick={handleShowRiskChart} className="analysis-btn">Inheritance Risk</button> */}
                    
                    <hr className="sidebar-separator" />

                    {/* --- 分类 2: 视角切换 --- */}
                    <h4>View Switch</h4>
                    {/* <button onClick={handleHighlightCore} className="analysis-btn">{coreButtonText}</button>
                    <button onClick={handleShowCommunities} className="analysis-btn">
                        {communityButtonText}
                    </button>
                    <button 
                        onClick={handleHighlightClick} 
                        className="analysis-btn highlight" 
                        disabled={conflictCount === 0}
                    >
                        Highlight Conflicts ({conflictCount})
                    </button>
                    <button onClick={handleToggleTimeline} className="analysis-btn">Toggle Timeline</button>

                    <hr className="sidebar-separator" /> */}

                    {/* --- 分类 3: Other --- */}
                    <h4>Other</h4>
                    {/* <div className="simulator-controls">
                        <p>License Simulator</p>
                        <select value={selectedLicense} onChange={handleLicenseChange} disabled={isSimulating}>
                            <option value="none">-- Select a License --</option>
                            {licenses.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                        
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
                    </div> */}
                </div>
            </div>
        );
    };
}, React);