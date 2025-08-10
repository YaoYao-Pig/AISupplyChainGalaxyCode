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
import Minimap from './Minimap.jsx';
import ComplianceGraphViewModel from './windows/ComplianceGraphViewModel.js';
import complianceStore from './store/licenseComplianceStore.js';
import LicenseReportViewModel from './windows/LicenseReportViewModel.js'; // <--- 新增
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
        <Minimap />
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
    appEvents.showLicenseReport.on(showLicenseReportWindow);
  };

  x.componentWillUnmount = function() {
    if (nativeRenderer) nativeRenderer.destroy();
    if (keyboard) keyboard.destroy();
    if (delegateClickHandler) delegateClickHandler.removeEventListener('click', handleDelegateClick);
    
    detailModel.off('changed', updateSidebar);
    appEvents.activeTagChanged.off(updateActiveTag); // 取消监听
    appEvents.showLicenseReport.off(showLicenseReportWindow); 
  };

  // 更新 activeTag state 的函数
  function updateActiveTag() {
      x.setState({
          activeTag: searchBoxModel.getActiveTag()
      });
  }


function showLicenseReportWindow() {
    // 1. 获取当前侧边栏的数据，里面包含了选中的节点信息
    const sidebarData = detailModel.getSidebarData();
    if (!sidebarData || !sidebarData.selectedNode) {
        console.warn('No node selected. Cannot build local graph.');
        return;
    }

    const { selectedNode, outgoing } = sidebarData;
    const addedNodeIds = new Set();
    const nodes = [];
    const edges = [];
    let edgeCounter = 0;

    // 辅助函数：添加节点，同时避免重复
    const addNode = (node) => {
        if (!addedNodeIds.has(node.id)) {
            nodes.push(node);
            addedNodeIds.add(node.id);
        }
    };
    
    // 2. 处理继承链（祖先节点）
    if (selectedNode.inheritanceChain && selectedNode.inheritanceChain.length > 0) {
        const chain = selectedNode.inheritanceChain;
        
        // 添加链上的所有节点
        chain.forEach(item => {
            addNode({
                id: item.model,
                label: item.model,
                // 根据级别和是否为根节点来设定不同颜色
                color: item.level === 0 ? '#4CAF50' : (item.isRoot ? '#f44336' : '#2196F3')
            });
        });

        // 建立链上的连接关系 (从子指向父)
        for (let i = 0; i < chain.length - 1; i++) {
            edges.push({
                id: `e${edgeCounter++}`,
                source: chain[i].model,
                target: chain[i+1].model,
                type: 'arrow' // 使用箭头线
            });
        }
    }

    // 3. 处理直接子节点 (outgoing)
    if (outgoing && outgoing.length > 0) {
        outgoing.forEach(childNode => {
            // 添加子节点
            addNode({
                id: childNode.name,
                label: childNode.name,
                color: '#FF9800' // 为子节点设置不同颜色（橙色）
            });
            
            // 建立从当前节点到子节点的连接 
            edges.push({
                id: `e${edgeCounter++}`,
                source: selectedNode.name,
                target: childNode.name,
                type: 'arrow'
            });
        });
    }

    // 4. 构建图数据并创建视图模型
    const localGraphData = { nodes, edges };
    const viewModel = new ComplianceGraphViewModel(localGraphData);
    
    // 5. 触发事件显示窗口
    appEvents.showNodeListWindow.fire(viewModel, viewModel.id);
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