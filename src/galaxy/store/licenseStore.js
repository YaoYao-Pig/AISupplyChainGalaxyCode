// src/galaxy/store/licenseStore.js

import eventify from 'ngraph.events';
import appEvents from '../service/appEvents.js';
import scene from './sceneStore.js';

const licenseStore = createLicenseStore();
export default licenseStore;

function createLicenseStore() {
  let licenseData = []; 

  appEvents.graphDownloaded.on(processGraphData);

  const api = {
    getLicenseData: () => licenseData
  };
  eventify(api);

  return api;

  function processGraphData() {
    console.log("Processing license distribution data...");
    const graphModel = scene.getGraph();
    if (!graphModel || !graphModel.getRawData) {
      licenseData = [];
      return;
    }
    const rawData = graphModel.getRawData();
    if (!rawData || !rawData.nodeData) {
      licenseData = [];
      return;
    }

    const licenseCounts = new Map();
    rawData.nodeData.forEach(node => {
      if (node) {
        const license = getLicenseFromNode(node);
        const cleanLicense = (!license || license.toLowerCase() === 'none' || license.toLowerCase() === 'unknown') ? 'N/A' : license;
        licenseCounts.set(cleanLicense, (licenseCounts.get(cleanLicense) || 0) + 1);
      }
    });

    licenseData = Array.from(licenseCounts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value); 
    
    console.log("License distribution data ready.");
    api.fire('changed', licenseData);
  }

  function getLicenseFromNode(nodeData) {
      if (!nodeData) return 'N/A';
      const licenseTag = (nodeData.tags || []).find(t => typeof t === 'string' && t.startsWith('license:'));
      return licenseTag ? licenseTag.substring(8) : (nodeData.license || 'N/A');
  }
}