// src/galaxy/store/baseNodeViewModel.js

import getGraphSpecificInfo from './graphSepcific/graphSpecificInfo.js';
import scene from './sceneStore.js';
import formatNumber from '../utils/formatNumber.js';
import { isLicenseCompatible } from './licenseUtils.js';

export default getBaseNodeViewModel;

function getBaseNodeViewModel(nodeId) {
    var graphName = scene.getGraphName();
    var graphSpecificInfo = getGraphSpecificInfo(graphName);
    var nodeInfo = scene.getNodeInfo(nodeId) || { name: 'loading...', id: nodeId, in: 0, out: 0};
    var nodeData = {};
    const graphModel = scene.getGraph();

    if (graphModel && typeof graphModel.getNodeData === 'function') {
        const data = graphModel.getNodeData(nodeId);
        if (data) { nodeData = data; }
    }

    // --- [修复 1] 获取合规性数据 (之前这里缺失了！) ---
    let compliance = { isCompliant: true, risks: [], reasons: [] };
    if (graphModel && typeof graphModel.getComplianceDetails === 'function') {
        compliance = graphModel.getComplianceDetails(nodeId);
    }
    // --------------------------------------------------

    const prefixes = {
        license: 'license:',
        base_model: 'base_model:',
        region: 'region:',
        arxiv: 'arxiv:'
    };

    const inheritanceChain = [];
    const visitedModels = new Set();
    
    const licenseTag = (nodeData.tags || []).find(t => typeof t === 'string' && t.startsWith(prefixes.license));
    const licenseFromTag = licenseTag ? licenseTag.substring(prefixes.license.length) : null;
    
    inheritanceChain.push({
        model: nodeInfo.name,
        license: licenseFromTag || nodeData.license || 'N/A',
        level: 0,
        isRoot: false
    });
    visitedModels.add(nodeInfo.name);

    function buildChain(currentModelId, level, parentLicenseForComparison) {
        if (!currentModelId || visitedModels.has(currentModelId)) return;
        visitedModels.add(currentModelId);

        const parentNodeId = scene.getNodeIdByModelId(currentModelId);
        if (parentNodeId === undefined) {
            inheritanceChain.push({ model: currentModelId, license: 'Unknown', level: level, isRoot: true, isCompatible: isLicenseCompatible('Unknown', parentLicenseForComparison) });
            return;
        }
      
        const parentData = graphModel.getNodeData(parentNodeId);
        if (!parentData) {
            inheritanceChain.push({ model: currentModelId, license: 'Unknown', level: level, isRoot: true, isCompatible: isLicenseCompatible('Unknown', parentLicenseForComparison) });
            return;
        }
      
        const parentLicenseTag = (parentData.tags || []).find(t => t.startsWith(prefixes.license));
        const parentLicense = parentLicenseTag ? parentLicenseTag.substring(prefixes.license.length) : (parentData.license || 'N/A');
        const grandParentTags = (parentData.tags || []).filter(t => t.startsWith(prefixes.base_model));

        inheritanceChain.push({
            model: currentModelId,
            license: parentLicense,
            level: level,
            isRoot: grandParentTags.length === 0,
            isCompatible: isLicenseCompatible(parentLicense, parentLicenseForComparison)
        });
      
        grandParentTags.forEach(tag => {
            const grandParentModelId = tag.substring(prefixes.base_model.length);
            buildChain(grandParentModelId, level + 1, parentLicense);
        });
    }

    const baseModelTags = (nodeData.tags || []).filter(t => t.startsWith(prefixes.base_model));
    const currentLicenseForComparison = licenseFromTag || nodeData.license || 'N/A';
    
    baseModelTags.forEach(tag => {
        const baseModelId = tag.substring(prefixes.base_model.length);
        buildChain(baseModelId, 1, currentLicenseForComparison);
    });

    const generalTags = (nodeData.tags || []).filter(t => !Object.values(prefixes).some(p => typeof t ==='string' && t.startsWith(p)));
    const regions = (nodeData.tags || []).filter(t => typeof t === 'string' && t.startsWith(prefixes.region)).map(t => t.substring(prefixes.region.length));
    const arxivs = (nodeData.tags || []).filter(t => typeof t === 'string' && t.startsWith(prefixes.arxiv)).map(t => t.substring(prefixes.arxiv.length));

    return {
        name: nodeInfo.name,
        id: nodeInfo.id,
        inDegree: formatNumber(nodeInfo.in || 0),
        outDegree: formatNumber(nodeInfo.out || 0),
        author: nodeData.author,
        license: licenseFromTag || nodeData.license,
        downloads: formatNumber(nodeData.downloads || 0),
        likes: formatNumber(nodeData.likes || 0),
        tags: generalTags,
        regions: regions,
        arxivs: arxivs,
        inheritanceChain: inheritanceChain,
        // --- [修复 2] 必须返回 compliance 字段 ---
        compliance: compliance 
        // ----------------------------------------
    };
}