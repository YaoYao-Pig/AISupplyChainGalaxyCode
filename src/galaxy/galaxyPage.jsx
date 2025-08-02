import React from 'react';
import LoadingIndicator from './loadingIndicator.jsx';
import Scene from './scene.jsx';
import appEvents from './service/appEvents.js';

module.exports = require('maco')(galaxyPage, React);

function galaxyPage(x) {
  var currentPath;
  x.componentDidMount = function() {
    // 组件第一次挂载时，检查并加载图谱
    checkRouteAndLoadGraph();
  };

  x.componentDidUpdate = function(prevProps) {
    // 每次组件更新后（例如 props 变化），都检查并加载图谱
    checkRouteAndLoadGraph();
  };
  x.render = function() {
    // This doesn't seem to belong here. The whole routing system is a mess
    // // TODO: Come up with better routing
    // loadGraphIfRouteChanged();

    return (
      <div>
        <LoadingIndicator />
        <Scene />
      </div>
    );
  };

  function checkRouteAndLoadGraph() {
    var routeName = x.props.params.name;
    // 检查路径是否真的发生了变化
    if (routeName !== currentPath) {
      currentPath = routeName;
      // 触发下载新图谱的事件
      appEvents.downloadGraphRequested.fire(currentPath);
    }
    // 这个事件也应该在路由变化后触发
    appEvents.queryChanged.fire();
  }
}
