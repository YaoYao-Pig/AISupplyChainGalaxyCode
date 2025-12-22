// src/galaxy/service/graphLoader.js (包含防缓存和调试日志)

import config from '../../config.js';
import request from './request.js';
import createGraph from './graph.js';
import appEvents from './appEvents.js';
import appConfig from '../native/appConfig.js';
import asyncFor from 'rafor';
import Promise from 'bluebird';

export default loadGraph;

function loadGraph(name, progress) {
  var positions, labels, nodeData, linkTypes, linkData, complianceData; 
  var outLinks = [];
  var inLinks = [];

  var manifestEndpoint = config.dataUrl + name;
  var galaxyEndpoint = manifestEndpoint;

  var manifest;

  return loadManifest()
    .then(loadPositions)
    .then(loadLinks)
    .then(loadLabels)
    .then(loadNodeData)
    .then(loadLinkTypes)
    .then(loadLinkData)
    .then(loadComplianceData) // 加载合规数据
    .then(convertToGraph);

    function convertToGraph() {
      // 调试日志：确认数据是否准备好传递给图模型
      console.log('[GraphLoader] Converting to graph...');
      if (complianceData && Object.keys(complianceData).length > 0) {
        console.log(`[GraphLoader] Compliance data loaded with ${Object.keys(complianceData).length} entries.`);
      } else {
        console.warn('[GraphLoader] Compliance data is empty or missing!');
      }

      const graphData = {
        positions: positions,
        labels: labels,
        outLinks: outLinks,
        inLinks: inLinks,
        nodeData: nodeData,
        linkTypes: linkTypes, 
        linkData: linkData,    
        complianceData: complianceData // 传递数据
      };
    
      return createGraph(graphData);
    }

  function loadManifest() {
    return request(manifestEndpoint + '/manifest.json?nocache=' + (+new Date()), {
      responseType: 'json'
    }).then(setManifest);
  }

  function loadLinkTypes() {
    return request(galaxyEndpoint + '/link_types.json', {
      responseType: 'json',
      progress: reportProgress(name, 'link types')
    }).then(setLinkTypes);
  }
  
  function setLinkTypes(data) {
    linkTypes = data;
  }
  
  function loadLinkData() {
    return request(galaxyEndpoint + '/link_data.bin', {
      responseType: 'arraybuffer',
      progress: reportProgress(name, 'link data')
    }).then(setLinkData);
  }
  
  function setLinkData(buffer) {
    linkData = new Int32Array(buffer);
  }

  function setManifest(response) {
    manifest = response;
    var version = getFromAppConfig(manifest) || manifest.last;
    if (manifest.endpoint) {
      galaxyEndpoint = manifest.endpoint;
    } else {
      galaxyEndpoint = manifestEndpoint;
    }
    galaxyEndpoint += '/' + version;
    appConfig.setManifestVersion(version);
  }

  function getFromAppConfig(manifest) {
    var appConfigVersion = appConfig.getManifestVersion();
    var approvedVersions = manifest && manifest.all;
    if (!approvedVersions || !appConfigVersion) return;
    if (approvedVersions.indexOf(appConfigVersion) >= 0) {
      return appConfigVersion;
    }
  }

  function loadPositions() {
    return request(galaxyEndpoint + '/positions.bin', {
      responseType: 'arraybuffer',
      progress: reportProgress(name, 'positions')
    }).then(setPositions);
  }

  function setPositions(buffer) {
    positions = new Int32Array(buffer);
    var scaleFactor = appConfig.getScaleFactor();
    for (var i = 0; i < positions.length; ++i) {
      positions[i] *= scaleFactor;
    }
    appEvents.positionsDownloaded.fire(positions);
  }

  function loadLinks() {
    return request(galaxyEndpoint + '/links.bin', {
      responseType: 'arraybuffer',
      progress: reportProgress(name, 'links')
    }).then(setLinks);
  }

  function setLinks(buffer) {
    var links = new Int32Array(buffer);
    var lastArray = [];
    outLinks[0] = lastArray;
    var srcIndex;
    var processed = 0;
    var total = links.length;

    asyncFor(links, processLink, reportBack);
    var deffered = defer();

    function processLink(link) {
      if (link < 0) {
        srcIndex = -link - 1;
        lastArray = outLinks[srcIndex] = [];
      } else {
        var toNode = link - 1;
        lastArray.push(toNode);
        if (inLinks[toNode] === undefined) {
          inLinks[toNode] = [srcIndex];
        } else {
          inLinks[toNode].push(srcIndex);
        }
      }
      processed += 1;
      if (processed % 10000 === 0) {
        reportLinkProgress(processed / total);
      }
    }

    function reportLinkProgress(percent) {
      progress({
        message: name + ': initializing edges ',
        completed: Math.round(percent * 100) + '%'
      });
    }

    function reportBack() {
      appEvents.linksDownloaded.fire(outLinks, inLinks);
      deffered.resolve();
    }

    return deffered.promise;
  }

  function loadLabels() {
    return request(galaxyEndpoint + '/labels.json', {
      responseType: 'json',
      progress: reportProgress(name, 'labels')
    }).then(setLabels);
  }

  function setLabels(data) {
    labels = data;
    appEvents.labelsDownloaded.fire(labels);
  }

  function loadNodeData() {
    return request(galaxyEndpoint + '/nodeData.json', {
      responseType: 'json',
      progress: reportProgress(name, 'node data')
    }).then(setNodeData);
  }

  function setNodeData(data) {
    nodeData = data;
  }

  // --- [修复核心 3] 加载合规数据并增加防缓存机制 ---
  function loadComplianceData() {
    // 增加 nocache 参数，防止浏览器缓存旧的空文件
    const url = galaxyEndpoint + '/compliance_data.json?nocache=' + (+new Date());
    console.log('[GraphLoader] Fetching compliance data from:', url);

    return request(url, {
      responseType: 'json',
      progress: reportProgress(name, 'compliance data')
    })
    .catch(function(err) {
      console.warn('[GraphLoader] Could not load compliance data (404 or error), defaulting to empty.', err);
      return {}; 
    })
    .then(setComplianceData);
  }

  function setComplianceData(data) {
    complianceData = data || {};
  }
  // ----------------------------------------------
  
  function reportProgress(name, file) {
    return function(e) {
      let progressInfo = {
        message: name + ': downloading ' + file,
      };
      if (e.percent !== undefined) {
        progressInfo.completed = Math.round(e.percent * 100) + '%'
      } else {
        progressInfo.completed = Math.round(e.loaded) + ' bytes'
      }
      progress(progressInfo);
    };
  }
}

function defer() {
    var resolve, reject;
    var promise = new Promise(function() {
        resolve = arguments[0];
        reject = arguments[1];
    });
    return {
        resolve: resolve,
        reject: reject,
        promise: promise
    };
}