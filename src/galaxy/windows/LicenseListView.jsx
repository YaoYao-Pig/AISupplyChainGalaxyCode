// src/galaxy/windows/LicenseListView.jsx

import React from 'react';
import appEvents from '../service/appEvents.js';
import formatNumber from '../utils/formatNumber.js';

module.exports = require('maco')((x) => {
    const handleClose = () => {
        appEvents.hideNodeListWindow.fire('license-distribution');
    };

    x.render = function() {
        const { viewModel } = x.props;
        const data = viewModel.data || [];

        return (
            <div className={'window-container license-list-window'}>
                <div className="window-header">
                    <h4>{viewModel.title}</h4>
                    <button onClick={handleClose} className="window-close-btn" title="Close">&times;</button>
                </div>
                <div className="window-list-content report-list">
                    {data.length > 0 ? (
                        <table>
                            <thead>
                                <tr>
                                    <th>License</th>
                                    <th>Model Count</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item, i) => (
                                    <tr key={i}>
                                        <td>{item.name}</td>
                                        <td>{formatNumber(item.value)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="no-conflicts">Analyzing license data...</p>
                    )}
                </div>
            </div>
        );
    }
}, React);