import React from 'react';
import formatNumber from '../utils/formatNumber.js';
import appEvents from '../service/appEvents.js';

// 1. 定义组件的全部逻辑
function nodeInfoRow(x) {
  const handleRowClick = (e) => {
    // 阻止事件冒泡, 防止触发其他不必要的事件
    e.stopPropagation();
    // 触发全局的 "selectNode" 事件
    appEvents.selectNode.fire(x.props.viewModel.id);
  };

  x.render = function () {
    const item = x.props.viewModel;
    const image = item.icon ? <img src={item.icon} width='15px' alt=''/> : '';

    return (
      // 整个 div 都可以点击
      <div className='node-info-row' onClick={handleRowClick}>
        <div className='node-info-name'>
          {image}
          <span>{item.name}</span>
        </div>
        <div className='node-info-degrees'>
          <span className='in-degree'>{formatNumber(item.in)}</span>
          <span className='out-degree'>{formatNumber(item.out)}</span>
        </div>
      </div>
    );
  };
}

// 2. 将组件函数 nodeInfoRow 和 React 对象作为两个独立的参数传给 maco
// 这是正确的用法
module.exports = require('maco')(nodeInfoRow, React);