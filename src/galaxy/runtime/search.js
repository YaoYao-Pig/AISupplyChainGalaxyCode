import scene from '../store/sceneStore.js';

export default search;

function search(query) {
  var graph = scene.getGraph();

  return {
    request: query,
    results: graph.find(query),
  };
}
