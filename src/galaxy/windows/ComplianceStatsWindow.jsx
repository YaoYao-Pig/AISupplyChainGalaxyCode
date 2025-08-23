// src/galaxy/windows/ComplianceStatsWindow.jsx

import React from 'react';
import appEvents from '../service/appEvents.js';
import formatNumber from '../utils/formatNumber.js';
import complianceStore from '../store/licenseComplianceStore.js';

module.exports = require('maco')((x) => {
    const handleClose = () => {
        appEvents.hideNodeListWindow.fire('compliance-stats');
    };

    x.componentDidMount = function() {
        complianceStore.on('changed', x.forceUpdate);
    };

    x.componentWillUnmount = function() {
        complianceStore.off('changed', x.forceUpdate);
    };

    x.render = function() {
        const stats = complianceStore.getConflictStats();
        const totalConflicts = complianceStore.getConflictList().length;

        return (
            <div className={'window-container license-list-window'}>
                <div className="window-header">
                    <h4>Incompatible Model License Stats ({totalConflicts} total conflicts)</h4>
                    <button onClick={handleClose} className="window-close-btn" title="Close">&times;</button>
                </div>
                <div className="window-list-content report-list">
                    {stats.length > 0 ? (
                        <table>
                            <thead>
                                <tr>
                                    <th>License of Incompatible Model</th>
                                    <th>Count</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.map((item, i) => (
                                    <tr key={i}>
                                        <td>{item.name}</td>
                                        <td>{formatNumber(item.value)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="no-conflicts">No license conflicts found.</p>
                    )}
                </div>
            </div>
        );
    }
}, React);