// src/galaxy/TaskTypeLegend.jsx

import React from 'react';
import appEvents from './service/appEvents.js';

const maco = require('maco');

const TaskTypeLegend = maco((x) => {
    x.state = {
        visible: false
    };

    const taskColors = {
        'Multimodal': 'rgb(255, 0, 0)',
        'Natural Language Processing': 'rgb(0, 255, 0)',
        'Computer Vision': 'rgb(0, 0, 255)',
        'Audio': 'rgb(255, 255, 0)',
        'Tabular': 'rgb(255, 0, 255)',
        'Other': 'rgb(128, 128, 128)'
    };

    x.componentDidMount = function() {
        appEvents.showTaskTypeLegend.on(x.toggleVisibility);
    };

    x.componentWillUnmount = function() {
        appEvents.showTaskTypeLegend.off(x.toggleVisibility);
    };

    x.toggleVisibility = function(visible) {
        x.setState({ visible });
    };

    x.render = function() {
        if (!x.state.visible) {
            return null;
        }

        return (
            <div className="task-type-legend">
                <h4>Task Type Legend</h4>
                <ul>
                    {Object.entries(taskColors).map(([name, color]) => (
                        <li key={name}>
                            <span className="color-swatch" style={{ backgroundColor: color }}></span>
                            {name}
                        </li>
                    ))}
                </ul>
            </div>
        );
    };
}, React);

export default TaskTypeLegend;