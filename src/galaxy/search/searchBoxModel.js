// src/galaxy/search/searchBoxModel.js (清理版)

import appEvents from '../service/appEvents.js';
import scene from '../store/scene.js';
import clientRuntime from '../runtime/clientRuntime.js';
import SearchResultWindowViewModel from './SearchResultWindowViewModel.js';

export default searchBoxModel();

const searchResultsWindowId = 'search-results';

function searchBoxModel() {
  let activeTag = null;

  let api = {
    search: search,
    submit: submit,
    getActiveTag: () => activeTag
  };
  
  appEvents.searchByTag.on(searchByTag);
  // --- 我们不再需要监听 selectNode 事件了 ---

  return api;

  // 这个函数不再需要了，因为逻辑已经移到 nodeDetailsStore 中
  // function handleNodeSelection(nodeId) { ... }

  function searchByTag(tag) {
    if (!tag) return;

    if (activeTag === tag) {
      activeTag = null;
      appEvents.cls.fire();
      appEvents.hideNodeListWindow.fire(searchResultsWindowId);
    } else {
      activeTag = tag;
      const searchResults = scene.findByTag(tag);
      appEvents.cls.fire();
      appEvents.hideNodeListWindow.fire(searchResultsWindowId);

      if (searchResults && searchResults.length > 0) {
        const queryResult = { results: searchResults };
        appEvents.highlightQuery.fire(queryResult, 0xff0000ff);
        const searchResultWindowViewModel = new SearchResultWindowViewModel(searchResults);
        appEvents.showNodeListWindow.fire(searchResultWindowViewModel, searchResultsWindowId);
      }
    }
    appEvents.activeTagChanged.fire(activeTag);
  }

  function search(newText) {
    if (activeTag) {
        activeTag = null;
        appEvents.activeTagChanged.fire(activeTag);
    }
    appEvents.cls.fire(); 
    if (newText && newText[0] === ':') return;
    var searchResults = scene.find(newText);
    var searchResultWindowViewModel = new SearchResultWindowViewModel(searchResults);
    if (searchResults.length) {
      appEvents.showNodeListWindow.fire(searchResultWindowViewModel, searchResultsWindowId);
    } else {
      appEvents.hideNodeListWindow.fire(searchResultsWindowId);
    }
  }

  function submit(command) {
    if (!command || command[0] !== ':') return;
    command = 'with (ctx) { ' + command.substr(1) + ' }';
    var dynamicFunction = new Function('ctx', command);
    dynamicFunction(clientRuntime);
  }
}