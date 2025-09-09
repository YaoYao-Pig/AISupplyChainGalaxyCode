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
    console.log('LOG: windowCollectionModel.js - showWindow() called for ID:', windowId); // <-- 添加日志
    windows[windowId] = viewModel;
    api.fire('changed');
  }

  function hideWindow(windowId) {
    console.log('LOG: windowCollectionModel.js - hideWindow() called for ID:', windowId); // <-- 添加日志
    if (windows[windowId]) {
      delete windows[windowId];
      api.fire('changed');
    }
  }
}