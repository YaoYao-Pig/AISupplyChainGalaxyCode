import React from 'react';
import scene from './store/sceneStore.js';
import i18n from './utils/i18n.js';

module.exports = require('maco')(loadingIndicator, React);

function loadingIndicator(x) {
  var loadingMessage = '';

  x.render = function() {
    return scene.isLoading() ?
        <div className='label loading'>{loadingMessage || i18n.t('common.loading')}</div> :
        null;
  };

  x.componentDidMount = function() {
    scene.on('loadProgress', updateLoadingIndicator);
    i18n.onChange(forceRender);
  };

  x.componentWillUnmount = function () {
    scene.off('loadProgress', updateLoadingIndicator);
    i18n.offChange(forceRender);
  };

  function forceRender() {
    x.forceUpdate();
  }

  function updateLoadingIndicator(progress) {
    if (!progress || (!progress.message && progress.completed === undefined)) {
      loadingMessage = i18n.t('common.loading');
    } else {
      loadingMessage = i18n.t('loading.progress', {
        message: progress.message || i18n.t('common.loading'),
        completed: progress.completed === undefined ? '' : progress.completed
      });
    }
    x.forceUpdate();
  }
}