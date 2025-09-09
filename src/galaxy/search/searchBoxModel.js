// src/galaxy/search/searchBoxModel.js

import appEvents from '../service/appEvents.js';
import scene from '../store/sceneStore.js';
import clientRuntime from '../runtime/clientRuntime.js';
// SearchResultWindowViewModel 不再需要了
// import SearchResultWindowViewModel from './SearchResultWindowViewModel.js';
import eventify from 'ngraph.events'; // 引入事件模块

export default searchBoxModel();

function searchBoxModel() {
  let activeTag = null;
  let currentResults = []; // 新增：在这里管理结果状态

  const api = {
    search: search,
    submit: submit,
    getActiveTag: () => activeTag,
    getResults: () => currentResults, // 新增：让视图可以获取结果
    clearResults: clearResults
  };

  eventify(api); // 让 model 自身可以触发事件
  
  appEvents.searchByTag.on(searchByTag);
  // 当选中一个节点时，自动清空并隐藏搜索结果
  appEvents.selectNode.on(clearResults);

  return api;

  function clearResults() {
    if (currentResults.length > 0) {
      currentResults = [];
      api.fire('changed'); // 通知视图更新
    }
  }

  function searchByTag(tag) {
    // 这部分逻辑也更新为使用内部状态
    if (!tag) return;
    appEvents.cls.fire();

    if (activeTag === tag) {
      activeTag = null;
      currentResults = [];
    } else {
      activeTag = tag;
      currentResults = scene.findByTag(tag);
      if (currentResults.length > 0) {
        const queryResult = { results: currentResults };
        appEvents.highlightQuery.fire(queryResult, 0xff0000ff);
      }
    }
    appEvents.activeTagChanged.fire(activeTag);
    api.fire('changed'); // 通知视图更新
  }

  function search(newText) {
    if (activeTag) {
        activeTag = null;
        appEvents.activeTagChanged.fire(activeTag);
    }
    appEvents.cls.fire();
    if (newText && newText[0] === ':') {
      currentResults = [];
    } else {
      currentResults = scene.find(newText);
    }
    // 不再调用 window系统，而是触发自己的 'changed' 事件
    api.fire('changed'); 
  }

  function submit(command) {
    if (command && command[0] === ':') {
      clearResults(); // 如果是命令，则清空结果
      command = 'with (ctx) { ' + command.substr(1) + ' }';
      var dynamicFunction = new Function('ctx', command);
      dynamicFunction(clientRuntime);
    } else {
      search(command);
    }
  }
}