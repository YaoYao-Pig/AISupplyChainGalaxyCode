// src/galaxy/windows/windowCollectionModel.js

import appEvents from '../service/appEvents.js';
import eventify from 'ngraph.events';

export default windowCollectionModel();

function windowCollectionModel() {

  // 保留原有的事件监听，兼容旧代码
  appEvents.showNodeListWindow.on(showWindow);
  appEvents.hideNodeListWindow.on(hideWindow);

  var windows = Object.create(null);

  var api = {
    getWindows: getWindows,
    add: add,       // <--- 新增接口：允许直接添加窗口
    remove: remove  // <--- 新增接口：允许直接移除窗口
  };

  eventify(api);

  return api;

  function getWindows() {
    return Object.keys(windows).map(function(key) {
      return windows[key];
    });
  }

  /**
   * 新增：直接添加 ViewModel 到窗口集合
   * @param {Object} viewModel - 必须包含 id 属性
   */
  function add(viewModel) {
    if (!viewModel || !viewModel.id) {
      console.error('Cannot add window: ViewModel or ViewModel.id is missing', viewModel);
      return;
    }
    // 复用内部的 showWindow 逻辑
    showWindow(viewModel, viewModel.id);
  }

  /**
   * 新增：直接通过 ID 移除窗口
   */
  function remove(windowId) {
    hideWindow(windowId);
  }

  function showWindow(viewModel, windowId) {
    console.log('LOG: windowCollectionModel.js - showWindow() called for ID:', windowId);
    // 如果没有传 windowId，尝试从 viewModel 获取
    var id = windowId || (viewModel && viewModel.id);
    
    if (id) {
      windows[id] = viewModel;
      api.fire('changed'); // 触发事件通知 React 重新渲染
    }
  }

  function hideWindow(windowId) {
    console.log('LOG: windowCollectionModel.js - hideWindow() called for ID:', windowId);
    if (windows[windowId]) {
      delete windows[windowId];
      api.fire('changed');
    }
  }
}