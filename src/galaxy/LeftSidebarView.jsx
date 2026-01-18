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
        isCommunityView: false,
        isTaskTypeView: false,
        isCommunityView: false,
    };

    x.componentDidMount = function() {
        complianceStore.on('changed', updateConflictCount);
        updateConflictCount();
        appEvents.simulationStatusUpdate.on(updateSimulationStatus);
        appEvents.cls.on(handleCls);
        appEvents.timelineChanged.on(handleTimelineUpdate);
    };

    x.componentWillUnmount = function() {
        complianceStore.off('changed', updateConflictCount);
        appEvents.simulationStatusUpdate.off(updateSimulationStatus);
        appEvents.timelineChanged.off(handleTimelineUpdate);
    };
    
    const handleCls = () => {
        // 如果当前处于 TaskView 模式，且被外部动作（如点击空白处）打断
        if (x.state.isTaskTypeView) {
            x.setState({ isTaskTypeView: false });
            appEvents.showTaskTypeLegend.fire(false); // 确保图例也隐藏
        }
        
        // 同样逻辑也可以应用于社区视图，如果需要的话
        if (x.state.isCommunityView) {
             x.setState({ isCommunityView: false });
        }
        
        // 重置核心高亮按钮状态
        if (x.state.isCoreHighlighted) {
            x.setState({ isCoreHighlighted: false });
        }
    };

const handleTimelineUpdate = (date) => {
        // 只有当社区视图处于激活状态，且 Timeline 处于开启状态 (date 不为 null) 时，才进行重绘
        if (x.state.isCommunityView && date) {
            // 注意：社区计算比较耗时，如果在播放动画时可能会卡顿。
            // 简单的优化是：仅在手动拖拽或每隔几帧更新，这里为了演示直接更新
            const communitiesToRender = scene.calculateCommunitiesForDate(date);
            appEvents.showCommunities.fire(communitiesToRender);
        } else if (!date && x.state.isCommunityView) {
             // 如果 Timeline 关闭了 (date 为 null)，但还在社区视图，则切回全局社区
             const communitiesToRender = scene.getCommunities();
             appEvents.showCommunities.fire(communitiesToRender);
        }
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

        const timelineState = timelineStore.getState();
        let communitiesToRender;

        if (timelineState.enabled && timelineState.currentDate) {
            // 如果 Timeline 开启，计算当前日期的社区
            // 注意：timelineStore.allDates[timelineState.currentIndex] 可能更准确
            const date = new Date(timelineState.currentDate); 
            communitiesToRender = scene.calculateCommunitiesForDate(date);
        } else {
            // 全局社区
            communitiesToRender = scene.getCommunities();
        }
        
        appEvents.showCommunities.fire(communitiesToRender);
        x.setState({ isCommunityView: true });
    };

    const handleLicenseChange = (e) => x.setState({ selectedLicense: e.target.value });
    const handleToggleTimeline = () => appEvents.toggleTimeline.fire();
    const handleShowTaskTypeView = () => {
        const { isTaskTypeView } = x.state;
        if (isTaskTypeView) {
            appEvents.cls.fire();
            appEvents.showTaskTypeLegend.fire(false); // 隐藏图例
        } else {
            appEvents.showTaskTypeView.fire();
            appEvents.showTaskTypeLegend.fire(true); // 显示图例
        }
        x.setState({ isTaskTypeView: !isTaskTypeView });
    };

    x.render = function() {
        const { isOpen, conflictCount, selectedLicense, isSimulating, simulationProgress, isCoreHighlighted, isCommunityView, isTaskTypeView } = x.state;
        const containerClass = isOpen ? "left-sidebar-container open" : "left-sidebar-container";
        const licenses = ['MIT', 'Apache-2.0', 'GPL-3.0', 'AGPL-3.0'];
        const coreButtonText = isCoreHighlighted ? "Show All Models" : "Highlight Core Models";
        const communityButtonText = isCommunityView ? "Show Default View" : "Show Communities"; // 根据状态改变按钮文字
        const taskTypeButtonText = isTaskTypeView ? "Show Default View" : "Task Type View";
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
                    <button onClick={handleShowTaskTypeView} className="analysis-btn">{taskTypeButtonText}</button>
                     <button onClick={handleHighlightCore} className="analysis-btn">{coreButtonText}</button>
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

                    <hr className="sidebar-separator" />

                    {/* --- 分类 3: Other --- */}
                    <h4>License</h4>
                    <div className="simulator-controls">
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
                    </div>
                </div>
            </div>
        );
    };
}, React);