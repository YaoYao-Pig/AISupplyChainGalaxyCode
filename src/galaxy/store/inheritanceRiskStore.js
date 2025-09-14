import eventify from 'ngraph.events';
import appEvents from '../service/appEvents.js';
import scene from './sceneStore.js';
import getBaseNodeViewModel from '../store/baseNodeViewModel.js';
import complianceStore from './licenseComplianceStore.js';

function createInheritanceRiskStore() {
    let riskData = null;
    const api = {
        getRiskData: () => riskData,
    };
    eventify(api);

    appEvents.graphDownloaded.on(processData);

    function processData() {
        console.log('Processing inheritance risk data...');
        riskData = null; // Reset
        const graph = scene.getGraph();
        if (!graph) return;

        const conflictList = complianceStore.getConflictList();
        const conflictNodeIds = new Set(conflictList.map(c => c.nodeId));
        
        const rawData = graph.getRawData();
        if (!rawData || !rawData.labels) return;

        const nodeCount = rawData.labels.length;
        const data = [];

        for (let i = 0; i < nodeCount; i++) {
            const viewModel = getBaseNodeViewModel(i);
            if (viewModel && viewModel.inheritanceChain) {
                data.push({
                    nodeId: i,
                    name: viewModel.name,
                    depth: viewModel.inheritanceChain.length - 1,
                    hasConflict: conflictNodeIds.has(i)
                });
            }
        }
        riskData = data;
        console.log(`Inheritance risk data ready for ${riskData.length} nodes.`);
        api.fire('changed');
    }

    return api;
}

const inheritanceRiskStore = createInheritanceRiskStore();
export default inheritanceRiskStore;