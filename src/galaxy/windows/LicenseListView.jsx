// src/galaxy/windows/LicenseListView.jsx

import React from 'react';
import formatNumber from '../utils/formatNumber.js';

module.exports = require('maco')((x) => {
    x.render = function() {
        const { viewModel } = x.props;
        const data = viewModel.data || [];

        return (
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
        );
    }
}, React);