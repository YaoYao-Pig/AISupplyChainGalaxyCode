import React from 'react';
import scene from './store/sceneStore.js';
import i18n from './utils/i18n.js';

module.exports = require('maco')(loadingIndicator, React);

function loadingIndicator(x) {
  var loadingState = getDefaultState();

  x.render = function() {
    if (!scene.isLoading()) return null;

    var message = loadingState.message || i18n.t('common.loading');
    var details = loadingState.details;
    var percent = loadingState.percent;
    var barClassName = 'loading-progress-fill';
    var barStyle = {};

    if (percent === null) {
      barClassName += ' is-indeterminate';
    } else {
      barStyle.width = percent + '%';
    }

    return (
      <div className='loading loading-panel'>
        <div className='loading-panel-header'>
          <span className='loading-title'>{message}</span>
          {details ? <span className='loading-value'>{details}</span> : null}
        </div>
        <div className='loading-progress-track'>
          <div className={barClassName} style={barStyle}></div>
        </div>
      </div>
    );
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
    loadingState = normalizeProgress(progress);
    x.forceUpdate();
  }

  function normalizeProgress(progress) {
    if (!progress || (!progress.message && progress.completed === undefined)) {
      return getDefaultState();
    }

    var details = progress.completed === undefined ? '' : String(progress.completed);
    return {
      message: progress.message || i18n.t('common.loading'),
      details: details,
      percent: parsePercent(details)
    };
  }

  function getDefaultState() {
    return {
      message: i18n.t('common.loading'),
      details: '',
      percent: null
    };
  }

  function parsePercent(value) {
    if (!value) return null;

    var match = /(-?\d+(?:\.\d+)?)\s*%/.exec(value);
    if (!match) return null;

    var percent = Number(match[1]);
    if (!isFinite(percent)) return null;

    if (percent < 0) return 0;
    if (percent > 100) return 100;
    return percent;
  }
}
