// src/galaxy/search/SearchResultWindowViewModel.js

import formatNumber from '../utils/formatNumber.js';

export default SearchResultWindowViewModel;

function SearchResultWindowViewModel(list) {
  this.className = 'search-results-window';
  this.list = list;
  this.matchesCountString = formatNumber(list.length);
  // 为 DraggableWindow 添加一个 title 属性
  this.title = 'Found ' + this.matchesCountString + ' matches';
}

// 保留 __name 可能是因为代码的其他部分还在使用它
SearchResultWindowViewModel.prototype.__name = 'SearchResultWindowViewModel';