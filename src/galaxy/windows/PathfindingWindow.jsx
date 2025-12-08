import React from 'react';
import appEvents from '../service/appEvents.js';
import scene from '../store/sceneStore.js';
import { isLicenseCompatible } from '../store/licenseUtils.js';

const maco = require('maco');

// ... (MiniSearch 组件代码保持不变) ...
function miniSearchComponent(x) {
    x.state = { query: '', results: [], selected: null };

    const handleQueryChange = (e) => {
        const query = e.target.value;
        const results = query ? scene.find(query).slice(0, 10) : [];
        x.setState({ query, results });
    };

    const handleSelect = (node) => {
        x.setState({ query: node.name, selected: node, results: [] });
        x.props.onSelect(node);
    };

    if (x.props.value !== undefined && x.props.value !== x.state.query && x.props.value === '') {
        x.state.query = '';
    }

    x.render = function() {
        const { query, results } = x.state;
        return (
            <div className="mini-search-container">
                <input 
                    type="text" 
                    placeholder={x.props.placeholder} 
                    value={query} 
                    onChange={handleQueryChange} 
                />
                {results.length > 0 && (
                    <ul className="mini-search-results">
                        {results.map(node => (
                            <li key={node.id} onMouseDown={() => handleSelect(node)}>
                                {node.name}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        );
    };
}
const MiniSearch = maco(miniSearchComponent, React);

// ... (主窗口组件) ...
module.exports = maco((x, React) => {
    x.state = {
        startNode: null,
        endNode: null,
        myLicense: 'MIT', 
        status: 'idle', 
        path: null,
        alternatives: null, 
        targetConflictNodeId: null
    };

    const setStartNode = (node) => x.setState({ startNode: node });
    const setEndNode = (node) => x.setState({ endNode: node });
    const setMyLicense = (e) => x.setState({ myLicense: e.target.value });

    const findPath = () => {
        const { startNode, endNode } = x.state;
        if (!endNode) return;

        x.setState({ status: 'searching', path: null, alternatives: null });
        
        setTimeout(() => {
            let pathNodes = [];
            
            if (startNode) {
                const pathIds = scene.getGraph().findShortestPath(startNode.id, endNode.id);
                if (pathIds) {
                    pathNodes = pathIds.map(id => {
                        const info = scene.getNodeInfo(id);
                        const data = scene.getGraph().getNodeData(id);
                        const licenseTag = (data.tags || []).find(t => t.startsWith('license:'));
                        const license = licenseTag ? licenseTag.substring(8) : (data.license || 'N/A');
                        return { ...info, license: license };
                    });
                    appEvents.pathFound.fire(pathIds);
                } else {
                    x.setState({ status: 'not_found' });
                    return;
                }
            } else {
                const id = endNode.id;
                const info = scene.getNodeInfo(id);
                const data = scene.getGraph().getNodeData(id);
                const licenseTag = (data.tags || []).find(t => t.startsWith('license:'));
                const license = licenseTag ? licenseTag.substring(8) : (data.license || 'N/A');
                pathNodes = [{ ...info, license: license }];
                appEvents.focusOnNode.fire(id);
            }

            x.setState({ status: 'found', path: pathNodes });
        }, 50);
    };

    const findAlternativesFor = (node) => {
        const { myLicense } = x.state;
        const alts = scene.findAlternativeModels(node.id, myLicense);
        x.setState({ 
            alternatives: alts,
            targetConflictNodeId: node.id
        });
    };

    const clear = () => {
        appEvents.hideNodeListWindow.fire('pathfinder');
        appEvents.showPathfindingWindow.fire();
        appEvents.clearPath.fire();
    };

    x.render = function() {
        const { startNode, endNode, status, path, myLicense, alternatives, targetConflictNodeId } = x.state;
        
        let resultArea = null;
        if (status === 'searching') {
            resultArea = <div className="path-status">Analyzing Graph...</div>;
        } else if (status === 'not_found') {
            resultArea = <div className="path-status error">No connection path found.</div>;
        } else if (status === 'found' && path) {
            let currentLicenseContext = myLicense;
            resultArea = (
                <div className="path-results">
                    <h4>Analysis Result:</h4>
                    <ul className="compliance-list">
                        {path.map((node, index) => {
                            const isStart = index === 0 && startNode;
                            const upstreamLicense = isStart ? myLicense : (index > 0 ? path[index-1].license : myLicense);
                            const isCompatible = isLicenseCompatible(node.license, upstreamLicense);
                            const isBlocker = !isCompatible;

                            return (
                                <li key={node.id} className={isBlocker ? 'conflict-item' : 'safe-item'}>
                                    <div className="node-row">
                                        <span className="status-icon">{isBlocker ? '❌' : '✅'}</span>
                                        <span className="node-name" onClick={()=>appEvents.focusOnNode.fire(node.id)}>{node.name}</span>
                                        <span className="license-tag">{node.license}</span>
                                    </div>
                                    {isBlocker && (
                                        <div className="conflict-actions">
                                            <div className="conflict-msg">
                                                Conflict: {node.license} is unlikely compatible with {upstreamLicense}
                                            </div>
                                            <button 
                                                className="find-alt-btn"
                                                onClick={() => findAlternativesFor(node)}>
                                                Find Alternatives
                                            </button>
                                        </div>
                                    )}
                                    {alternatives && targetConflictNodeId === node.id && (
                                        <div className="alternatives-panel">
                                            <h5>Recommended Alternatives (Compatible with {myLicense}):</h5>
                                            {alternatives.length > 0 ? (
                                                <ul>
                                                    {alternatives.map(alt => (
                                                        <li key={alt.id} onClick={() => {
                                                            appEvents.focusOnNode.fire(alt.id);
                                                        }}>
                                                            <span className="alt-name">{alt.name}</span>
                                                            <span className="alt-meta">{alt.license} • Score: {alt.score.toFixed(1)}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <div className="no-alts">No direct alternatives found.</div>
                                            )}
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            );
        } else {
            // *** 新增：默认状态下的使用说明 ***
            resultArea = (
                <div className="path-help">
                    <h5><span className="glyphicon glyphicon-info-sign"></span> How to Check Compliance</h5>
                    <ul>
                        <li><strong>1. Set Context:</strong> Select the license of <em>your</em> project.</li>
                        <li><strong>2. Pick Target:</strong> Search for the AI model you want to integrate.</li>
                        <li><strong>3. Run Check:</strong> We will analyze the model's license and its upstream dependencies.</li>
                        <li><strong>4. Resolve:</strong> If conflicts are found (🔴), use <b>Find Alternatives</b> to discover compatible models.</li>
                    </ul>
                </div>
            );
        }

        return (
            <div className="pathfinder-content compliance-mode">
                <div className="config-section">
                    <label>My Project License:</label>
                    <select value={myLicense} onChange={setMyLicense}>
                        <option value="MIT">MIT (Permissive)</option>
                        <option value="Apache-2.0">Apache 2.0</option>
                        <option value="GPL-3.0">GPL 3.0 (Copyleft)</option>
                        <option value="Proprietary">Proprietary (Closed)</option>
                    </select>
                </div>

                <div className="search-controls">
                    <MiniSearch placeholder="(Optional) Start model..." onSelect={setStartNode} value={startNode ? startNode.name : ''} />
                    <span className="arrow">→</span>
                    <MiniSearch placeholder="Target model..." onSelect={setEndNode} value={endNode ? endNode.name : ''} />
                </div>

                <div className="action-controls">
                    <button onClick={findPath} disabled={!endNode || status === 'searching'}>
                        {status === 'searching' ? 'Analyzing...' : 'Check Compliance'}
                    </button>
                    <button onClick={clear} className="secondary">Reset</button>
                </div>
                {resultArea}
            </div>
        );
    };
}, React);