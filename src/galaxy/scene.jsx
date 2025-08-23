// src/galaxy/scene.jsx

import React from 'react';
import {findDOMNode} from 'react-dom';
import HoverInfo from './hoverInfo.jsx';
import NodeDetails from './nodeDetails/nodeDetailsView.jsx';
import SidebarView from './SidebarView.jsx';
import detailModel from './nodeDetails/nodeDetailsStore.js';
import searchBoxModel from './search/searchBoxModel.js';
import SteeringIndicator from './steeringIndicator.jsx';
import SearchBox from './search/searchBoxView.jsx';
import NoWebGL from './noWebgl.jsx';
import Help from './help.jsx';
import About from './about.jsx';
import WindowCollection from './windows/windowCollectionView.jsx';
import createNativeRenderer from './native/renderer.js';
import createKeyboardBindings from './native/sceneKeyboardBinding.js';
import licenseStore from './store/licenseStore.js';
import LicenseWindowViewModel from './windows/LicenseWindowViewModel.js';
import LicenseReportViewModel from './windows/LicenseReportViewModel.js';
import ComplianceStatsViewModel from './windows/ComplianceStatsViewModel.js';
import appEvents from './service/appEvents.js';
import Minimap from './Minimap.jsx';
import ComplianceGraphViewModel from './windows/ComplianceGraphViewModel.js';
import complianceStore from './store/licenseComplianceStore.js';
import { isLicenseCompatible } from './store/licenseUtils.js';
import getBaseNodeViewModel from './store/baseNodeViewModel.js';

var webglEnabled = require('webgl-enabled')();
module.exports = require('maco')(scene, React);

function scene(x) {
  var nativeRenderer, keyboard, delegateClickHandler;

  x.state = {
    sidebarData: null,
    activeTag: null 
  };

  x.render = function() {
    if (!webglEnabled) {
      return <NoWebGL />;
    }
    
    const { sidebarData, activeTag } = x.state;

    return (
      <div>
        <div ref='graphContainer' className='graph-full-size'/>
        <HoverInfo />
        <NodeDetails />
        
        <SidebarView 
            data={sidebarData} 
            isOpen={!!sidebarData} 
            activeTag={activeTag}
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
    appEvents.activeTagChanged.on(updateActiveTag);
    appEvents.showLicenseReport.on(showLicenseReportWindow);
    appEvents.showGlobalLicenseStats.on(showGlobalLicenseStats);
    appEvents.showGlobalComplianceStats.on(showGlobalComplianceStats);
    appEvents.showGlobalLicenseReport.on(showGlobalLicenseReport);
  };

  x.componentWillUnmount = function() {
    if (nativeRenderer) nativeRenderer.destroy();
    if (keyboard) keyboard.destroy();
    if (delegateClickHandler) delegateClickHandler.removeEventListener('click', handleDelegateClick);
    
    detailModel.off('changed', updateSidebar);
    appEvents.activeTagChanged.off(updateActiveTag);
    appEvents.showLicenseReport.off(showLicenseReportWindow); 
    appEvents.showGlobalLicenseStats.off(showGlobalLicenseStats);
    appEvents.showGlobalComplianceStats.off(showGlobalComplianceStats);
    appEvents.showGlobalLicenseReport.off(showGlobalLicenseReport);
  };

  function showGlobalLicenseStats() {
    const licenseData = licenseStore.getLicenseData();
    const viewModel = new LicenseWindowViewModel(licenseData);
    appEvents.showNodeListWindow.fire(viewModel, viewModel.id);
  }

  function showGlobalLicenseReport() {
    appEvents.showNodeListWindow.fire(new LicenseReportViewModel());
  }

  function showGlobalComplianceStats() {
    appEvents.showNodeListWindow.fire(new ComplianceStatsViewModel());
  }

  function updateActiveTag() {
      x.setState({
          activeTag: searchBoxModel.getActiveTag()
      });
  }

  function showLicenseReportWindow() {
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

    const addNode = (node) => {
        if (!addedNodeIds.has(node.id)) {
            nodes.push(node);
            addedNodeIds.add(node.id);
        }
    };
    
    if (selectedNode.inheritanceChain && selectedNode.inheritanceChain.length > 0) {
        const chain = selectedNode.inheritanceChain;
        
        chain.forEach(item => {
            addNode({
                id: item.model,
                label: item.model,
                color: item.level === 0 ? '#4CAF50' : (item.isRoot ? '#f44336' : '#2196F3')
            });
        });

        for (let i = 0; i < chain.length - 1; i++) {
            const child = chain[i];
            const parent = chain[i + 1];
            
            edges.push({
                id: `e${edgeCounter++}`,
                source: child.model,
                target: parent.model,
                type: 'arrow',
                fromLicense: child.license,
                toLicense: parent.license,
                isValue: isLicenseCompatible(child.license, parent.license)
            });
        }
    }

    if (outgoing && outgoing.length > 0) {
        outgoing.forEach(childNodeInfo => {
            const childViewModel = getBaseNodeViewModel(childNodeInfo.id);

            addNode({
                id: childViewModel.name,
                label: childViewModel.name,
                color: '#FF9800'
            });
            
            edges.push({
                id: `e${edgeCounter++}`,
                source: selectedNode.name,
                target: childViewModel.name,
                type: 'arrow',
                fromLicense: selectedNode.license,
                toLicense: childViewModel.license,
                isValue: isLicenseCompatible(childViewModel.license, selectedNode.license)
            });
        });
    }

    const localGraphData = { nodes, edges };
    const viewModel = new ComplianceGraphViewModel(localGraphData);
    
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