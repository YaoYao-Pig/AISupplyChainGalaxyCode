// src/galaxy/EdgeTypeLegend.jsx

import React from 'react';
import appEvents from './service/appEvents.js';
import edgeFilterStore from './store/edgeFilterStore.js'; // 导入 store

const maco = require('maco');

const EdgeTypeLegend = maco((x) => {
    // 从 store 初始化 state
    x.state = {
        visible: false, // 图例本身的可见性
        enabledTypes: edgeFilterStore.getEnabledTypes() // 各种类型的启用状态
    };

    // --- IMPORTANT: Define edge colors EXACTLY as in lineView.js ---
    const edgeTypeColors = {
      'BASE_MODEL': 'rgb(30, 80, 200)', 
      'ADAPTER': 'rgb(255, 128, 50)',      
      'FINETUNE': 'rgb(50, 200, 128)',     
      'MERGE': 'rgb(204, 204, 204)',    
      'QUANTIZED': 'rgb(255, 255, 0)',       
      'UNKNOWN': 'rgb(128, 128, 128)',   
    };
    // --- End Color Definition ---

    // 新增：用于更新启用状态的函数
    const updateEnabledTypes = () => {
        x.setState({
            enabledTypes: edgeFilterStore.getEnabledTypes()
        });
    };

    x.componentDidMount = function() {
        appEvents.showTaskTypeLegend.on(x.toggleVisibility);
        edgeFilterStore.on('changed', updateEnabledTypes); // 订阅 store 的变化
    };

    x.componentWillUnmount = function() {
        appEvents.showTaskTypeLegend.off(x.toggleVisibility);
        edgeFilterStore.off('changed', updateEnabledTypes); // 取消订阅
    };

    x.toggleVisibility = function(visible) {
        x.setState({ visible });
    };

    // 新增：点击处理函数
    const handleToggleType = (typeName) => {
        edgeFilterStore.toggleType(typeName);
        // store 触发 'changed' 事件后，updateEnabledTypes 会被调用，自动更新 state
    };

    x.render = function() {
        if (!x.state.visible) {
            return null; 
        }

        const { enabledTypes } = x.state;

        return (
            <div className="edge-type-legend">
                <h4>Edge Type Legend (Click to filter)</h4>
                <ul>
                    {Object.entries(edgeTypeColors).map(([name, color]) => {
                        // 检查类型是否存在于 store 中（可能数据还未完全加载）
                        const isEnabled = enabledTypes.has(name) ? enabledTypes.get(name) : true;
                        const itemClass = isEnabled ? 'enabled' : 'disabled'; // 添加 class

                        return (
                            <li 
                                key={name} 
                                className={itemClass} // 应用 class
                                onClick={() => handleToggleType(name)} // 添加点击事件
                                title={`Click to ${isEnabled ? 'hide' : 'show'} ${name} edges`}
                            >
                                <span className="color-swatch" style={{ backgroundColor: color }}></span>
                                {name.replace('_', ' ')}
                            </li>
                        );
                    })}
                </ul>
            </div>
        );
    };
}, React);

export default EdgeTypeLegend;