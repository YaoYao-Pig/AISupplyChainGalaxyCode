// src/galaxy/windows/windowCollectionModel.js

import appEvents from '../service/appEvents.js';
import eventify from 'ngraph.events';

export default windowCollectionModel();

function windowCollectionModel() {

  appEvents.showNodeListWindow.on(showWindow);
  appEvents.hideNodeListWindow.on(hideWindow);

  var windows = Object.create(null);

  var api = {
    getWindows: getWindows
  };

  eventify(api);

  return api;

  function getWindows() {
    // 将存储的对象转换为数组，供UI层使用
    return Object.keys(windows).map(function(key) {
      return windows[key];
    });
  }

  function showWindow(viewModel, windowId) {
    // 直接通过 ID 添加或更新窗口
    windows[windowId] = viewModel;
    api.fire('changed');
  }

  function hideWindow(windowId) {
    // 检查窗口是否存在，然后通过 ID 删除
    if (windows[windowId]) {
      delete windows[windowId];
      api.fire('changed');
    }
  }
}