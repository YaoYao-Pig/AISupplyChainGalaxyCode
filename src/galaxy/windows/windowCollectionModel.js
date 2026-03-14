// src/galaxy/windows/windowCollectionModel.js

import appEvents from '../service/appEvents.js';
import eventify from 'ngraph.events';

export default windowCollectionModel();

function windowCollectionModel() {
  appEvents.showNodeListWindow.on(showWindow);
  appEvents.hideNodeListWindow.on(hideWindow);

  var windows = Object.create(null);

  var api = {
    getWindows: getWindows,
    add: add,
    remove: remove
  };

  eventify(api);

  return api;

  function getWindows() {
    return Object.keys(windows).map(function(key) {
      return windows[key];
    });
  }

  function add(viewModel) {
    if (!viewModel || !viewModel.id) {
      console.error('Cannot add window: ViewModel or ViewModel.id is missing', viewModel);
      return;
    }
    showWindow(viewModel, viewModel.id);
  }

  function remove(windowId) {
    hideWindow(windowId);
  }

  function showWindow(viewModel, windowId) {
    var id = windowId || (viewModel && viewModel.id);

    if (id) {
      viewModel.windowId = id;
      windows[id] = viewModel;
      api.fire('changed');
    }
  }

  function hideWindow(windowId) {
    if (windows[windowId]) {
      delete windows[windowId];
      api.fire('changed');
    }
  }
}