// src/galaxy/search/searchBoxView.jsx (最终修复版)

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
                ref='searchText'
                className='form-control no-shadow' placeholder='enter a search term'
                onChange={runSearch}
                onFocus={handleFocus} /* <-- 核心修复 3：添加 onFocus 事件 */
                />
                <span className='input-group-btn'>
                  <button className='btn' tabIndex='-1' type='button' onClick={runSubmit}> {/* <-- 建议：为按钮也添加 onClick */}
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

  function handleFocus(e) {
    // 当用户点击输入框时，如果框内无内容，则触发一次空搜索以显示预选列表
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