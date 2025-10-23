// src/galaxy/EdgeTypeLegend.jsx

import React from 'react';
import appEvents from './service/appEvents.js';

const maco = require('maco');

const EdgeTypeLegend = maco((x) => {
    x.state = {
        visible: false // Initially hidden
    };

    // --- IMPORTANT: Define edge colors EXACTLY as in lineView.js ---
    const edgeTypeColors = {
      'BASE_MODEL': 'rgb(30, 80, 200)', // Adjusted RGB for better visibility
      'ADAPTER': 'rgb(255, 128, 50)',      // Adjusted RGB
      'FINETUNE': 'rgb(50, 200, 128)',     // Adjusted RGB
      'MERGE': 'rgb(204, 204, 204)',    // Adjusted RGB
      'QUANTIZED': 'rgb(255, 255, 0)',       // Adjusted RGB (Keep yellow)
      'UNKNOWN': 'rgb(128, 128, 128)',   // Keep grey
      // Add other types if you defined more in lineView.js
    };
    // --- End Color Definition ---

    x.componentDidMount = function() {
        // Use the same event as the node legend to show/hide
        appEvents.showTaskTypeLegend.on(x.toggleVisibility);
    };

    x.componentWillUnmount = function() {
        appEvents.showTaskTypeLegend.off(x.toggleVisibility);
    };

    x.toggleVisibility = function(visible) {
        // Show this legend only when TaskTypeView is active AND links are shown (implicitly handled by the event)
        x.setState({ visible });
    };

    x.render = function() {
        if (!x.state.visible) {
            return null; // Don't render if not visible
        }

        return (
            <div className="edge-type-legend">
                <h4>Edge Type Legend</h4>
                <ul>
                    {Object.entries(edgeTypeColors).map(([name, color]) => (
                        <li key={name}>
                            <span className="color-swatch" style={{ backgroundColor: color }}></span>
                            {name.replace('_', ' ')} {/* Replace underscore for display */}
                        </li>
                    ))}
                </ul>
            </div>
        );
    };
}, React);

export default EdgeTypeLegend;