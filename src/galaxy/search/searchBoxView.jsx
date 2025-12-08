// src/galaxy/search/searchBoxView.jsx

import React from 'react';
import { findDOMNode } from 'react-dom';
import ReactList from 'react-list';
import searchBoxModel from './searchBoxModel.js';
import NodeInfoRow from '../windows/nodeInfoRow.jsx';
import formatNumber from '../utils/formatNumber.js';
import appEvents from '../service/appEvents.js'; 

module.exports = require('maco')(searchBar, React);

function searchBar(x) {
  let containerRef = null;

  x.state = {
    results: [],
    visible: false 
  };

  x.componentDidMount = function() {
    containerRef = findDOMNode(x);
    searchBoxModel.on('changed', updateResults);
    document.addEventListener('click', handleClickOutside, true);
  };

  x.componentWillUnmount = function() {
    searchBoxModel.off('changed', updateResults);
    document.removeEventListener('click', handleClickOutside, true);
  };

  function handleClickOutside(e) {
    if (containerRef && !containerRef.contains(e.target)) {
      if (x.state.visible) {
        x.setState({ visible: false });
      }
    }
  }

  function updateResults() {
    const newResults = searchBoxModel.getResults();
    x.setState({
      results: newResults,
      visible: newResults.length > 0
    });
  }

  function renderItem(idx, key) {
    const vm = x.state.results[idx];
    return <NodeInfoRow key={vm.id} viewModel={vm} />;
  }

  function getHeight() {
    return 28;
  }

  // --- 新增：打开路径查找窗口的函数 ---
  function showPathfinding() {
    appEvents.showPathfindingWindow.fire();
  }

  x.render = function () {
    const { results, visible } = x.state;
    let resultsView = null;

    if (visible && results.length > 0) {
      resultsView = (
        <div className='search-results'>
          <h4 className='search-results-title'>Found <strong>{formatNumber(results.length)}</strong> matches</h4>
          <div className='scroll-wrapper'>
            <ReactList
              itemRenderer={renderItem}
              length={results.length}
              itemSizeGetter={getHeight}
              type='variable'
            />
          </div>
        </div>
      );
    }

    return (
      <div className='container row'>
        <div className='search col-xs-12 col-sm-6 col-md-4'>
          <form className='search-form' role='search' onSubmit={runSubmit}>
            <div className='input-group'>
              <input type='text'
                ref='searchText'
                className='form-control no-shadow' placeholder='enter a search term'
                onChange={runSearch}
                onFocus={handleFocus}
                />
                <span className='input-group-btn'>
                  <button className='btn' tabIndex='-1' type='button' onClick={runSubmit} title="Search">
                    <span className='glyphicon glyphicon-search'></span>
                  </button>
                  {/* --- 新增：路径查找按钮 --- */}
                  <button 
                    className='btn' 
                    tabIndex='-1' 
                    type='button' 
                    onClick={showPathfinding} 
                    title="Compliance Connection Explorer"
                    style={{ borderLeft: '1px solid #555' }} // 加个分割线
                  >
                    <span className='glyphicon glyphicon-road'></span>
                  </button>
                </span>
            </div>
          </form>
          {resultsView}
        </div>
      </div>
    );
  };

  function runSearch(e) {
    searchBoxModel.search(e.target.value);
  }

  function handleFocus(e) {
    if (!e.target.value) {
      searchBoxModel.search('');
    }
  }

  function runSubmit(e) {
    e.preventDefault();
    var searchText = x.refs.searchText.value;
    searchBoxModel.submit(searchText);
  }
}