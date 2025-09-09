// src/galaxy/windows/nodeListView.jsx

import React from 'react';
import ReactList from 'react-list';
import NodeInfoRow from './nodeInfoRow.jsx';

module.exports = require('maco')(nodeListView, React);
var windowId = 0;

function nodeListView(x) {
  windowId += 1;

  x.render = function () {
    var windowViewModel = x.props.viewModel;
    var items = windowViewModel.list;
    var id = windowId + (windowViewModel.className || '') + items.length;

    // 这个组件只渲染列表内容
    return (
      <div className='window-list-content'>
        {content(items)}
      </div>
    );

    function renderItem(idx, key) {
      var vm = items[idx];
      return <NodeInfoRow key={key} viewModel={vm} />;
    }

    function getHeight() {
      return 20;
    }

    function content(items) {
      if (items.length > 0) {
        return <ReactList itemRenderer={renderItem}
                  length={items.length}
                  itemSizeGetter={getHeight}
                  type='variable'
                  key={id}/>;
      } else {
        return null;
      }
    }
  };
}