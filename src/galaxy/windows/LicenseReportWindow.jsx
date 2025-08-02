// src/galaxy/windows/LicenseReportWindow.jsx

import React from 'react';
import appEvents from '../service/appEvents.js';
import complianceStore from '../store/licenseComplianceStore.js';

module.exports = require('maco')((x) => {
    const handleHighlightClick = () => {
        const conflictNodeIds = complianceStore.getConflictList().map(c => c.nodeId);
        appEvents.highlightLicenseConflicts.fire(conflictNodeIds);
    };

    x.componentDidMount = function() {
        // 当数据变化时，强制组件重新渲染以获取最新列表
        complianceStore.on('changed', x.forceUpdate);
    };

    x.componentWillUnmount = function() {
        complianceStore.off('changed', x.forceUpdate);
    };

    x.render = function() {
        const conflictList = complianceStore.getConflictList();

        return (
            <div className='window-container license-report-window'>
                <div className="window-header">
                    <h4>License Compliance Report ({conflictList.length} conflicts found)</h4>
                    {conflictList.length > 0 && (
                         <button onClick={handleHighlightClick} className="highlight-btn-small">
                            Highlight All Conflicts in 3D View
                        </button>
                    )}
                </div>
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
            </div>
        );
    }
}, React);