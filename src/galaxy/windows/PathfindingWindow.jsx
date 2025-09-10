import React from 'react';
import appEvents from '../service/appEvents.js';
import scene from '../store/sceneStore.js';
import formatNumber from '../utils/formatNumber.js';

const maco = require('maco');

// --- 修复：MiniSearch 组件的 maco 调用方式 ---
// 1. 先定义组件函数
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
// 2. 正确地将函数和 React 传给 maco
const MiniSearch = maco(miniSearchComponent, React);


// 主窗口组件 (这里的 maco 用法保持不变)
module.exports = maco((x, React) => {
    x.state = {
        startNode: null,
        endNode: null,
        status: 'idle', // 'idle', 'searching', 'found', 'not_found'
        path: null
    };

    const setStartNode = (node) => x.setState({ startNode: node });
    const setEndNode = (node) => x.setState({ endNode: node });

    const findPath = () => {
        const { startNode, endNode } = x.state;
        if (!startNode || !endNode) return;

        x.setState({ status: 'searching', path: null });
        
        setTimeout(() => {
            const pathIds = scene.getGraph().findShortestPath(startNode.id, endNode.id);
            if (pathIds) {
                const pathNodes = pathIds.map(id => scene.getNodeInfo(id));
                x.setState({ status: 'found', path: pathNodes });
                appEvents.pathFound.fire(pathIds);
            } else {
                x.setState({ status: 'not_found' });
            }
        }, 50);
    };

    const clear = () => {
        // We need to re-render the MiniSearch components with empty values.
        // A full re-mount of the PathfindingWindow is the easiest way.
        appEvents.hideNodeListWindow.fire('pathfinder');
        appEvents.showPathfindingWindow.fire();
        appEvents.clearPath.fire();
    };

    x.render = function() {
        const { startNode, endNode, status, path } = x.state;
        const canSearch = startNode && endNode;

        let resultArea;
        if (status === 'searching') {
            resultArea = <div className="path-status">Searching...</div>;
        } else if (status === 'not_found') {
            resultArea = <div className="path-status error">No connection path found.</div>;
        } else if (status === 'found' && path) {
            resultArea = (
                <div className="path-results">
                    <h4>Shortest Path ({path.length - 1} steps):</h4>
                    <ol>
                        {path.map((node) => <li key={node.id}>{node.name}</li>)}
                    </ol>
                </div>
            );
        }

        return (
            <div className="pathfinder-content">
                <div className="search-controls">
                    <MiniSearch placeholder="Start model..." onSelect={setStartNode} />
                    <span className="arrow">→</span>
                    <MiniSearch placeholder="End model..." onSelect={setEndNode} />
                </div>
                <div className="action-controls">
                    <button onClick={findPath} disabled={!canSearch || status === 'searching'}>
                        {status === 'searching' ? 'Searching...' : 'Find Shortest Path'}
                    </button>
                    <button onClick={clear} className="secondary">Clear</button>
                </div>
                {resultArea}
            </div>
        );
    };
}, React);