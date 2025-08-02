// src/galaxy/search/searchBoxView.jsx (修正版)

import React from 'react';
import searchBoxModel from './searchBoxModel.js';

module.exports = require('maco')(searchBar, React);

function searchBar(x) {
  x.render = function () {
    return (
      <div className='container row'>
        <div className='search col-xs-12 col-sm-6 col-md-4'>
          <form className='search-form' role='search' onSubmit={runSubmit}>
            <div className='input-group'>
              <input type='text'
                ref='searchText' // ref 保持不变
                className='form-control no-shadow' placeholder='enter a search term'
                onChange={runSearch}/>
                <span className='input-group-btn'>
                  <button className='btn' tabIndex='-1' type='button'>
                    <span className='glyphicon glyphicon-search'></span>
                  </button>
                </span>
            </div>
          </form>
        </div>
      </div>
    );
  };

  function runSearch(e) {
    searchBoxModel.search(e.target.value);
  }

  function runSubmit(e) {
    e.preventDefault();
    // --- 核心修正: 使用 x.refs 来访问DOM节点 ---
    // maco 组件实例 `x` 上挂载了 refs 对象
    var searchText = x.refs.searchText.value;
    // 之前的 React.findDOMNode(x.refs.searchText) 在新版React中已不推荐
    // --- 修正结束 ---
    searchBoxModel.submit(searchText);
  }
}