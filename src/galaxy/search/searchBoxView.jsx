// src/galaxy/search/searchBoxView.jsx

import React from 'react';
import { findDOMNode } from 'react-dom'; // 需要导入 findDOMNode
import ReactList from 'react-list';
import searchBoxModel from './searchBoxModel.js';
import NodeInfoRow from '../windows/nodeInfoRow.jsx';
import formatNumber from '../utils/formatNumber.js';
import appEvents from '../service/appEvents.js'; // 导入 appEvents

module.exports = require('maco')(searchBar, React);

function searchBar(x) {
  let containerRef = null; // 用于存储组件的 DOM 节点引用

  x.state = {
    results: [],
    visible: false 
  };

  x.componentDidMount = function() {
    containerRef = findDOMNode(x); // 获取组件的 DOM 节点
    searchBoxModel.on('changed', updateResults);
    // 监听整个文档的点击事件，以实现 "click away"
    document.addEventListener('click', handleClickOutside, true);
  };

  x.componentWillUnmount = function() {
    searchBoxModel.off('changed', updateResults);
    // 清理事件监听器
    document.removeEventListener('click', handleClickOutside, true);
  };

  function handleClickOutside(e) {
    // 如果点击事件的目标不在搜索组件内部，则隐藏结果
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
    // 直接渲染 NodeInfoRow，它的内部会处理点击
    return <NodeInfoRow key={vm.id} viewModel={vm} />;
  }

  function getHeight() {
    return 28; // 增加行高以提供更好的间距
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
                // 不再需要 onBlur
                />
                <span className='input-group-btn'>
                  <button className='btn' tabIndex='-1' type='button' onClick={runSubmit}>
                    <span className='glyphicon glyphicon-search'></span>
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