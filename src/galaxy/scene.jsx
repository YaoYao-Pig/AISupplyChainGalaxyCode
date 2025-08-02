// src/galaxy/scene.jsx (最终修正版 - 修复 activeTag 引用错误)

import React from 'react';
import {findDOMNode} from 'react-dom';
import HoverInfo from './hoverInfo.jsx';
import NodeDetails from './nodeDetails/nodeDetailsView.jsx';
import SidebarView from './SidebarView.jsx';
import detailModel from './nodeDetails/nodeDetailsStore.js';
import searchBoxModel from './search/searchBoxModel.js'; // 确认已导入
import SteeringIndicator from './steeringIndicator.jsx';
import SearchBox from './search/searchBoxView.jsx';
import NoWebGL from './noWebgl.jsx';
import Help from './help.jsx';
import About from './about.jsx';
import WindowCollection from './windows/windowCollectionView.jsx';
import createNativeRenderer from './native/renderer.js';
import createKeyboardBindings from './native/sceneKeyboardBinding.js';
import appEvents from './service/appEvents.js';

var webglEnabled = require('webgl-enabled')();
module.exports = require('maco')(scene, React);

function scene(x) {
  var nativeRenderer, keyboard, delegateClickHandler;

  // 在构造函数或顶层作用域初始化 state
  x.state = {
    sidebarData: null,
    activeTag: null // 确保 activeTag 在 state 中初始化
  };

  x.render = function() {
    if (!webglEnabled) {
      return <NoWebGL />;
    }
    
    // --- 核心修正: 确保在这里解构 activeTag ---
    const { sidebarData, activeTag } = x.state;

    return (
      <div>
        <div ref='graphContainer' className='graph-full-size'/>
        <HoverInfo />
        <NodeDetails />
        
        <SidebarView 
            data={sidebarData} 
            isOpen={!!sidebarData} 
            activeTag={activeTag} // 将 activeTag 作为 prop 传递下去
        />

        <SteeringIndicator />
        <SearchBox />
        <WindowCollection />
        <Help />
        <About />
      </div>
    );
  };

  x.componentDidMount = function() {
    if (!webglEnabled) return;
    var container = findDOMNode(x.refs.graphContainer);
    nativeRenderer = createNativeRenderer(container);
    keyboard = createKeyboardBindings(container);
    delegateClickHandler = container.parentNode;
    delegateClickHandler.addEventListener('click', handleDelegateClick);

    detailModel.on('changed', updateSidebar);
    appEvents.activeTagChanged.on(updateActiveTag); // 监听激活标签的变化
  };

  x.componentWillUnmount = function() {
    if (nativeRenderer) nativeRenderer.destroy();
    if (keyboard) keyboard.destroy();
    if (delegateClickHandler) delegateClickHandler.removeEventListener('click', handleDelegateClick);
    
    detailModel.off('changed', updateSidebar);
    appEvents.activeTagChanged.off(updateActiveTag); // 取消监听
  };

  // 更新 activeTag state 的函数
  function updateActiveTag() {
      x.setState({
          activeTag: searchBoxModel.getActiveTag()
      });
  }

  function updateSidebar() {
      x.setState({
          sidebarData: detailModel.getSidebarData()
      });
  }

  function handleDelegateClick(e) {
    var clickedEl = e.target;
    var classList = clickedEl.classList;
    var nodeId;

    if (classList.contains('in-degree') || classList.contains('out-degree')) {
      nodeId = parseInt(clickedEl.id, 10);
      var connectionType = classList.contains('in-degree') ? 'in' : 'out';
      appEvents.showDegree.fire(nodeId, connectionType);
    }
    
    if (classList.contains('node-focus')) {
      e.preventDefault(); 
      nodeId = parseInt(clickedEl.id, 10);
      appEvents.focusOnNode.fire(nodeId);
    }
  }
}