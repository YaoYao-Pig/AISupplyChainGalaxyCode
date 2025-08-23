// src/galaxy/windows/LicenseReportWindow.jsx

import React from 'react';
import complianceStore from '../store/licenseComplianceStore.js';

module.exports = require('maco')((x) => {
    x.componentDidMount = function() {
        complianceStore.on('changed', x.forceUpdate);
    };

    x.componentWillUnmount = function() {
        complianceStore.off('changed', x.forceUpdate);
    };

    x.render = function() {
        const conflictList = complianceStore.getConflictList();

        return (
            <div className="window-list-content report-list">
                {conflictList.length > 0 ? (
                    <table>
                        <thead>
                            <tr>
                                <th>Problematic Model</th>
                                <th>License</th>
                                <th>Parent Model</th>
                                <th>Parent License</th>
                            </tr>
                        </thead>
                        <tbody>
                            {conflictList.map((c, i) => (
                                <tr key={i}>
                                    <td>{c.childModel}</td>
                                    <td className="license-cell incompatible">{c.childLicense}</td>
                                    <td>{c.parentModel}</td>
                                    <td className="license-cell">{c.parentLicense}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="no-conflicts">No license conflicts found. Great!</p>
                )}
            </div>
        );
    }
}, React);