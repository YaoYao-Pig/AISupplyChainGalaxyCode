// src/galaxy/TaskTypeLegend.jsx

import React from 'react';
import appEvents from './service/appEvents.js';
import taskFilterStore from './store/taskFilterStore.js'; 
const maco = require('maco');

const TaskTypeLegend = maco((x) => {
    x.state = {
        visible: false,
        enabledTypes: taskFilterStore.getEnabledTypes()
    };

    const taskColors = {
        'Multimodal': 'rgb(255, 0, 0)',
        'Natural Language Processing': 'rgb(0, 255, 0)',
        'Computer Vision': 'rgb(0, 0, 255)',
        'Audio': 'rgb(255, 255, 0)',
        'Tabular': 'rgb(255, 0, 255)',
        'Other': 'rgb(128, 128, 128)'
    };
    const updateState = () => {
        x.setState({ enabledTypes: taskFilterStore.getEnabledTypes() });
    };
    x.componentDidMount = function() {
        appEvents.showTaskTypeLegend.on(x.toggleVisibility);
        taskFilterStore.on('changed', updateState);
    };

    x.componentWillUnmount = function() {
        appEvents.showTaskTypeLegend.off(x.toggleVisibility);
        taskFilterStore.off('changed', updateState);
    };

    x.toggleVisibility = function(visible) {
        x.setState({ visible });
    };
const handleToggle = (name) => {
        taskFilterStore.toggleType(name);
    };
    x.render = function() {
        if (!x.state.visible) {
            return null;
        }

        const { enabledTypes } = x.state;

        return (
            <div className="task-type-legend">
                <h4>Task Type Legend (Click to filter)</h4>
                <ul>
                    {Object.entries(taskColors).map(([name, color]) => {
                        const isEnabled = enabledTypes.get(name);
                        const itemStyle = {
                            cursor: 'pointer',
                            opacity: isEnabled ? 1 : 0.4, // 禁用的类型变半透明
                            transition: 'opacity 0.2s'
                        };

                        return (
                            <li key={name} onClick={() => handleToggle(name)} style={itemStyle} title={`Click to ${isEnabled ? 'hide' : 'show'} nodes`}>
                                <span className="color-swatch" style={{ backgroundColor: color }}></span>
                                {name}
                            </li>
                        );
                    })}
                </ul>
            </div>
        );
    };
}, React);

export default TaskTypeLegend;